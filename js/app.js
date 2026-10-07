const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

navToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  navToggle.innerHTML = open ? '<i class="bi bi-x-lg"></i>' : '<i class="bi bi-list"></i>';
});

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    if (navToggle) navToggle.innerHTML = '<i class="bi bi-list"></i>';
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold: .12});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const topButton = document.querySelector('.back-top');
window.addEventListener('scroll', () => {
  topButton.classList.toggle('show', window.scrollY > 600);
});
topButton.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));

document.getElementById('year').textContent = new Date().getFullYear();

/* =========================================================
   ENQUIRY FORM
   Set ONE of these up so leads are actually delivered:
   - FORM_ENDPOINT = Formspree URL  (https://formspree.io/f/xxxxxxxx), type 'formspree'
   - FORM_ENDPOINT = Google Apps Script web-app URL, type 'sheets'
   With no endpoint, the form opens WhatsApp with the details filled in.
========================================================= */
const FORM_ENDPOINT = '';
const FORM_ENDPOINT_TYPE = 'formspree';   // 'formspree' | 'sheets'
const WHATSAPP_NUMBER = '918939915577';   // country code + number, digits only
const ALSO_OPEN_WHATSAPP = false;         // true = send to endpoint AND open WhatsApp

document.getElementById('leadForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const message = document.getElementById('formMessage');
  const button = form.querySelector('button[type="submit"]');
  message.setAttribute('aria-live', 'polite');

  // Honeypot: real visitors never see or fill this field
  if (form.elements.website && form.elements.website.value) return;

  const name = form.elements.name.value.trim();
  const phone = form.elements.phone.value.trim();
  const course = form.elements.course ? form.elements.course.value : '';
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 13) {
    message.textContent = 'Please enter a valid phone number.';
    form.elements.phone.focus();
    return;
  }

  const data = {
    name, phone, course,
    page: document.title,
    url: location.href,
    submitted_at: new Date().toISOString()
  };

  const waText = `Hi Greens Technology, I would like a callback.\nName: ${name}\nPhone: ${phone}\nCourse: ${course}\n(Sent from: ${document.title})`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
  const openWhatsApp = () => window.open(waUrl, '_blank', 'noopener');

  // No endpoint configured: hand the lead over via WhatsApp
  if (!FORM_ENDPOINT) {
    openWhatsApp();
    message.textContent = 'Opening WhatsApp. Please press Send to complete your request.';
    form.reset();
    return;
  }

  if (ALSO_OPEN_WHATSAPP) openWhatsApp();

  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Sending...';
  message.textContent = '';

  try {
    if (FORM_ENDPOINT_TYPE === 'sheets') {
      // Google Apps Script web apps do not return readable CORS responses
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data)
      });
    } else {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Request failed: ' + res.status);
    }
    message.textContent = 'Thanks! We have received your request and will call you back soon.';
    form.reset();
  } catch (err) {
    message.innerHTML = 'Sorry, we could not send your request. Please <a href="' + waUrl + '" target="_blank" rel="noopener" style="text-decoration:underline">message us on WhatsApp</a> or call +91 ' + WHATSAPP_NUMBER.slice(-10, -5) + ' ' + WHATSAPP_NUMBER.slice(-5) + '.';
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

// Add the hidden honeypot field to every enquiry form
document.getElementById('leadForm')?.insertAdjacentHTML('beforeend',
  '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">');



const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

const lightTheme = document.getElementById("lightTheme");
const darkTheme = document.getElementById("darkTheme");

function setTheme(theme) {

    if (theme === "dark") {

        lightTheme.disabled = true;
        darkTheme.disabled = false;

        document.body.classList.add("dark-mode");

        themeIcon.className = "bi bi-sun-fill";
        themeText.textContent = "Light";

        localStorage.setItem("greens-theme", "dark");

    } else {

        darkTheme.disabled = true;
        lightTheme.disabled = false;

        document.body.classList.remove("dark-mode");

        themeIcon.className = "bi bi-moon-stars-fill";
        themeText.textContent = "Dark";

        localStorage.setItem("greens-theme", "light");
    }
}

if (themeToggle) {

    themeToggle.addEventListener("click", function () {

        const currentTheme =
            localStorage.getItem("greens-theme") || "light";

        setTheme(
            currentTheme === "dark"
                ? "light"
                : "dark"
        );
    });
}

/* Restore saved theme */

const savedTheme =
    localStorage.getItem("greens-theme") || "light";

//setTheme(savedTheme);