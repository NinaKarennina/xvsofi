// lib/scrollEffects.js

// lib/scrollEffects.js
export function initParallax() {
  const sections = Array.from(document.querySelectorAll('.hero-block[data-bg-speed]'));
  if (!sections.length) return;

  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        for (const sec of sections) {
          const speed = parseFloat(sec.dataset.bgSpeed || '0');
          if (!speed) continue;

          const rect = sec.getBoundingClientRect();
          const secTopOnPage = scrollY + rect.top;
          const distInside = scrollY - secTopOnPage; // cuánto has avanzado dentro del bloque
          const shift = distInside * speed;          // px de desplazamiento vertical

          const bg = sec.querySelector('.parallax-bg');
          if (bg) {
            bg.style.setProperty('--bg-shift', `${shift}px`);
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  onScroll(); // posiciona al cargar
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}


// REVEAL: pone .in-view cuando el bloque entra al viewport, activando transiciones CSS
export function initReveal({
  root = null,
  rootMargin = '0px',
  threshold = 0.15,   // un poco más alto para evitar disparo al 1er pixel
  once = false        // 👈 permitir reversa al salir del viewport
} = {}) {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  // 1) Desactiva transiciones mientras armamos (evita “brinco” inicial)
  document.documentElement.classList.add('reveal-no-anim');

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        if (once) io.unobserve(e.target);
      } else if (!once) {
        e.target.classList.remove('in-view'); // 👈 reversa
      }
    }
  }, { root, rootMargin, threshold });

  targets.forEach(t => io.observe(t));

  // 2) “Armar” después del primer frame para que el primer paint sea estable
  requestAnimationFrame(() => {
    document.documentElement.classList.add('reveal-armed');   // ahora sí aplicamos estado oculto a lo que no está en vista
    // Quita el no-anim un poco después para que futuros cambios sí animen
    setTimeout(() => {
      document.documentElement.classList.remove('reveal-no-anim');
    }, 50);
  });
}
