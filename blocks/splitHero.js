// ================================
// blocks/splitHero.js
// ================================
export function createSplitHero({
  bgSrc,                 // imagen de fondo (se recorta al contenedor)
  side = "left",         // "left" | "right"
  sideSrc = null,        // imagen que ocupa la mitad del ancho (opcional)
  sideAlt = "",
  ratio = "16 / 9",      // relación de aspecto del bloque (string CSS)
  maxHeight = null,      // ej. "70vh" (opcional)
  radius = "1px",       // borde redondeado del bloque
  shadow = "0 12px 40px rgba(0,0,0,.25)",
}) {
  const section = document.createElement("section");
  section.className = "split-hero";

  const inner = document.createElement("div");
  inner.className = "split-hero-inner";
  inner.style.setProperty("--ratio", ratio);
  if (maxHeight) inner.style.setProperty("--max-h", maxHeight);
  inner.style.setProperty("--radius", radius);
  inner.style.setProperty("--shadow", shadow);

  const bg = document.createElement("img");
  bg.className = "split-hero-bg";
  bg.src = bgSrc;
  bg.alt = "";
  inner.appendChild(bg);

  if (sideSrc) {
    const overlay = document.createElement("img");
    overlay.className = `split-hero-side ${side === "right" ? "right" : "left"}`;
    overlay.src = sideSrc;
    overlay.alt = sideAlt || "";
    inner.appendChild(overlay);
  }

  section.appendChild(inner);
  injectSplitHeroStyles();
  return section;
}

function injectSplitHeroStyles() {
  const ID = "split-hero-style";
  if (document.getElementById(ID)) return;
  const style = document.createElement("style");
  style.id = ID;
  style.textContent = `
  .split-hero{
    position: relative;
    width: var(--device-w);
    margin-inline: auto;
    /* Está en flujo → empuja todo hacia abajo, incluso el background del <body> */
  }
  .split-hero-inner{
    position: relative;
    width: 100%;
    aspect-ratio: var(--ratio, 16 / 9);
    max-height: var(--max-h, none);
    overflow: hidden;
    border-radius: var(--radius, 16px);
    box-shadow: var(--shadow, 0 12px 40px rgba(0,0,0,.25));
    isolation: isolate;
  }
  .split-hero-bg{
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;      /* recorte suave para diferentes fotos */
    display: block;
  }
  .split-hero-side{
    position: absolute;
    top: 0; bottom: 0;
    width: 50%;
    height: 100%;
    object-fit: contain;    /* respeta proporciones del PNG/SVG decorativo */
    pointer-events: none;   /* solo decorativo */
    filter: drop-shadow(0 10px 30px rgba(0,0,0,.25));
  }
  .split-hero-side.left{ left: 0; }
  .split-hero-side.right{ right: 0; }

  @media (prefers-reduced-motion: reduce){
    .split-hero-inner{ scroll-behavior: auto; }
  }
  `;
  document.head.appendChild(style);
}
