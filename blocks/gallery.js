
// ================================
// blocks/gallery.js
// ================================
export function createGallery({
  images = [],             // array de URLs (webp/jpg/png)
  ratio = "4 / 3",         // relación de aspecto del visor
  radius = "1px",
  shadow = "0 12px 40px rgba(0,0,0,.25)",
  loop = true,             // si llega al final, vuelve al inicio
  openOnClick = true,      // abrir lightbox al hacer click
  captions = [],           // opcional: textos paralelos a images
}) {
  const section = document.createElement("section");
  section.className = "photo-gallery";

  const wrap = document.createElement("div");
  wrap.className = "gallery-inner";
  wrap.style.setProperty("--ratio", ratio);
  wrap.style.setProperty("--radius", radius);
  wrap.style.setProperty("--shadow", shadow);

  const track = document.createElement("div");
  track.className = "gallery-track";

  images.forEach((src, i) => {
    const item = document.createElement("figure");
    item.className = "gallery-item";

    const img = document.createElement("img");
    img.src = src;
    img.alt = captions[i] || `Foto ${i+1}`;
    img.decoding = "async";
    img.loading = "lazy";
    if (openOnClick) img.addEventListener("click", () => openLightbox(src, img.alt));

    item.appendChild(img);

    if (captions[i]){
      const figcap = document.createElement("figcaption");
      figcap.textContent = captions[i];
      item.appendChild(figcap);
    }

    track.appendChild(item);
  });

  let index = 0;
  const setIndex = (n) => {
    if (loop) {
      index = (n + images.length) % images.length;
    } else {
      index = Math.max(0, Math.min(images.length - 1, n));
    }
    track.style.transform = `translateX(${-index * 100}%)`;
  };

  const prevBtn = button("prev", () => setIndex(index - 1));
  const nextBtn = button("next", () => setIndex(index + 1));

  wrap.appendChild(track);
  wrap.appendChild(prevBtn);
  wrap.appendChild(nextBtn);
  section.appendChild(wrap);

  // teclado (solo si el bloque está en viewport)
  const onKey = (ev) => {
    if (!isInViewport(section)) return;
    if (ev.key === "ArrowLeft") setIndex(index - 1);
    if (ev.key === "ArrowRight") setIndex(index + 1);
  };
  window.addEventListener("keydown", onKey);

  // limpiar listener si el nodo se elimina
  const observer = new MutationObserver(() => {
    if (!document.body.contains(section)) {
      window.removeEventListener("keydown", onKey);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  injectGalleryStyles();
  setIndex(0);
  return section;

  // helpers locales
  function button(kind, onClick){
    const b = document.createElement("button");
    b.type = "button";
    b.className = `gallery-nav ${kind}`;
    b.setAttribute("aria-label", kind === "prev" ? "Anterior" : "Siguiente");
    b.innerHTML = kind === "prev" ? "\u2039" : "\u203A"; // ‹ y ›
    b.addEventListener("click", onClick);
    return b;
  }
}

function injectGalleryStyles(){
  const ID = "gallery-style";
  if (document.getElementById(ID)) return;
  const style = document.createElement("style");
  style.id = ID;
  style.textContent = `
  .photo-gallery{
    position: relative;
    width: var(--device-w);
    margin-inline: auto;
  }
  .gallery-inner{
    position: relative;
    width: 100%;
    aspect-ratio: var(--ratio, 4 / 3);
    overflow: hidden;
    border-radius: var(--radius, 16px);
    box-shadow: var(--shadow, 0 12px 40px rgba(0,0,0,.25));
    background: rgba(0,0,0,.2);
    isolation: isolate;
  }
  .gallery-track{
    position: absolute;
    inset: 0;
    display: flex;
    height: 100%;
    will-change: transform;
    transition: transform 360ms cubic-bezier(.2,.65,.2,1);
  }
  .gallery-item{
    width: 100%;
    height: 100%;
    flex: 0 0 100%;
    margin: 0;
    position: relative;
  }
  .gallery-item > img{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    cursor: pointer;
    user-select: none;
    -webkit-user-drag: none;
  }
  .gallery-item > figcaption{
    position: absolute;
    left: 0; right: 0; bottom: 0;
    padding: 10px 14px;
    font: 500 14px/1.3 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
    color: #fff;
    background: linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,0));
  }

  .gallery-nav{
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px; height: 40px;
    border-radius: 999px;
    border: none;
    background: rgba(0,0,0,.35);
    color: #fff;
    font-size: 28px;
    display: grid; place-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    z-index: 3;
  }
  .gallery-nav.prev{ left: 8px; }
  .gallery-nav.next{ right: 8px; }
  .gallery-nav:active{ transform: translateY(-50%) scale(.96); }

  /* Lightbox */
  .lightbox{
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.85);
    display: none;
    z-index: 9999;
  }
  .lightbox.open{ display: grid; place-items: center; }
  .lightbox img{
    max-width: min(96vw, 1600px);
    max-height: 90vh;
    width: auto; height: auto;
    object-fit: contain;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
  }
  .lightbox .lb-close{
    position: fixed;
    top: 12px; right: 12px;
    width: 40px; height: 40px;
    border-radius: 999px;
    border: none;
    background: rgba(0,0,0,.5);
    color: #fff;
    font-size: 22px;
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce){
    .gallery-track{ transition: none; }
  }
  `;
  document.head.appendChild(style);
}

function openLightbox(src, alt=""){
  let lb = document.querySelector(".lightbox");
  if (!lb){
    lb = document.createElement("div");
    lb.className = "lightbox";

    const img = document.createElement("img");
    img.alt = alt;

    const close = document.createElement("button");
    close.className = "lb-close";
    close.type = "button";
    close.setAttribute("aria-label", "Cerrar");
    close.textContent = "✕";
    close.addEventListener("click", () => hide());

    lb.appendChild(img);
    lb.appendChild(close);
    lb.addEventListener("click", (ev) => { if (ev.target === lb) hide(); });

    window.addEventListener("keydown", (ev) => { if (ev.key === "Escape") hide(); });

    document.body.appendChild(lb);
  }

  const img = lb.querySelector("img");
  img.src = src;
  img.alt = alt;

  lb.classList.add("open");
  document.documentElement.style.overflow = "hidden"; // bloquea scroll de fondo

  function hide(){
    lb.classList.remove("open");
    document.documentElement.style.overflow = "";
  }
}

function isInViewport(el){
  const r = el.getBoundingClientRect();
  return r.top < (window.innerHeight || document.documentElement.clientHeight) && r.bottom > 0;
}


// ================================
// Ejemplo de integración en tu index.html (script principal)
// (Pega/ajusta estas líneas donde cargas/creas bloques)
// ================================
/*
// 1) Importa los nuevos módulos
import { createSplitHero } from './blocks/splitHero.js';
import { createGallery } from './blocks/gallery.js';

// 2) Crea el bloque especial de cabecera (antes de tus otros bloques)
const topHero = createSplitHero({
  bgSrc: './images/top-hero-bg.webp',
  side: 'right',
  sideSrc: './images/sofi-side.webp',
  ratio: '16 / 9',      // ajusta libremente (p.ej. '3 / 2' o '9 / 16')
  maxHeight: '70vh',    // opcional: limitar altura en pantallas altas
});

// 3) Inserta al inicio
app.prepend(topHero);

// ... aquí sigues creando tus otros bloques (createHeroBlock + createStack)

// 4) Crea la galería para el final
const gallery = createGallery({
  images: [
    './images/gal1.webp',
    './images/gal2.webp',
    './images/gal3.webp',
    './images/gal4.webp',
  ],
  ratio: '4 / 3',       // mismo ancho que el hero; alto según esta relación
  loop: true,
  openOnClick: true,
  captions: [
    'Sesión 1', 'Sesión 2', 'Sesión 3', 'Sesión 4'
  ],
});

// 5) Inserta al final
app.appendChild(gallery);
*/