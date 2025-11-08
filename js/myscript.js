// ===================================
// VALIDACIÓN Y ENVÍO DEL FORMULARIO
// ===================================

const quoteForm = document.getElementById("quoteForm");

// Función para validar un campo individual (VERSIÓN CORREGIDA)
function validateField(field) {
  const formGroup = field.closest(".form-group");
  if (!formGroup) return true;

  let isValid = true; // Asumimos que es válido
  const value = field.value.trim();

  // 1. Revisión de campos REQUERIDOS y VACÍOS
  if (field.hasAttribute("required") && value === "") {
    isValid = false;
  }
  // 2. Si NO está vacío, revisamos formatos específicos
  else if (value !== "") {

    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(value);
    }
    else if (field.type === "tel") {
      const digits = value.replace(/\D/g, "");
      isValid = (digits.length === 10);
    }
    else if (field.type === "date") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      isValid = selectedDate >= today;
    }
    // (Otros campos de solo texto no requieren validación de formato)
  }

  // 3. Revisión especial para RADIO buttons (estos no usan 'value')
  if (field.type === "radio") {
    const radioGroup = formGroup.querySelectorAll(`input[name="${field.name}"]`);
    isValid = Array.from(radioGroup).some(radio => radio.checked);
  }

  // 4. Aplicar o quitar la clase de error/éxito
  if (isValid) {
    formGroup.classList.remove("error");
    // Solo añade 'success' si el campo no está vacío (o es un radio)
    if (value !== "" || field.type === "radio") {
      formGroup.classList.add("success");
    } else {
      // Si está vacío (y no es requerido), no debe ser verde
      formGroup.classList.remove("success");
    }
  } else {
    formGroup.classList.remove("success"); // Quita éxito si hay error
    formGroup.classList.add("error");
  }

  return isValid;
}


if (quoteForm) {
  // Validación en tiempo real
  quoteForm.querySelectorAll("input, select, textarea").forEach(field => {
    // 1. Validar al PERDER EL FOCO (blur) - para todos los campos
    field.addEventListener("blur", function () {
      if (this.value !== "" || this.hasAttribute("required")) {
        validateField(this);
      }
    });

    // 2. Remover error/éxito al empezar a escribir (para campos que NO son el teléfono)
    field.addEventListener("input", function () {
      if (field.id !== 'form_telefono') { // <-- No ejecutar esto para el teléfono
        const formGroup = this.closest(".form-group");
        if (formGroup) {
          formGroup.classList.remove("error");
          formGroup.classList.remove("success");
        }
      }
    });
  });

  // Validación especial para radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", function () {
      validateField(this);
    });
  });

  // Manejo del envío del formulario (¡VERSIÓN CORREGIDA CON FETCH!)
  quoteForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let isFormValid = true;
    const form = this;
    const submitButton = form.querySelector(".submit-button");
    const originalButtonText = submitButton.innerHTML;

    // Validar todos los campos
    form.querySelectorAll("input[required], select[required], textarea[required]").forEach(field => {
      if (!validateField(field)) {
        isFormValid = false;
      }
    });

    // Validar grupos de radio buttons
    const radioGroups = ["origen_elevador", "destino_elevador"];
    radioGroups.forEach(groupName => {
      const radios = form.querySelectorAll(`input[name="${groupName}"]`);
      if (radios.length > 0) {
        const isChecked = Array.from(radios).some(radio => radio.checked);
        if (!isChecked) {
          isFormValid = false;
          const formGroup = radios[0].closest(".form-group");
          if (formGroup) {
            formGroup.classList.add("error");
          }
        }
      }
    });

    // Si hay errores, hacer scroll al primer error
    if (!isFormValid) {
      const firstError = form.querySelector(".form-group.error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Deshabilitar botón y mostrar estado de carga
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    // --- ¡INICIO DEL CÓDIGO DE ENVÍO A GOOGLE! ---

    // 1. Construir el objeto de datos manualmente
    const data = {
      nombre: document.getElementById('form_nombre').value,
      apellido: document.getElementById('form_apellido').value,
      telefono: document.getElementById('form_telefono').value,
      email: document.getElementById('form_email').value,
      fecha: document.getElementById('form_fecha').value,
      origen_dir: document.getElementById('form_origen_dir').value,
      origen_piso: document.getElementById('form_origen_piso').value,
      origen_elevador: form.querySelector('input[name="origen_elevador"]:checked').value,
      destino_dir: document.getElementById('form_destino_dir').value,
      destino_piso: document.getElementById('form_destino_piso').value,
      destino_elevador: form.querySelector('input[name="destino_elevador"]:checked').value,
      lista: document.getElementById('form_lista').value
    };

    // 2. ¡¡¡IMPORTANTE!!! Pega tu URL de Apps Script aquí
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwkkYpETabda6jK0-6uWz2Jkqj4vS81S7Ocmtj_FkrjcGxsujtj3JNQY8K7JHIVj0GQEQ/exec';

    // 3. Enviar los datos usando fetch
    fetch(scriptURL, {
      method: 'POST',
      mode: 'cors', // CORS es necesario para que JS lea la respuesta
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script prefiere texto plano
      },
      body: JSON.stringify(data) // Convertir el objeto de datos a un string JSON
    })
      .then(response => response.json()) // Espera una respuesta JSON del script
      .then(res => {

        if (res.result === "success") {
          // ¡Éxito!
          alert("¡Gracias por tu solicitud! Hemos recibido tu confirmación por correo.");
          form.reset();
          form.querySelectorAll(".form-group.error").forEach(group => {
            group.classList.remove("error");
          });

          // Limpia los bordes verdes de éxito al resetear
          form.querySelectorAll(".form-group.success").forEach(group => {
            group.classList.remove("success");
          });

        } else {
          // Error reportado por el script de Google
          console.error('Error del script:', res.message);
          alert("Hubo un error al enviar tu solicitud. (Error de script). Por favor, inténtalo de nuevo.");
        }
      })
      .catch(error => {
        // Error de red o del 'fetch'
        console.error('Error de Fetch:', error);
        alert("Hubo un error de conexión. Por favor, revisa tu internet e inténtalo de nuevo.");
      })
      .finally(() => {
        // Restaurar el botón en cualquier caso
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      });
    // --- ¡FIN DEL CÓDIGO DE ENVÍO A GOOGLE! ---
  });
} // Fin de if(quoteForm)

// ===================================
// SMOOTH SCROLLING
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    let targetId = this.getAttribute("href");

    // Si el href es solo "#", apunta a la parte superior
    let target = (targetId === "#") ? document.documentElement : document.querySelector(targetId);

    if (target) {
      // Corrección especial para #cotizar que apunta a #inicio
      if (targetId === "#inicio" || targetId === "#cotizar") {
        target = document.querySelector("#inicio");
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      // Cerrar menú móvil si está abierto
      document.body.classList.remove("nav-open");
    }
  });
});

// ===================================
// INICIALIZACIÓN DEL MAPA
// ===================================

// Solo ejecutar si existe el div del mapa
if (document.getElementById("map")) {
  // Vista predeterminada
  const defaultView = {
    coords: [19.4326, -99.1332],
    zoom: 6,
  };

  // Inicializar mapa con scroll desactivado
  const map = L.map("map", {
    scrollWheelZoom: false,
  }).setView(defaultView.coords, defaultView.zoom);

  // Añadir capa de mapa
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Activar zoom con Ctrl + Scroll
  document.addEventListener("keydown", function (e) {
    if (e.key === "Control" || e.metaKey) {
      map.scrollWheelZoom.enable();
    }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "Control" || e.metaKey) {
      map.scrollWheelZoom.disable();
    }
  });

  window.addEventListener("blur", function () {
    map.scrollWheelZoom.disable();
  });

  // Botón de resetear vista
  const ResetViewControl = L.Control.extend({
    options: {
      position: "topleft",
    },

    onAdd: function (map) {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "leaflet-control-reset", container);

      button.innerHTML = '<i class="fas fa-crosshairs"></i>';
      button.href = "#";
      button.role = "button";
      button.title = "Volver a la vista inicial";

      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.on(button, "click", function (e) {
        e.preventDefault();
        map.setView(defaultView.coords, defaultView.zoom);
      });

      return container;
    },
  });

  map.addControl(new ResetViewControl());

  // Marcador principal (CDMX)
  const cdmxMarker = L.marker([19.4326, -99.1332]).addTo(map);
  cdmxMarker
    .bindPopup("<b>Mudanzas JV</b><br>Ciudad de México, México")
    .openPopup();

  // Círculo de cobertura
  const coverageCircle = L.circle([19.4326, -99.1332], {
    color: "#FFD20A",
    fillColor: "#FFD20A",
    fillOpacity: 0.1,
    radius: 300000,
  }).addTo(map);

  // Ciudades principales
  const cities = [
    { name: "Guadalajara", coords: [20.6597, -103.3496] },
    { name: "Monterrey", coords: [25.6866, -100.3161] },
    { name: "Puebla", coords: [19.0414, -98.2063] },
    { name: "Querétaro", coords: [20.5888, -100.3899] },
    { name: "Cancún", coords: [21.1619, -86.8515] },
    { name: "Mérida", coords: [20.9674, -89.5926] },
    { name: "León", coords: [21.1218, -101.6826] },
    { name: "Tijuana", coords: [32.5149, -117.0382] },
  ];

  cities.forEach(city => {
    const marker = L.marker(city.coords).addTo(map);
    marker.bindPopup(`<b>${city.name}</b><br>Servicio disponible`);
  });
} // Fin de if(map)

// ===================================
// MENÚ MÓVIL
// ===================================

const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const nav = document.querySelector("nav");
const body = document.querySelector("body");

if (mobileMenuBtn && nav && body) {
  mobileMenuBtn.addEventListener("click", function () {
    body.classList.toggle("nav-open");
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", function (e) {
    if (body.classList.contains("nav-open") &&
      !nav.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)) {
      body.classList.remove("nav-open");
    }
  });

  // Cerrar menú con tecla Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.classList.contains("nav-open")) {
      body.classList.remove("nav-open");
    }
  });
} // Fin de if(menu)

// ===================================
// BURBUJA DE WHATSAPP
// ===================================

const whatsappBubble = document.getElementById("whatsapp-bubble");
if (whatsappBubble) {
  const scrollThreshold = 100;

  window.addEventListener("scroll", function () {
    if (window.scrollY > scrollThreshold) {
      whatsappBubble.classList.add("show");
    } else {
      whatsappBubble.classList.remove("show");
    }
  });
} // Fin de if(whatsappBubble)

// ===================================
// ANIMACIONES AL HACER SCROLL (CORREGIDO)
// ===================================

// Observador de intersección para animaciones
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver(function (entries, observerInstance) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 1. Añade la clase 'is-visible' que está en el CSS
      entry.target.classList.add("is-visible");
      // 2. Deja de observar el elemento (para que no se repita la animación)
      observerInstance.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observar elementos que queremos animar
document.querySelectorAll(
  ".service-card, .process-step, .testimonial-card, .trust-item"
).forEach(el => {
  observer.observe(el);
});


// ===================================
// MEJORAS DE ACCESIBILIDAD
// ===================================

// Mejorar navegación por teclado
document.querySelectorAll('a, button, input, select, textarea').forEach(element => {
  element.addEventListener('focus', function () {
    // Usamos el estilo 'outline' que es el estándar para accesibilidad
    this.style.outline = '3px solid var(--primary-yellow)';
    this.style.outlineOffset = '2px';
  });

  element.addEventListener('blur', function () {
    this.style.outline = '';
    this.style.outlineOffset = '';
  });
});

// Anunciar cambios para lectores de pantalla
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.classList.add('sr-only');
  announcement.textContent = message;
  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Añadir estilos para elementos solo para lectores de pantalla
const style = document.createElement('style');
style.textContent = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
document.head.appendChild(style);

// ===================================
// CÓDIGO AL CARGAR EL DOM (FUSIONADO Y CORREGIDO)
// (Calendario, Formato Teléfono, Animación H1)
// ===================================

document.addEventListener("DOMContentLoaded", function () {

  // --- LÓGICA DEL CALENDARIO ---
  const fechaInput = document.getElementById("form_fecha");
  if (fechaInput) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    let mes = hoy.getMonth() + 1; // getMonth() es 0-11
    let dia = hoy.getDate();

    // Formato YYYY-MM-DD
    if (mes < 10) mes = "0" + mes;
    if (dia < 10) dia = "0" + dia;

    const fechaMinima = `${anio}-${mes}-${dia}`;
    fechaInput.setAttribute("min", fechaMinima);
  }

  // --- LÓGICA DE FORMATEAR TELÉFONO (CORREGIDA) ---
  const telefonoInput = document.getElementById("form_telefono");
  if (telefonoInput) {
    telefonoInput.addEventListener("input", function (e) {
      // 1. Obtener solo dígitos y limitar a 10
      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);

      // 2. Aplicar el formato XX XXXX XXXX
      let formattedValue = digits;
      if (digits.length > 6) {
        // Formato: 55 3669 6176
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
      } else if (digits.length > 2) {
        // Formato: 55 3669
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2)}`;
      }

      // 3. Asignar el valor formateado de nuevo al campo
      e.target.value = formattedValue;

      // 4. ¡¡LÍNEA NUEVA!! VALIDAR EN TIEMPO REAL
      validateField(e.target);
    });
  }

  // --- LÓGICA DE ANIMACIÓN DEL H1 ---
  const wordData = [
    { article: "el", word: "cuidado" },
    { article: "la", word: "dedicación" },
    { article: "la", word: "atención" },
    { article: "el", word: "respeto" },
    { article: "la", word: "precisión" },
    { article: "la", word: "confianza" },
  ];

  const articleSpan = document.getElementById("animated-article");
  const wordSpan = document.getElementById("animated-word");

  // Revisa que los elementos existan
  if (articleSpan && wordSpan) {
    let currentIndex = 0;

    function changeWord() {
      articleSpan.classList.add("is-changing");
      wordSpan.classList.add("is-changing");

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % wordData.length;
        const nextWord = wordData[currentIndex];

        articleSpan.textContent = nextWord.article;
        wordSpan.textContent = nextWord.word;

        articleSpan.classList.remove("is-changing");
        wordSpan.classList.remove("is-changing");
      }, 400); // 400ms debe coincidir con la transición de CSS
    }

    // Inicia el ciclo
    setInterval(changeWord, 3000); // Cambia cada 3 segundos
  }
});