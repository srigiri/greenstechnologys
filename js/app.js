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

document.getElementById('leadForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const message = document.getElementById('formMessage');
  message.textContent = 'Thanks! Your request has been captured. Connect this form to your CRM/API.';
  e.target.reset();
});
