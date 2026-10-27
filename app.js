/* Formulario de solicitud de cotización — se construye completo a partir de config.js */
(function () {
  "use strict";

  var C = window.APP_CONFIG;
  var DRAFT_KEY = "quoteFormDraft:v1";

  var sections = C.sections.filter(function (s) { return s.enabled !== false; });
  var params = new URLSearchParams(location.search);

  var state = {
    locale: pickLocale(),
    step: 0,
    agent: findAgent(params.get(C.agentParam)),
    data: {},
    consent: false,
    sending: false,
    done: false,
    error: "",
    info: ""
  };
  sections.forEach(function (s) { state.data[s.id] = s.repeatable ? [] : {}; });

  var app = document.getElementById("app");

  /* ---------- Utilidades ---------- */

  function pickLocale() {
    var q = params.get("lang");
    return C.locale.available.indexOf(q) >= 0 ? q : C.locale.default;
  }

  function findAgent(id) {
    if (!id) return null;
    for (var i = 0; i < C.agents.length; i++) if (C.agents[i].id === id) return C.agents[i];
    return null;
  }

  // Resuelve un texto que puede ser string u objeto por idioma
  function t(x, locale) {
    if (x == null) return "";
    if (typeof x === "string") return x;
    var l = locale || state.locale;
    return x[l] != null ? x[l] : (x[C.locale.default] != null ? x[C.locale.default] : "");
  }
  function ui(key, locale) { return t(C.ui[key], locale); }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  function enabledFields(section) {
    return section.fields.filter(function (f) { return f.enabled !== false; });
  }

  function optionsOf(field) {
    return typeof field.options === "string" ? (C.optionLists[field.options] || []) : (field.options || []);
  }

  function yesNoOptions() {
    return [{ value: "yes", label: C.ui.yes }, { value: "no", label: C.ui.no }];
  }

  function isVisible(field, record) {
    var cond = field.showIf;
    if (!cond) return true;
    var v = record[cond.field];
    if (v == null || v === "") return false;
    if (cond.in) return cond.in.indexOf(v) >= 0;
    if (cond.notIn) return cond.notIn.indexOf(v) < 0;
    return true;
  }

  function digits(v) { return String(v || "").replace(/\D/g, ""); }

  // Máscaras de escritura
  var masks = {
    ssn: function (v) {
      var d = digits(v).slice(0, 9);
      if (d.length > 5) return d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5);
      if (d.length > 3) return d.slice(0, 3) + "-" + d.slice(3);
      return d;
    },
    tel: function (v) {
      var d = digits(v);
      if (d.length === 11 && d[0] === "1") d = d.slice(1);
      d = d.slice(0, 10);
      if (d.length > 6) return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
      if (d.length > 3) return "(" + d.slice(0, 3) + ") " + d.slice(3);
      return d;
    },
    zip: function (v) { return digits(v).slice(0, 5); },
    money: function (v) {
      var d = digits(v).slice(0, 9);
      return d ? Number(d).toLocaleString("en-US") : "";
    }
  };

  function formatDate(iso, locale) {
    if (!iso) return "";
    var p = iso.split("-");
    return locale === "en" ? p[1] + "/" + p[2] + "/" + p[0] : p[2] + "/" + p[1] + "/" + p[0];
  }

  function maskSensitive(v) {
    var d = digits(v);
    return d.length >= 4 ? "•••• " + d.slice(-4) : "••••";
  }

  // Valor legible de un campo, en el idioma pedido
  function displayValue(field, value, locale, hideSensitive) {
    if (value == null || value === "") return "";
    if (hideSensitive && field.sensitive) return maskSensitive(value);
    if (field.type === "date") return formatDate(value, locale);
    if (field.type === "money") return "$" + value;
    if (field.type === "yesno") return ui(value === "yes" ? "yes" : "no", locale);
    if (field.type === "select" || field.type === "radio") {
      var o = optionsOf(field).filter(function (x) { return x.value === value; })[0];
      return o ? t(o.label, locale) : value;
    }
    return String(value);
  }

  /* ---------- Borrador local (sin campos sensibles) ---------- */

  function saveDraft() {
    if (!C.saveDraft) return;
    var clean = {};
    sections.forEach(function (s) {
      var strip = function (rec) {
        var o = {};
        Object.keys(rec).forEach(function (k) {
          var f = s.fields.filter(function (x) { return x.id === k; })[0];
          if (f && !f.sensitive) o[k] = rec[k];
        });
        return o;
      };
      clean[s.id] = s.repeatable ? state.data[s.id].map(strip) : strip(state.data[s.id]);
    });
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: clean, step: state.step })); } catch (e) { /* sin almacenamiento */ }
  }

  function loadDraft() {
    if (!C.saveDraft) return;
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      sections.forEach(function (s) { if (d.data && d.data[s.id]) state.data[s.id] = d.data[s.id]; });
      state.step = Math.min(d.step || 0, sections.length);
      state.info = ui("draftRestored");
    } catch (e) { /* borrador inválido */ }
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- Validación ---------- */

  function validateField(field, value) {
    var empty = value == null || String(value).trim() === "";
    if (empty) return field.required ? ui("required") : "";
    switch (field.type) {
      case "email": if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return ui("invalidEmail"); break;
      case "ssn": if (digits(value).length !== 9) return ui("invalidSsn"); break;
      case "zip": if (digits(value).length !== 5) return ui("invalidZip"); break;
      case "tel": if (digits(value).length !== 10) return ui("invalidPhone"); break;
      case "date":
        var d = new Date(value + "T00:00:00");
        if (isNaN(d) || d > new Date() || d.getFullYear() < 1900) return ui("invalidDate");
        break;
    }
    if (field.pattern && !new RegExp(field.pattern).test(value)) return ui("invalidFormat");
    return "";
  }

  function validateRecord(section, record) {
    var errors = {};
    enabledFields(section).forEach(function (f) {
      if (!isVisible(f, record)) return;
      var e = validateField(f, record[f.id]);
      if (e) errors[f.id] = e;
    });
    return errors;
  }

  function validateStep(i) {
    var s = sections[i];
    var ok = true;
    var records = s.repeatable ? state.data[s.id] : [state.data[s.id]];
    records.forEach(function (rec, idx) {
      var errs = validateRecord(s, rec);
      var scope = app.querySelector('[data-record="' + s.id + ":" + idx + '"]');
      if (scope) showErrors(scope, errs);
      if (Object.keys(errs).length) ok = false;
    });
    return ok;
  }

  function showErrors(scope, errs) {
    scope.querySelectorAll(".field").forEach(function (w) {
      var msg = errs[w.getAttribute("data-field")] || "";
      w.classList.toggle("has-error", !!msg);
      w.querySelector(".err").textContent = msg;
    });
    var first = scope.querySelector(".has-error input, .has-error select");
    if (first) first.focus();
  }

  /* ---------- Campos ---------- */

  function renderField(field, record, scopeId, onChange) {
    var inputId = scopeId + "-" + field.id;
    var value = record[field.id] || "";
    var control;

    var set = function (v) {
      record[field.id] = v;
      wrap.classList.remove("has-error");
      onChange();
    };

    if (field.type === "radio" || field.type === "yesno") {
      var opts = field.type === "yesno" ? yesNoOptions() : optionsOf(field);
      control = el("div", { class: "chips", role: "radiogroup", "aria-labelledby": inputId + "-l" },
        opts.map(function (o) {
          return el("label", { class: "chip" }, [
            el("input", { type: "radio", name: inputId, value: o.value, checked: value === o.value,
              onchange: function () { set(o.value); } }),
            el("span", { text: t(o.label) })
          ]);
        }));
    } else if (field.type === "select") {
      control = el("select", { id: inputId, onchange: function (e) { set(e.target.value); } },
        [el("option", { value: "", text: ui("select") })].concat(optionsOf(field).map(function (o) {
          return el("option", { value: o.value, selected: value === o.value, text: t(o.label) });
        })));
    } else if (field.type === "textarea") {
      control = el("textarea", { id: inputId, rows: 3, oninput: function (e) { set(e.target.value); } });
      control.value = value;
    } else {
      var typeMap = { email: "email", tel: "tel", date: "date", number: "number" };
      var modeMap = { ssn: "numeric", zip: "numeric", money: "numeric", tel: "tel", number: "decimal" };
      var input = el("input", {
        id: inputId,
        type: typeMap[field.type] || "text",
        inputmode: modeMap[field.type],
        placeholder: t(field.placeholder) || (field.type === "ssn" ? "000-00-0000" : field.type === "tel" ? "(000) 000-0000" : null),
        maxlength: field.maxLength,
        max: field.type === "date" ? new Date().toISOString().slice(0, 10) : null,
        autocomplete: field.type === "ssn" ? "off" : null
      });
      input.value = value;
      input.addEventListener("input", function () {
        var mask = masks[field.type];
        if (mask) input.value = mask(input.value);
        set(input.value);
      });
      control = field.type === "money" ? el("div", { class: "money" }, [el("span", { text: "$" }), input]) : input;
    }

    var labelTag = field.type === "radio" || field.type === "yesno" ? "span" : "label";
    var wrap = el("div", { class: "field w-" + (field.width || "full"), "data-field": field.id }, [
      el(labelTag, { class: labelTag === "span" ? "label" : null, for: labelTag === "label" ? inputId : null, id: inputId + "-l" }, [
        t(field.label),
        field.required ? null : el("span", { class: "opt", text: " (" + ui("optional") + ")" })
      ]),
      control,
      field.help ? el("div", { class: "help", text: t(field.help) }) : null,
      el("div", { class: "err", role: "alert" })
    ]);
    return wrap;
  }

  function renderRecord(section, record, idx) {
    var scopeId = section.id + "-" + idx;
    var grid = el("div", { class: "grid", "data-record": section.id + ":" + idx });
    var fields = enabledFields(section);
    var wraps = [];
    var refresh = function () {
      fields.forEach(function (f, i) { wraps[i].hidden = !isVisible(f, record); });
      saveDraft();
      updateSummary();
    };
    fields.forEach(function (f) {
      var w = renderField(f, record, scopeId, refresh);
      wraps.push(w);
      grid.appendChild(w);
    });
    refresh();
    return grid;
  }

  /* ---------- Pantallas ---------- */

  var ICONS = {
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>',
    back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3L5 8l5 5"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  function icon(name, cls) {
    var s = el("span", { class: cls || null, "aria-hidden": "true" });
    s.innerHTML = ICONS[name];
    return s;
  }

  function renderTopbar() {
    var logo = C.brand.logo
      ? el("div", { class: "logo" }, [el("img", { src: C.brand.logo, alt: C.brand.name })])
      : el("div", { class: "logo", "aria-label": C.brand.name }, [
          el("span", { class: "logo__name", text: C.brand.name }),
          el("span", { class: "logo__rule" }, [el("i"), el("i")]),
          C.brand.logoSub ? el("span", { class: "logo__sub", text: C.brand.logoSub }) : null
        ]);

    var langs = C.locale.available.length > 1 ? el("div", { class: "lang-switch" },
      C.locale.available.map(function (l) {
        return el("button", { type: "button", "aria-pressed": String(l === state.locale), text: l.toUpperCase(),
          onclick: function () { state.locale = l; render(); } });
      })) : null;

    return el("header", { class: "topbar" }, [
      logo,
      el("div", { class: "topbar__right" }, [
        el("span", { class: "secure" }, [icon("lock"), ui("secure")]),
        langs
      ])
    ]);
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function stepTitle(i) {
    return i < sections.length ? t(sections[i].title) : ui("review");
  }

  function renderSteps() {
    var items = [];
    for (var i = 0; i <= sections.length; i++) {
      (function (i) {
        var status = i === state.step ? "is-current" : i < state.step ? "is-done" : "";
        items.push(el("li", { class: status || null }, [
          el("button", { type: "button", disabled: i >= state.step, "aria-current": i === state.step ? "step" : null,
            onclick: function () { if (i < state.step) go(i); } }, [
            i < state.step ? icon("check", "num") : el("span", { class: "num", text: String(i + 1) }),
            stepTitle(i)
          ])
        ]));
      })(i);
    }
    return el("div", { class: "panel steps-panel" }, [
      el("p", { class: "panel__title", text: ui("stepsTitle") }),
      el("ol", { class: "steps" }, items)
    ]);
  }

  /* Datos del resumen calculados con lo que el cliente va llenando */
  function summaryValues() {
    var holder = state.data.holder || {};
    var members = state.data.members || [];
    var money = function (v) { return Number(digits(v)) || 0; };
    var income = money(holder.annualIncome);
    var applicants = 1;
    members.forEach(function (m) {
      income += money(m.annualIncome);
      if (m.isApplicant === "yes") applicants++;
    });
    var place = [holder.city, [holder.state, holder.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    return {
      householdIncome: "$" + income.toLocaleString("en-US"),
      householdSize: String(1 + members.length),
      applicants: String(applicants),
      location: place || "—"
    };
  }

  function renderSummary() {
    var v = summaryValues();
    var s = C.summary;
    var c = C.brand.contact || {};
    var contact = [];
    if (c.phone) contact.push(el("a", { href: "tel:" + digits(c.phone), text: c.phone }));
    if (c.email) contact.push(el("a", { href: "mailto:" + c.email, text: c.email }));
    if (c.whatsapp) contact.push(el("a", { href: "https://wa.me/" + digits(c.whatsapp), target: "_blank", rel: "noopener", text: "WhatsApp" }));

    return el("div", { class: "summary-wrap", style: "display:grid;gap:20px" }, [
      el("div", { class: "panel summary" }, [
        el("p", { class: "panel__title", text: ui("summaryTitle") }),
        s.highlight ? el("div", { class: "summary__big" }, [
          el("small", { text: ui(s.highlight) }),
          el("div", { class: "summary__amount", text: v[s.highlight] })
        ]) : null,
        el("dl", null, s.items.map(function (k) {
          return el("div", null, [el("dt", { text: ui(k) }), el("dd", { text: v[k] })]);
        })),
        el("div", { class: "summary__agent" }, [
          state.agent ? el("span", null, [ui("agent"), el("strong", { text: state.agent.name })]) : null,
          el("span", { style: state.agent ? "display:block;margin-top:8px" : null }, [ui("date") + ": " + formatDate(todayIso(), state.locale)])
        ])
      ]),
      contact.length ? el("div", { class: "panel contact" }, [el("p", { class: "panel__title", text: ui("contactTitle") })].concat(contact)) : null
    ]);
  }

  var summaryHost = null;
  function updateSummary() {
    if (!summaryHost || !C.summary.enabled) return;
    summaryHost.innerHTML = "";
    summaryHost.appendChild(renderSummary());
  }

  function renderSection(section) {
    var body = [];

    if (section.repeatable) {
      var list = state.data[section.id];
      if (!list.length) body.push(el("div", { class: "empty", text: ui("noMembers") }));
      list.forEach(function (rec, idx) {
        body.push(el("div", { class: "member" }, [
          el("div", { class: "member__head" }, [
            el("h3", { class: "member__title" }, [el("span", { class: "member__num", text: String(idx + 1) }), t(section.itemTitle) + " #" + (idx + 1)]),
            el("button", { type: "button", class: "btn-link", text: ui("remove"),
              onclick: function () { list.splice(idx, 1); saveDraft(); render(); } })
          ]),
          renderRecord(section, rec, idx)
        ]));
      });
      if (list.length < (C.members.max || 10)) {
        body.push(el("button", { type: "button", class: "btn btn-add", text: "+ " + t(section.addLabel),
          onclick: function () {
            list.push({});
            render();
            var all = app.querySelectorAll(".member");
            var last = all[all.length - 1];
            if (last) { last.scrollIntoView({ behavior: "smooth", block: "start" }); var i = last.querySelector("input"); if (i) i.focus({ preventScroll: true }); }
          } }));
      }
    } else {
      body.push(renderRecord(section, state.data[section.id], 0));
    }
    return body;
  }

  function reviewList(section, record) {
    var items = [];
    enabledFields(section).forEach(function (f) {
      if (!isVisible(f, record)) return;
      var v = displayValue(f, record[f.id], state.locale, true);
      if (!v) return;
      items.push(el("div", null, [el("dt", { text: t(f.label) }), el("dd", { text: v })]));
    });
    return el("dl", { class: "kv" }, items);
  }

  function renderReview() {
    var blocks = sections.map(function (s, i) {
      var content;
      if (s.repeatable) {
        var list = state.data[s.id];
        content = list.length ? list.map(function (rec, idx) {
          return el("div", { class: "sub" }, [el("div", { class: "review-head" }, [el("h4", { text: t(s.itemTitle) + " #" + (idx + 1) })]), reviewList(s, rec)]);
        }) : [el("p", { class: "section-intro", style: "margin:0", text: ui("noMembers") })];
      } else {
        content = [reviewList(s, state.data[s.id])];
      }
      return el("div", { class: "review-block" }, [
        el("div", { class: "review-head" }, [
          el("h3", { text: t(s.title) }),
          el("button", { type: "button", class: "btn-edit", text: ui("edit"), onclick: function () { go(i); } })
        ])
      ].concat(content));
    });

    var consent = C.consent.enabled ? el("label", { class: "consent" }, [
      el("input", { type: "checkbox", checked: state.consent, onchange: function (e) { state.consent = e.target.checked; } }),
      el("span", { text: t(C.consent.text) })
    ]) : null;

    return blocks.concat([consent]);
  }

  function renderNav() {
    var last = state.step === sections.length;
    var primary = function (label, onclick) {
      return el("button", { type: "button", class: "btn btn-primary", disabled: state.sending, onclick: onclick }, [label, icon("arrow", "arrow")]);
    };
    return el("div", { class: "nav" }, [
      state.step > 0 ? el("button", { type: "button", class: "btn btn-back", "aria-label": ui("back"), title: ui("back"),
        onclick: function () { go(state.step - 1); } }, [icon("back")]) : null,
      last ? primary(state.sending ? ui("sending") : ui("submit"), submit) : primary(ui("next"), next)
    ]);
  }

  function renderCard(children) {
    var total = sections.length + 1;
    var pct = state.done ? 100 : (state.step + 1) / total * 100;
    return el("section", { class: "card" }, [
      el("div", { class: "card__progress", "aria-hidden": "true" }, [el("span", { style: "width:" + pct + "%" })]),
      el("div", { class: "card__body" }, children)
    ]);
  }

  function render() {
    document.documentElement.lang = state.locale;
    document.documentElement.style.setProperty("--primary", C.brand.colors.primary);
    document.documentElement.style.setProperty("--accent", C.brand.colors.accent);
    document.documentElement.style.setProperty("--bg", C.brand.colors.background);
    document.title = C.brand.name + " — " + t(C.brand.tagline);

    app.innerHTML = "";
    app.appendChild(renderTopbar());

    var main;
    if (C.requireAgentLink && !state.agent) {
      main = renderCard([el("p", { class: "section-intro", style: "margin:0", text: ui("invalidAgent") })]);
    } else if (state.done) {
      main = renderCard([el("div", { class: "done" }, [
        icon("check", "done__icon"),
        el("h2", { class: "section-title", text: ui("successTitle") }),
        el("p", { class: "section-intro", text: ui("successText") })
      ])]);
    } else {
      var isReview = state.step === sections.length;
      var section = sections[state.step];
      var notices = [];
      if (!C.endpoint) notices.push(el("div", { class: "notice notice-info", text: ui("testMode") }));
      if (state.info) notices.push(el("div", { class: "notice notice-info", text: state.info }));
      if (state.error) notices.push(el("div", { class: "notice notice-error", role: "alert", text: state.error }));

      main = renderCard(notices.concat([
        el("div", { class: "eyebrow" }, [ui("step") + " " + (state.step + 1) + " ", el("span", { text: ui("of") + " " + (sections.length + 1) })]),
        el("h1", { class: "section-title", text: isReview ? ui("review") : t(section.title) }),
        el("p", { class: "section-intro", text: isReview ? ui("reviewIntro") : t(section.intro) })
      ], isReview ? renderReview() : renderSection(section), [
        renderNav(),
        // Trampa para bots: los humanos no ven este campo
        el("div", { class: "hp", "aria-hidden": "true" }, [el("input", { type: "text", id: "website", tabindex: "-1", autocomplete: "off" })])
      ]));
    }

    summaryHost = el("div");
    var aside = el("aside", { class: "aside" }, [
      state.done || (C.requireAgentLink && !state.agent) ? null : renderSteps(),
      C.summary.enabled ? summaryHost : null
    ]);
    app.appendChild(el("div", { class: "layout" }, [main, aside]));
    app.appendChild(el("footer", { class: "footer", text: t(C.brand.footer) }));
    updateSummary();
  }

  function go(i) {
    state.step = i;
    state.error = "";
    state.info = "";
    saveDraft();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    if (!validateStep(state.step)) { state.error = ""; return; }
    go(state.step + 1);
  }

  /* ---------- Envío ---------- */

  // Arma los datos para la agente: crudos (para la hoja) y legibles en el idioma de la oficina
  function buildPayload() {
    var office = C.locale.office || C.locale.default;
    var display = sections.map(function (s) {
      var toRows = function (rec) {
        return enabledFields(s).filter(function (f) { return isVisible(f, rec); }).map(function (f) {
          return { id: f.id, label: t(f.label, office), value: displayValue(f, rec[f.id], office, false), sensitive: !!f.sensitive };
        });
      };
      return {
        id: s.id,
        title: t(s.title, office),
        repeatable: !!s.repeatable,
        itemTitle: t(s.itemTitle, office),
        records: s.repeatable ? state.data[s.id].map(toRows) : [toRows(state.data[s.id])]
      };
    });
    return {
      submittedAt: new Date().toISOString(),
      locale: state.locale,
      agentId: state.agent ? state.agent.id : "",
      agentName: state.agent ? state.agent.name : "",
      consent: C.consent.enabled ? state.consent : null,
      consentText: C.consent.enabled ? t(C.consent.text, office) : "",
      website: (document.getElementById("website") || {}).value || "",
      display: display,
      data: state.data
    };
  }

  function submit() {
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var recs = s.repeatable ? state.data[s.id] : [state.data[s.id]];
      for (var j = 0; j < recs.length; j++) {
        if (Object.keys(validateRecord(s, recs[j])).length) { go(i); setTimeout(function () { validateStep(state.step); }, 0); return; }
      }
    }
    if (C.consent.enabled && !state.consent) { state.error = ui("consentRequired"); render(); return; }

    var payload = buildPayload();
    if (!C.endpoint) {
      console.log("[Modo de prueba] Datos que se enviarían:", payload);
      finish();
      return;
    }

    state.sending = true;
    state.error = "";
    render();
    // text/plain evita la consulta previa CORS que Google Apps Script no responde
    fetch(C.endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error);
        finish();
      })
      .catch(function () {
        state.sending = false;
        state.error = ui("errorSend");
        render();
      });
  }

  function finish() {
    clearDraft();
    state.sending = false;
    state.done = true;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  loadDraft();
  render();
})();
