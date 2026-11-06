(() => {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;
  const close = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  const header = document.querySelector('.header');
  const syncHeader = () => {
    if (!header) return;
    header.style.background = window.scrollY > 24 ? 'rgba(5,13,24,.94)' : 'rgba(5,13,24,.12)';
    header.style.backdropFilter = window.scrollY > 24 ? 'blur(16px)' : 'none';
  };
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
})();