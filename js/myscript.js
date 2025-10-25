// ===================================
// VALIDACIÓN Y ENVÍO DEL FORMULARIO
// ===================================

const quoteForm = document.getElementById("quoteForm");

// Función para validar un campo individual
function validateField(field) {
  const formGroup = field.closest(".form-group");
  
  if (!formGroup) return true;
  
  let isValid = true;

  // Validación para campos de texto requeridos
  if (field.hasAttribute("required") && field.value.trim() === "") {
    isValid = false;
  }

  // Validación para email
  if (field.type === "email" && field.value !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    isValid = emailRegex.test(field.value);
  }

  // Validación para teléfono (basada en el formateo automático)
  if (field.type === "tel" && field.value !== "") {
    const phoneRegex = /^[0-9\s]{12}$/; // 10 dígitos + 2 espacios
    isValid = phoneRegex.test(field.value);
  }

  // Validación para fecha
  if (field.type === "date" && field.value !== "") {
    const selectedDate = new Date(field.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Permite seleccionar la fecha de hoy
    isValid = selectedDate >= today;
  }

  // Validación para radio buttons
  if (field.type === "radio") {
    const radioGroup = formGroup.querySelectorAll(`input[name="${field.name}"]`);
    isValid = Array.from(radioGroup).some(radio => radio.checked);
  }

  // Aplicar clases de error/éxito
  if (isValid) {
    formGroup.classList.remove("error");
  } else {
    formGroup.classList.add("error");
  }

  return isValid;
}

if (quoteForm) {
  // Validación en tiempo real
  quoteForm.querySelectorAll("input, select, textarea").forEach(field => {
    // Validar al perder el foco
    field.addEventListener("blur", function() {
      if (this.value !== "" || this.hasAttribute("required")) {
        validateField(this);
      }
    });

    // Remover error al empezar a escribir
    field.addEventListener("input", function() {
      const formGroup = this.closest(".form-group");
      if (formGroup && formGroup.classList.contains("error")) {
        formGroup.classList.remove("error");
      }
    });
  });

  // Validación especial para radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", function() {
      validateField(this);
    });
  });

  // Manejo del envío del formulario
  quoteForm.addEventListener("submit", function(e) {
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
      if(radios.length > 0) {
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

    // Simular envío (aquí pondrías tu lógica real de envío)
    setTimeout(() => {
      // Mostrar mensaje de éxito
      alert(
        "¡Gracias por tu solicitud! Nos pondremos en contacto contigo en menos de 30 minutos."
      );

      // Resetear formulario
      form.reset();
      
      // Remover todas las clases de error
      form.querySelectorAll(".form-group.error").forEach(group => {
        group.classList.remove("error");
      });

      // Restaurar botón
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;

    }, 1500);
  });
} // Fin de if(quoteForm)

// ===================================
// SMOOTH SCROLLING
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
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
  document.addEventListener("keydown", function(e) {
    if (e.key === "Control" || e.metaKey) {
      map.scrollWheelZoom.enable();
    }
  });

  document.addEventListener("keyup", function(e) {
    if (e.key === "Control" || e.metaKey) {
      map.scrollWheelZoom.disable();
    }
  });

  window.addEventListener("blur", function() {
    map.scrollWheelZoom.disable();
  });

  // Botón de resetear vista
  const ResetViewControl = L.Control.extend({
    options: {
      position: "topleft",
    },

    onAdd: function(map) {
      const container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("a", "leaflet-control-reset", container);

      button.innerHTML = '<i class="fas fa-crosshairs"></i>';
      button.href = "#";
      button.role = "button";
      button.title = "Volver a la vista inicial";

      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.on(button, "click", function(e) {
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
  mobileMenuBtn.addEventListener("click", function() {
    body.classList.toggle("nav-open");
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener("click", function(e) {
    if (body.classList.contains("nav-open") && 
        !nav.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
      body.classList.remove("nav-open");
    }
  });

  // Cerrar menú con tecla Escape
  document.addEventListener("keydown", function(e) {
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

  window.addEventListener("scroll", function() {
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

const observer = new IntersectionObserver(function(entries, observerInstance) {
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
  element.addEventListener('focus', function() {
    // Usamos el estilo 'outline' que es el estándar para accesibilidad
    this.style.outline = '3px solid var(--primary-yellow)';
    this.style.outlineOffset = '2px';
  });
  
  element.addEventListener('blur', function() {
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
// CÓDIGO AL CARGAR EL DOM (FUSIONADO)
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

  // --- LÓGICA DE FORMATEAR TELÉFONO ---
  const telefonoInput = document.getElementById("form_telefono");
  if (telefonoInput) {
    telefonoInput.addEventListener("input", function (e) {
      // Remover caracteres no numéricos
      let value = e.target.value.replace(/\D/g, "");

      // Limitar a 10 dígitos
      if (value.length > 10) {
        value = value.slice(0, 10);
      }

      // Formatear como XX XXXX XXXX
      if (value.length > 2) {
        value = value.slice(0, 2) + " " + value.slice(2);
      }
      if (value.length > 7) {
        value = value.slice(0, 7) + " " + value.slice(7);
      }

      e.target.value = value;
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