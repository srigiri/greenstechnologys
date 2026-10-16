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
   - FORM_ENDPOINT = 'send-enquiry.php' (own hosting, emails you), type 'php'
   With no endpoint, the form opens WhatsApp with the details filled in.
========================================================= */
const FORM_ENDPOINT = '';
const FORM_ENDPOINT_TYPE = 'formspree';   // 'formspree' | 'sheets' | 'php'
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

  if (form.elements.consent && !form.elements.consent.checked) {
    message.textContent = 'Please tick the consent box so we can contact you.';
    form.elements.consent.focus();
    return;
  }

  if (digits.length < 10 || digits.length > 13) {
    message.textContent = 'Please enter a valid phone number.';
    form.elements.phone.focus();
    return;
  }

  const data = {
    name, phone, course,
    consent: true,
    consent_policy: 'privacy-policy.html (2026-10-14)',
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


/* =========================================================
   SHARED HELPERS (used by the syllabus form)
========================================================= */
const CALL_NUMBER = '+918939915577';      // number the Call buttons dial
const POLICY_REF = 'privacy-policy.html (2026-10-14)';

async function postLead(data) {
  if (FORM_ENDPOINT_TYPE === 'sheets') {
    // Google Apps Script web apps do not return readable CORS responses
    await fetch(FORM_ENDPOINT, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data)
    });
    return;
  }
  const res = await fetch(FORM_ENDPOINT, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Request failed: ' + res.status);
}

/* =========================================================
   BATCH TABLE
   Add your real batches here. The "Upcoming batches" section stays
   hidden on every page until at least one entry matches that page.

   course: 'aws' | 'devops' | 'data-analytics' | 'ai' | 'master'
           (the courses page shows every batch)
   name:   what the learner sees, e.g. 'DevOps Engineer, weekday morning'
   days:   e.g. 'Monday to Friday'  (optional)
   time:   e.g. '7:00 AM to 8:30 AM'
   mode:   'Online' | 'Classroom' | 'Online and classroom'
   demo:   'YYYY-MM-DD' of the next free demo class. Once that date has
           passed the row automatically says "Call for next demo".
   demoTime: optional, e.g. '6:30 PM'

   Example:
   { course: 'devops', name: 'DevOps Engineer, weekday morning', days: 'Monday to Friday',
     time: '7:00 AM to 8:30 AM', mode: 'Online', demo: '2026-10-24', demoTime: '6:30 PM' },
========================================================= */
const BATCH_DATA = [
];

(function () {
  const sec = document.getElementById('batches');
  if (!sec) return;
  const key = sec.dataset.course || 'all';
  const rows = BATCH_DATA.filter(b => key === 'all' || b.course === key);
  if (!rows.length) return;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const toDate = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const upcoming = b => { const d = toDate(b.demo); return d && d >= today ? d : null; };
  rows.sort((a, b) => {
    const da = upcoming(a), db = upcoming(b);
    if (da && db) return da - db;
    return da ? -1 : db ? 1 : 0;
  });

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const body = document.getElementById('batchBody');

  rows.forEach(b => {
    const tr = el('tr');

    const name = el('td', 'batch-name');
    name.appendChild(el('strong', '', b.name));
    if (b.days) name.appendChild(el('span', '', b.days));
    tr.appendChild(name);

    const time = el('td', '', b.time || '');
    time.dataset.label = 'Timings';
    tr.appendChild(time);

    const mode = el('td');
    mode.dataset.label = 'Mode';
    const m = el('span', 'batch-mode');
    const text = b.mode || '';
    if (/online/i.test(text)) m.appendChild(el('i', 'bi bi-laptop'));
    if (/class/i.test(text)) m.appendChild(el('i', 'bi bi-building'));
    m.appendChild(document.createTextNode(text));
    mode.appendChild(m);
    tr.appendChild(mode);

    const demo = el('td', 'batch-demo');
    demo.dataset.label = 'Free demo class';
    const d = upcoming(b);
    if (d) {
      const opts = { weekday: 'short', day: 'numeric', month: 'short' };
      if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
      demo.textContent = d.toLocaleDateString('en-IN', opts) + (b.demoTime ? ', ' + b.demoTime : '');
    } else {
      demo.className = 'batch-demo is-ask';
      demo.textContent = 'Call for next demo';
    }
    tr.appendChild(demo);

    const cta = el('td', 'batch-cta');
    const a = el('a', 'btn btn-primary btn-sm');
    a.href = 'tel:' + CALL_NUMBER;
    a.setAttribute('aria-label', 'Call for fees: ' + b.name);
    a.appendChild(el('i', 'bi bi-telephone-fill'));
    a.appendChild(document.createTextNode(' Call for fees'));
    cta.appendChild(a);
    tr.appendChild(cta);

    body.appendChild(tr);
  });
  sec.hidden = false;
})();

/* =========================================================
   SYLLABUS DOWNLOAD (phone number unlocks the PDF)
   Files live in assets/syllabus/. The PDF link is public once shown,
   so this is a soft gate: it is meant to capture leads, not to secure the file.
   With no FORM_ENDPOINT set, the lead goes to WhatsApp (same as the callback form).
========================================================= */
const SYLLABUS = {
  'aws':            { label: 'AWS Training',                    file: 'assets/syllabus/greens-aws-training-syllabus.pdf' },
  'devops':         { label: 'DevOps Training',                 file: 'assets/syllabus/greens-devops-training-syllabus.pdf' },
  'data-analytics': { label: 'Data Analytics',                  file: 'assets/syllabus/greens-data-analytics-syllabus.pdf' },
  'ai':             { label: 'Artificial Intelligence',         file: 'assets/syllabus/greens-ai-training-syllabus.pdf' },
  'master':         { label: 'Cloud and DevOps Master Program', file: 'assets/syllabus/greens-cloud-devops-master-program-syllabus.pdf' }
};

document.getElementById('syllabusForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const message = document.getElementById('sylMessage');
  const button = form.querySelector('button[type="submit"]');
  message.setAttribute('aria-live', 'polite');

  if (form.elements.website && form.elements.website.value) return;   // honeypot

  const key = form.elements.syllabus ? form.elements.syllabus.value : form.dataset.syllabus;
  const item = SYLLABUS[key];
  if (!item) return;

  const phone = form.elements.phone.value.trim();
  const digits = phone.replace(/\D/g, '');

  if (!form.elements.consent.checked) {
    message.textContent = 'Please tick the consent box so we can contact you.';
    form.elements.consent.focus();
    return;
  }
  if (digits.length < 10 || digits.length > 13) {
    message.textContent = 'Please enter a valid phone number.';
    form.elements.phone.focus();
    return;
  }

  const data = {
    type: 'syllabus',
    name: '',
    phone,
    course: item.label + ' syllabus',
    consent: true,
    consent_policy: POLICY_REF,
    page: document.title,
    url: location.href,
    submitted_at: new Date().toISOString()
  };

  const waText = `Hi Greens Technology, please send me the ${item.label} syllabus.\nPhone: ${phone}\n(Sent from: ${document.title})`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  const unlock = () => {
    const done = form.querySelector('.syl-done');
    const link = done.querySelector('a');
    link.href = item.file;
    form.querySelector('.syl-fields').hidden = true;
    done.hidden = false;
    message.textContent = '';
    link.focus();
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { method: 'syllabus_download', course: item.label });
    if (typeof fbq === 'function') fbq('track', 'Lead');
  };

  // No endpoint configured: hand the lead over via WhatsApp and unlock the PDF
  if (!FORM_ENDPOINT) {
    window.open(waUrl, '_blank', 'noopener');
    unlock();
    return;
  }

  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Please wait...';
  message.textContent = '';
  try {
    await postLead(data);
    unlock();
  } catch (err) {
    message.innerHTML = 'Sorry, we could not send your request. Please <a href="' + waUrl + '" target="_blank" rel="noopener" style="text-decoration:underline">message us on WhatsApp</a> or call +91 ' + WHATSAPP_NUMBER.slice(-10, -5) + ' ' + WHATSAPP_NUMBER.slice(-5) + '.';
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});

/* =========================================================
   FLOATING CALL + WHATSAPP BUTTONS (shown on all screen sizes by CSS)
========================================================= */
(function () {
  const isCourse = /(aws|devops|ai|data-analytics)-training|master-program/.test(location.pathname);
  const topic = document.title.split('|')[0].trim();
  const text = isCourse
    ? 'Hi Greens Technology, I would like details about ' + topic + '.'
    : 'Hi Greens Technology, I would like details about courses at your Coimbatore centre.';

  const bar = document.createElement('nav');
  bar.className = 'mbar';
  bar.setAttribute('aria-label', 'Quick contact');

  const call = document.createElement('a');
  call.className = 'mbar-call';
  call.href = 'tel:' + CALL_NUMBER;
  call.innerHTML = '<i class="bi bi-telephone-fill"></i>';
  call.setAttribute('aria-label', 'Call Greens Technology');
  call.title = 'Call us';

  const wa = document.createElement('a');
  wa.className = 'mbar-wa';
  wa.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  wa.target = '_blank';
  wa.rel = 'noopener';
  wa.innerHTML = '<i class="bi bi-whatsapp"></i>';
  wa.setAttribute('aria-label', 'Chat on WhatsApp');
  wa.title = 'Chat on WhatsApp';

  bar.append(call, wa);
  document.body.appendChild(bar);
  document.body.classList.add('has-mbar');

  // Hide the bar while the on-screen keyboard is open so it never covers a form field
  const typing = t => t.matches && t.matches('input:not([type="checkbox"]):not([type="radio"]),select,textarea');
  document.addEventListener('focusin', e => { if (typing(e.target)) document.body.classList.add('kb-open'); });
  document.addEventListener('focusout', () => document.body.classList.remove('kb-open'));
})();



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

/* =========================================================
   PHOTOS, PLACEHOLDERS AND TOOL LOGOS
   Real photos go in assets/trainers/ and assets/centre/ (see the
   <img src> paths in each page). Until a photo exists, a neutral
   placeholder is shown. Set SHOW_IMAGE_PLACEHOLDERS = false to hide
   empty photo slots (and empty galleries) instead.
========================================================= */
const SHOW_IMAGE_PLACEHOLDERS = true;

// Tool logos: loaded from the Devicon CDN. To self-host, download the SVGs and
// change this to: slug => 'assets/logos/' + slug + '.svg'
const LOGO_URL = slug => 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/' + slug + '/' + slug + '-original.svg';
const LOGOS = {
  'Python':'python','AWS':'amazonwebservices','Java':'java','Azure':'azure','Selenium':'selenium',
  'Linux':'linux','Git':'git','GitHub Actions':'githubactions','Jenkins':'jenkins','Docker':'docker',
  'Kubernetes':'kubernetes','Helm':'helm','Terraform':'terraform','Ansible':'ansible',
  'Prometheus':'prometheus','Grafana':'grafana','ELK':'elasticsearch',
  'TensorFlow':'tensorflow','Keras':'keras','R':'r','Spark':'apachespark'
};

(function () {
  // Photo slots
  document.querySelectorAll('img[data-slot]').forEach(img => {
    const showPlaceholder = () => {
      const slot = img.closest('.photo-slot');
      if (!slot) return;
      if (SHOW_IMAGE_PLACEHOLDERS) {
        const ph = document.createElement('div');
        ph.className = 'photo-ph';
        ph.innerHTML = '<i class="bi bi-' + (img.dataset.icon || 'image') + '"></i><span></span>';
        ph.querySelector('span').textContent = img.dataset.slot;
        img.replaceWith(ph);
      } else {
        slot.hidden = true;
        const gallery = slot.closest('.gallery');
        if (gallery && [...gallery.children].every(c => c.hidden)) {
          const section = gallery.closest('section');
          if (section) section.hidden = true;
        }
      }
    };
    if (img.complete && img.naturalWidth === 0) showPlaceholder();
    else img.addEventListener('error', showPlaceholder, { once: true });
  });

  // Tool logos in the "technologies" strips (text stays if a logo fails to load)
  document.querySelectorAll('.tech-list b').forEach(b => {
    const slug = LOGOS[b.textContent.trim()];
    if (!slug) return;
    const img = document.createElement('img');
    img.className = 'tool-logo';
    img.alt = '';
    img.loading = 'lazy';
    img.src = LOGO_URL(slug);
    img.addEventListener('error', () => img.remove());
    b.prepend(img);
  });
})();
