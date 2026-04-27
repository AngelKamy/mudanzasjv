// ===================================
// SISTEMA DE TOAST (reemplaza alert)
// ===================================

function showToast({ type = "success", title = "", message = "", duration = 5000 } = {}) {
  const container = document.getElementById("toast-container");
  if (!container) {
    alert((title ? title + "\n" : "") + message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const iconClass = type === "success"
    ? "fas fa-check-circle"
    : type === "error"
      ? "fas fa-exclamation-circle"
      : "fas fa-info-circle";

  toast.innerHTML =
    '<i class="' + iconClass + ' toast-icon" aria-hidden="true"></i>' +
    '<div class="toast-content">' +
      (title ? '<strong>' + title + '</strong>' : '') +
      '<span>' + message + '</span>' +
    '</div>' +
    '<button type="button" class="toast-close" aria-label="Cerrar notificación">' +
      '<i class="fas fa-times" aria-hidden="true"></i>' +
    '</button>';

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  const dismiss = () => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector(".toast-close").addEventListener("click", dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

// ===================================
// VALIDACIÓN Y ENVÍO DEL FORMULARIO
// ===================================

const quoteForm = document.getElementById("quoteForm");

function validateField(field) {
  const formGroup = field.closest(".form-group");
  if (!formGroup) return true;

  let isValid = true; 
  const value = field.value.trim();

  if (field.hasAttribute("required") && value === "") {
    isValid = false;
  }
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
  }

  if (field.type === "radio") {
    const radioGroup = formGroup.querySelectorAll(`input[name="${field.name}"]`);
    isValid = Array.from(radioGroup).some(radio => radio.checked);
  }

  if (isValid) {
    formGroup.classList.remove("error");
    if (value !== "" || field.type === "radio") {
      formGroup.classList.add("success");
    } else {
      formGroup.classList.remove("success");
    }
  } else {
    formGroup.classList.remove("success"); 
    formGroup.classList.add("error");
  }

  return isValid;
}

if (quoteForm) {
  quoteForm.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("blur", function () {
      if (this.value !== "" || this.hasAttribute("required")) {
        validateField(this);
      }
    });

    field.addEventListener("input", function () {
      if (field.id !== 'form_telefono') { 
        const formGroup = this.closest(".form-group");
        if (formGroup) {
          formGroup.classList.remove("error");
          formGroup.classList.remove("success");
        }
      }
    });
  });

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener("change", function () {
      validateField(this);
    });
  });

  quoteForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let isFormValid = true;
    const form = this;
    const submitButton = form.querySelector(".submit-button");
    const originalButtonText = submitButton.innerHTML;

    // --- ANTI-SPAM ---
    const honeypot = document.getElementById("hp_website");
    if (honeypot && honeypot.value.trim() !== "") {
      showToast({ type: "success", title: "¡Solicitud enviada!", message: "Te contactaremos pronto." });
      form.reset();
      return;
    }

    const tsField = document.getElementById("hp_ts");
    const startTime = parseInt((tsField && tsField.value) || "0", 10);
    const elapsed = startTime > 0 ? Date.now() - startTime : 99999;
    if (startTime > 0 && elapsed < 3000) {
      showToast({ type: "success", title: "¡Solicitud enviada!", message: "Te contactaremos pronto." });
      form.reset();
      return;
    }

    form.querySelectorAll("input[required], select[required], textarea[required]").forEach(field => {
      if (!validateField(field)) {
        isFormValid = false;
      }
    });

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

    if (!isFormValid) {
      const firstError = form.querySelector(".form-group.error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const data = {
      nombre: document.getElementById('form_nombre').value,
      telefono: document.getElementById('form_telefono').value,
      email: document.getElementById('form_email').value,
      fecha: document.getElementById('form_fecha').value,
      origen_dir: document.getElementById('form_origen_dir').value,
      origen_piso: document.getElementById('form_origen_piso').value,
      origen_elevador: form.querySelector('input[name="origen_elevador"]:checked').value,
      destino_dir: document.getElementById('form_destino_dir').value,
      destino_piso: document.getElementById('form_destino_piso').value,
      destino_elevador: form.querySelector('input[name="destino_elevador"]:checked').value,
      lista: document.getElementById('form_lista').value,
      hp_website: honeypot ? honeypot.value : "",
      hp_elapsed: elapsed
    };

    // TU URL ACTUALIZADA
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwk3F-OhxGDU5qYjX-EjexpPq3YvVd093Wyq10_r2ayuWz3jqxRAChU3rrzyUd1aDfM8A/exec';

    // CONFIGURACIÓN ESTRICTA ANTI-CORS
    fetch(scriptURL, {
      method: 'POST',
      redirect: 'follow', 
      headers: {
        "Content-Type": "text/plain;charset=utf-8" 
      },
      body: JSON.stringify(data)
    })
      .then(response => {
        return response.text().then(text => {
          if (!response.ok) {
            throw new Error("HTTP " + response.status + ": " + text);
          }
          return text;
        });
      })
      .then(text => {
        try {
          const res = JSON.parse(text);
          if (res.result === "success") {
            showToast({
              type: "success",
              title: "¡Solicitud enviada!",
              message: "Hemos recibido tu cotización. Te contactaremos a la brevedad por correo o teléfono.",
              duration: 7000
            });
            form.reset();
            if (tsField) tsField.value = Date.now();
            form.querySelectorAll(".form-group.error, .form-group.success").forEach(group => {
              group.classList.remove("error", "success");
            });
          } else {
            console.error('Error lógico:', res.message);
            showToast({
              type: "error",
              title: "No pudimos procesar tu solicitud",
              message: res.message || "Inténtalo de nuevo en unos momentos.",
              duration: 7000
            });
          }
        } catch (e) {
          console.error("Respuesta cruda no-JSON:", text);
          throw new Error("El servidor no devolvió JSON válido.");
        }
      })
      .catch(error => {
        console.error('Error de Fetch:', error);
        showToast({
          type: "error",
          title: "Error de conexión",
          message: "Revisa tu internet e inténtalo de nuevo. Si el problema persiste, escríbenos por WhatsApp.",
          duration: 7000
        });
      })
      .finally(() => {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      });
  });
}

// ===================================
// SMOOTH SCROLLING
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    let targetId = this.getAttribute("href");
    let target = (targetId === "#") ? document.documentElement : document.querySelector(targetId);

    if (target) {
      if (targetId === "#inicio" || targetId === "#cotizar") {
        target = document.querySelector("#inicio");
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.body.classList.remove("nav-open");
    }
  });
});

// ===================================
// INICIALIZACIÓN DEL MAPA (LAZY LOAD)
// ===================================

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function initMap() {
  const defaultView = { coords: [19.4326, -99.1332], zoom: 6 };

  const map = L.map("map", { scrollWheelZoom: false }).setView(defaultView.coords, defaultView.zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Control" || e.metaKey) { map.scrollWheelZoom.enable(); }
  });

  document.addEventListener("keyup", function (e) {
    if (e.key === "Control" || e.metaKey) { map.scrollWheelZoom.disable(); }
  });

  window.addEventListener("blur", function () { map.scrollWheelZoom.disable(); });

  const ResetViewControl = L.Control.extend({
    options: { position: "topleft" },
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

  const cdmxMarker = L.marker([19.4326, -99.1332]).addTo(map);
  cdmxMarker.bindPopup("<b>Mudanzas JV</b><br>Ciudad de México, México").openPopup();

  L.circle([19.4326, -99.1332], {
    color: "#FFD20A", fillColor: "#FFD20A", fillOpacity: 0.1, radius: 300000,
  }).addTo(map);

  const cities = [
    { name: "Guadalajara", coords: [20.6597, -103.3496] },
    { name: "Monterrey", coords: [25.6866, -100.3161] },
    { name: "Puebla", coords: [19.0414, -98.2063] },
    { name: "Querétaro", coords: [20.5888, -100.3899] },
    { name: "Cancún", coords: [21.1619, -86.8515] },
    { name: "Mérida", coords: [20.9674, -89.5926] },
    { name: "León", coords: [21.1218, -101.6826] },
    { name: "Veracruz", coords: [19.202413611910277, -96.13403048799478] },
    { name: "Acapulco", coords: [16.89531675240192, -99.83953484715727] },
    { name: "Toluca", coords: [19.2826, -99.6557] },
  ];

  cities.forEach(city => {
    const marker = L.marker(city.coords).addTo(map);
    marker.bindPopup(`<b>${city.name}</b><br>Servicio disponible`);
  });
}

function loadLeafletAndInit() {
  Promise.all([
    loadStylesheet("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
  ]).then(() => initMap()).catch(err => console.error("Error cargando Leaflet:", err));
}

const mapElement = document.getElementById("map");
if (mapElement) {
  const mapObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadLeafletAndInit();
        observer.unobserve(entry.target); 
      }
    });
  }, { rootMargin: "200px" });
  mapObserver.observe(mapElement);
} 

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

  document.addEventListener("click", function (e) {
    if (body.classList.contains("nav-open") && !nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      body.classList.remove("nav-open");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && body.classList.contains("nav-open")) {
      body.classList.remove("nav-open");
    }
  });
} 

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
} 

// ===================================
// ANIMACIONES AL HACER SCROLL
// ===================================

const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

const observer = new IntersectionObserver(function (entries, observerInstance) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observerInstance.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(".service-card, .process-step, .testimonial-card, .trust-item").forEach(el => {
  observer.observe(el);
});

// ===================================
// MEJORAS DE ACCESIBILIDAD
// ===================================

document.querySelectorAll('a, button, input, select, textarea').forEach(element => {
  element.addEventListener('focus', function () {
    this.style.outline = '3px solid var(--primary-yellow)';
    this.style.outlineOffset = '2px';
  });

  element.addEventListener('blur', function () {
    this.style.outline = '';
    this.style.outlineOffset = '';
  });
});

const style = document.createElement('style');
style.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
document.head.appendChild(style);

// ===================================
// CÓDIGO AL CARGAR EL DOM
// ===================================

document.addEventListener("DOMContentLoaded", function () {
  const tsField = document.getElementById("hp_ts");
  if (tsField) { tsField.value = Date.now(); }

  const fechaInput = document.getElementById("form_fecha");
  if (fechaInput) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    let mes = hoy.getMonth() + 1; 
    let dia = hoy.getDate();

    if (mes < 10) mes = "0" + mes;
    if (dia < 10) dia = "0" + dia;

    fechaInput.setAttribute("min", `${anio}-${mes}-${dia}`);
  }

  const telefonoInput = document.getElementById("form_telefono");
  if (telefonoInput) {
    telefonoInput.addEventListener("input", function (e) {
      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
      let formattedValue = digits;
      if (digits.length > 6) {
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
      } else if (digits.length > 2) {
        formattedValue = `${digits.slice(0, 2)} ${digits.slice(2)}`;
      }
      e.target.value = formattedValue;
      validateField(e.target);
    });
  }

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

  if (articleSpan && wordSpan) {
    let currentIndex = 0;
    setInterval(() => {
      articleSpan.classList.add("is-changing");
      wordSpan.classList.add("is-changing");

      setTimeout(() => {
        currentIndex = (currentIndex + 1) % wordData.length;
        articleSpan.textContent = wordData[currentIndex].article;
        wordSpan.textContent = wordData[currentIndex].word;

        articleSpan.classList.remove("is-changing");
        wordSpan.classList.remove("is-changing");
      }, 400); 
    }, 3000); 
  }
});