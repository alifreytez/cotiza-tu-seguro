/**
 * CONFIGURACIÓN DEL FORMULARIO
 * ---------------------------------------------------------------
 * Todo lo que se puede cambiar sin tocar código está aquí:
 * marca, colores, agentes, textos, secciones y campos.
 *
 * Textos: pueden ser un texto simple ("Nombre") o un objeto por idioma
 * ({ es: "Nombre", en: "Name" }).
 *
 * Campos (fields):
 *   id          identificador interno en inglés (único dentro de la sección)
 *   label       etiqueta visible
 *   type        text | email | tel | date | number | money | select | radio |
 *               yesno | ssn | zip | textarea
 *   required    true/false
 *   enabled     false para ocultarlo sin borrarlo
 *   width       full | half | third
 *   options     nombre de una lista en `optionLists` o un arreglo propio
 *   showIf      { field: "id", in: ["valor", ...] } muestra el campo solo si otro campo tiene ese valor
 *   sensitive   true = se enmascara en el correo (ej. SSN) y no se guarda en borrador
 *   placeholder, help, pattern (regex), maxLength
 */
window.APP_CONFIG = {
  /* ---------- Marca ---------- */
  brand: {
    name: "Cotiza tu Seguro", // nombre principal del logo de texto
    logoSub: "Seguro de salud", // línea pequeña bajo el nombre. Vacío = sin línea
    tagline: { es: "Solicitud de cotización de seguro de salud", en: "Health insurance quote request" },
    logo: "", // ruta o URL de la imagen del logo (ej. "assets/logo.svg"). Vacío = logo de texto
    colors: {
      primary: "#2b2d7c",   // color principal (títulos, opciones elegidas, panel de resumen)
      accent: "#3ee6c4",    // color de acento (progreso, botón continuar, montos)
      background: "#eceef3" // fondo de la página
    },
    contact: {
      phone: "",            // ej. "+1 (305) 000-0000" — se muestra en el pie
      email: "",
      whatsapp: ""          // solo números con código de país, ej. "13050000000"
    },
    footer: { es: "Tus datos se tratan de forma confidencial.", en: "Your information is kept confidential." }
  },

  /* ---------- Idiomas ---------- */
  locale: {
    default: "es",          // idioma con que abre el formulario
    available: ["es", "en"],
    office: "es"            // idioma en que le llegan los datos a la agente (correo y hoja)
  },

  /* ---------- Envío ---------- */
  // URL de la aplicación web de Google Apps Script (ver README). Vacío = modo de prueba (no envía).
  endpoint: "https://script.google.com/macros/s/AKfycbxSSy3Uf2Ne_t4agz-i_RVYgEs40JgE01_E1tCXgEndeSvBbIorBQr2NxEVJrHqJl_4/exec",

  /* ---------- Agentes ----------
     Cada agente comparte su propio link: https://tusitio.com/?agente=<id>
     Los CORREOS de los agentes NO van aquí (esta página es pública); van en apps-script/Config.gs */
  agentParam: "agente",
  agents: [
    { id: "alirio", name: "Alirio Freytez" }
  ],
  requireAgentLink: false,  // true = el formulario no abre si el link no trae un agente válido

  /* ---------- Comportamiento ---------- */
  members: { max: 10 },             // máximo de miembros de familia que se pueden agregar
  saveDraft: true,                  // guarda el avance en el dispositivo (nunca los campos sensibles)
  consent: {
    enabled: true,
    text: {
      es: "Autorizo a la agencia y a su agente a usar esta información para cotizar e inscribirme en un plan de seguro de salud, y confirmo que los datos son correctos.",
      en: "I authorize the agency and its agent to use this information to quote and enroll me in a health insurance plan, and I confirm the information is correct."
    }
  },

  /* ---------- Panel de resumen (columna derecha) ----------
     Se actualiza mientras el cliente escribe. Elementos disponibles:
     householdIncome (monto grande), householdSize, applicants, location */
  summary: {
    enabled: true,
    highlight: "householdIncome",
    items: ["householdSize", "applicants", "location"]
  },

  /* ---------- Listas de opciones reutilizables ---------- */
  optionLists: {
    sex: [
      { value: "M", label: { es: "Masculino", en: "Male" } },
      { value: "F", label: { es: "Femenino", en: "Female" } }
    ],
    maritalStatus: [
      { value: "single", label: { es: "Soltero(a)", en: "Single" } },
      { value: "married", label: { es: "Casado(a)", en: "Married" } },
      { value: "divorced", label: { es: "Divorciado(a)", en: "Divorced" } },
      { value: "widowed", label: { es: "Viudo(a)", en: "Widowed" } },
      { value: "domestic_partner", label: { es: "Concubino(a)", en: "Domestic partner" } }
    ],
    incomeType: [
      { value: "W-2", label: "W-2" },
      { value: "1099", label: "1099" },
      { value: "other", label: { es: "Otro", en: "Other" } },
      { value: "none", label: { es: "Sin ingresos", en: "No income" } }
    ],
    immigrationStatus: [
      { value: "citizen", label: { es: "Ciudadano(a)", en: "U.S. citizen" } },
      { value: "resident", label: { es: "Residente permanente", en: "Permanent resident" } },
      { value: "work_permit", label: { es: "Permiso de trabajo", en: "Work permit" } },
      { value: "asylum", label: { es: "Asilo / asilo pendiente", en: "Asylum / pending asylum" } },
      { value: "parole", label: { es: "Parole humanitario", en: "Humanitarian parole" } },
      { value: "tps", label: "TPS" },
      { value: "other", label: { es: "Otro", en: "Other" } }
    ],
    relationship: [
      { value: "spouse", label: { es: "Cónyuge", en: "Spouse" } },
      { value: "child", label: { es: "Hijo(a)", en: "Child" } },
      { value: "stepchild", label: { es: "Hijastro(a)", en: "Stepchild" } },
      { value: "parent", label: { es: "Padre / madre", en: "Parent" } },
      { value: "sibling", label: { es: "Hermano(a)", en: "Sibling" } },
      { value: "partner", label: { es: "Pareja", en: "Partner" } },
      { value: "other", label: { es: "Otro", en: "Other" } }
    ],
    usStates: [
      "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
      "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
      "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
    ].map(function (s) { return { value: s, label: s }; })
  },

  /* ---------- Secciones y campos ----------
     Cada sección es un paso del formulario. `repeatable: true` = bloque que el cliente
     puede agregar varias veces (miembros de la familia). */
  sections: [
    {
      id: "holder",
      title: { es: "Datos del titular", en: "Primary applicant" },
      intro: { es: "La persona principal que solicita el seguro.", en: "The main person applying for coverage." },
      fields: [
        { id: "fullName", label: { es: "Nombres y apellidos", en: "Full name" }, type: "text", required: true, width: "full" },
        { id: "dob", label: { es: "Fecha de nacimiento", en: "Date of birth" }, type: "date", required: true, width: "half" },
        { id: "sex", label: { es: "Sexo", en: "Sex" }, type: "radio", options: "sex", required: true, width: "half" },
        { id: "maritalStatus", label: { es: "Estado civil", en: "Marital status" }, type: "select", options: "maritalStatus", required: true, width: "half" },
        { id: "tobacco", label: { es: "¿Usa tabaco?", en: "Tobacco use?" }, type: "yesno", required: true, width: "half",
          help: { es: "Afecta el precio del seguro.", en: "It affects the premium." } },
        { id: "address", label: { es: "Dirección", en: "Street address" }, type: "text", required: true, width: "full" },
        { id: "apt", label: { es: "Apt / Unit #", en: "Apt / Unit #" }, type: "text", width: "third" },
        { id: "city", label: { es: "Ciudad", en: "City" }, type: "text", required: true, width: "third" },
        { id: "state", label: { es: "Estado", en: "State" }, type: "select", options: "usStates", required: true, width: "third" },
        { id: "zip", label: { es: "Zip Code", en: "Zip code" }, type: "zip", required: true, width: "third" },
        { id: "weight", label: { es: "Peso (lb)", en: "Weight (lb)" }, type: "number", width: "third", enabled: true },
        { id: "height", label: { es: "Talla / estatura", en: "Height" }, type: "text", width: "third", placeholder: "5'7\"", enabled: true },
        { id: "phone", label: { es: "Teléfono", en: "Phone" }, type: "tel", required: true, width: "half" },
        { id: "email", label: { es: "E-mail", en: "Email" }, type: "email", required: true, width: "half" },
        { id: "immigrationStatus", label: { es: "Estatus migratorio", en: "Immigration status" }, type: "select", options: "immigrationStatus", required: true, width: "half" },
        { id: "uscisNumber", label: { es: "USCIS #", en: "USCIS #" }, type: "text", width: "half", sensitive: true,
          showIf: { field: "immigrationStatus", notIn: ["citizen"] } },
        { id: "documentNumber", label: { es: "Número de documento", en: "Document number" }, type: "text", width: "half", sensitive: true,
          showIf: { field: "immigrationStatus", notIn: ["citizen"] } },
        { id: "documentCategory", label: { es: "Categoría", en: "Category" }, type: "text", width: "half", placeholder: "C08, C09…",
          showIf: { field: "immigrationStatus", notIn: ["citizen"] } },
        { id: "ssn", label: { es: "SSN (Seguro Social)", en: "SSN" }, type: "ssn", width: "half", sensitive: true,
          help: { es: "Si no tiene, déjelo en blanco.", en: "Leave blank if you don't have one." } },
        { id: "employerName", label: { es: "Nombre del empleador", en: "Employer name" }, type: "text", width: "half" },
        { id: "employerPhone", label: { es: "Teléfono del empleador", en: "Employer phone" }, type: "tel", width: "half" },
        { id: "annualIncome", label: { es: "Ingreso anual", en: "Annual income" }, type: "money", required: true, width: "half",
          help: { es: "Lo que espera ganar este año, antes de impuestos.", en: "Expected income this year, before taxes." } },
        { id: "incomeType", label: { es: "Tipo de ingreso", en: "Income type" }, type: "radio", options: "incomeType", required: true, width: "full" }
      ]
    },
    {
      id: "members",
      repeatable: true,
      title: { es: "Miembros de la familia", en: "Household members" },
      intro: { es: "Agregue a cada persona del hogar (cónyuge, hijos, dependientes). Si vive solo, puede continuar.",
               en: "Add each person in the household (spouse, children, dependents). If you live alone, you can continue." },
      itemTitle: { es: "Miembro", en: "Member" },
      addLabel: { es: "Agregar miembro", en: "Add member" },
      fields: [
        { id: "fullName", label: { es: "Nombres y apellidos", en: "Full name" }, type: "text", required: true, width: "full" },
        { id: "dob", label: { es: "Fecha de nacimiento", en: "Date of birth" }, type: "date", required: true, width: "half" },
        { id: "relationship", label: { es: "Relación con el titular", en: "Relationship" }, type: "select", options: "relationship", required: true, width: "half" },
        { id: "isApplicant", label: { es: "¿Solicita seguro?", en: "Applying for coverage?" }, type: "yesno", required: true, width: "half" },
        { id: "tobacco", label: { es: "¿Usa tabaco?", en: "Tobacco use?" }, type: "yesno", width: "half",
          showIf: { field: "isApplicant", in: ["yes"] } },
        { id: "legalStatus", label: { es: "Estatus legal", en: "Legal status" }, type: "select", options: "immigrationStatus", required: true, width: "half" },
        { id: "documentNumber", label: { es: "N° de documento", en: "Document number" }, type: "text", width: "half", sensitive: true,
          showIf: { field: "legalStatus", notIn: ["citizen"] } },
        { id: "ssn", label: { es: "SSN", en: "SSN" }, type: "ssn", width: "half", sensitive: true },
        { id: "employerName", label: { es: "Empleador", en: "Employer" }, type: "text", width: "half" },
        { id: "annualIncome", label: { es: "Ingreso anual", en: "Annual income" }, type: "money", width: "half" },
        { id: "incomeType", label: { es: "Tipo de ingreso", en: "Income type" }, type: "radio", options: "incomeType", width: "full" }
      ]
    }
  ],

  /* ---------- Textos de la interfaz ---------- */
  ui: {
    agent: { es: "Agente", en: "Agent" },
    date: { es: "Fecha", en: "Date" },
    step: { es: "Paso", en: "Step" },
    of: { es: "de", en: "of" },
    next: { es: "Continuar", en: "Continue" },
    back: { es: "Atrás", en: "Back" },
    review: { es: "Revisar y enviar", en: "Review & submit" },
    reviewIntro: { es: "Revise que todo esté correcto antes de enviar.", en: "Please check everything before submitting." },
    edit: { es: "Editar", en: "Edit" },
    submit: { es: "Enviar solicitud", en: "Submit request" },
    sending: { es: "Enviando…", en: "Sending…" },
    remove: { es: "Quitar", en: "Remove" },
    yes: { es: "Sí", en: "Yes" },
    no: { es: "No", en: "No" },
    select: { es: "Seleccione…", en: "Select…" },
    optional: { es: "opcional", en: "optional" },
    noMembers: { es: "No se agregaron miembros.", en: "No members added." },
    required: { es: "Este campo es obligatorio.", en: "This field is required." },
    invalidEmail: { es: "Escriba un correo válido.", en: "Enter a valid email." },
    invalidSsn: { es: "El SSN debe tener 9 dígitos.", en: "SSN must have 9 digits." },
    invalidZip: { es: "El Zip Code debe tener 5 dígitos.", en: "Zip code must have 5 digits." },
    invalidPhone: { es: "El teléfono debe tener 10 dígitos.", en: "Phone must have 10 digits." },
    invalidDate: { es: "Fecha no válida.", en: "Invalid date." },
    invalidFormat: { es: "Formato no válido.", en: "Invalid format." },
    fixErrors: { es: "Revise los campos marcados.", en: "Please review the highlighted fields." },
    consentRequired: { es: "Debe aceptar la autorización para enviar.", en: "You must accept the authorization to submit." },
    successTitle: { es: "¡Solicitud enviada!", en: "Request sent!" },
    successText: { es: "Gracias. Su agente revisará la información y le contactará con su cotización.", en: "Thank you. Your agent will review your information and contact you with a quote." },
    errorSend: { es: "No se pudo enviar. Revise su conexión e intente de nuevo.", en: "Could not send. Check your connection and try again." },
    testMode: { es: "Modo de prueba: no hay endpoint configurado, los datos se muestran en la consola.", en: "Test mode: no endpoint configured, data is printed to the console." },
    invalidAgent: { es: "Este link no es válido. Pida a su agente un link nuevo.", en: "This link is not valid. Ask your agent for a new link." },
    draftRestored: { es: "Recuperamos lo que había llenado.", en: "We restored your progress." },
    secure: { es: "Formulario seguro", en: "Secure form" },
    stepsTitle: { es: "Su solicitud", en: "Your request" },
    summaryTitle: { es: "Resumen", en: "Summary" },
    householdIncome: { es: "Ingreso anual del hogar", en: "Annual household income" },
    householdSize: { es: "Personas en el hogar", en: "Household size" },
    applicants: { es: "Solicitan seguro", en: "Applying for coverage" },
    location: { es: "Ubicación", en: "Location" },
    contactTitle: { es: "¿Dudas?", en: "Questions?" }
  }
};
