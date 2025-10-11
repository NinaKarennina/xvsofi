// blocks/hero.js
export function createHeroBlock({
  background,
  // overlays predefinidos
  topLeft, topRight, bottomLeft, bottomRight,
  leftCenter, rightCenter, center, bottomCenter,
  // overlays libres
  overlays = [],
  sizes = {},
  bgSpeed = 0,        // 0 = sin parallax; 0.1–0.3 = suave
  bgPosition = 0,     // 0..1 anclaje vertical del fondo (0=arriba, 1=abajo)
  anims = {},
  centerNode = null,
}) {
  const {
    small = "25vmin",
    sideH = "33vh",
    centerH = "40vh",
    bottomH = "28vh"
  } = sizes;

  const section = document.createElement("section");
  section.className = "hero-block reveal";
  section.style.setProperty("--img-small", small);
  section.style.setProperty("--side-h", sideH);
  section.style.setProperty("--center-h", centerH);
  section.style.setProperty("--bottom-h", bottomH);

  // Parallax + posición base del fondo
  section.dataset.bgSpeed = String(bgSpeed);
  section.style.setProperty("--bg-pos", `${bgPosition * 100}%`); // 0..100%

  // Fondo como background-image (control fino de posición)
  const bg = document.createElement("div");
  bg.className = "bg-layer parallax-bg";
  bg.style.backgroundImage = `url("${background}")`;
  section.appendChild(bg);

  const withAnim = (el, key) => {
    const name = anims[key];
    if (!name) return;
    el.classList.add("anim", `anim-${name}`);
  };

  const make = (cls, src, alt, key, baseTransform) => {
    if (!src) return;
    const img = document.createElement("img");
    img.className = cls + " anim";
    img.src = src;
    img.alt = alt || "";
    if (baseTransform) img.style.setProperty("--base-transform", baseTransform);
    withAnim(img, key);
    section.appendChild(img);
  };

  // Esquinas
  make("img-top-left",     topLeft,     "Decoración esquina izq sup", "topLeft");
  make("img-top-right",    topRight,    "Decoración esquina der sup", "topRight");
  make("img-bottom-left",  bottomLeft,  "Decoración esquina izq inf", "bottomLeft");
  make("img-bottom-right", bottomRight, "Decoración esquina der inf", "bottomRight");

  // Laterales centrados
  make("img-left-center",  leftCenter,  "Decoración lateral izq",  "leftCenter",  "translateY(-50%)");
  make("img-right-center", rightCenter, "Decoración lateral der",  "rightCenter", "translateY(-50%)");

  // Centro y abajo centro
  make("img-center",        center,       "Decoración centro",        "center",       "translate(-50%, -50%)");
  make("img-bottom-center", bottomCenter, "Decoración inferior",      "bottomCenter", "translateX(-50%)");

  overlays.forEach(({ src, alt, pos = "center", delay }) => {
    const cls = posClass(pos);
    if (!cls) return;
    const baseT = baseTransformFor(pos);
    const img = document.createElement("img");
    img.className = cls + " anim";
    img.src = src;
    img.alt = alt || "";
    if (baseT) img.style.setProperty("--base-transform", baseT);
    if (delay) img.style.setProperty("--delay", delay);
    section.appendChild(img);
  });

   if (centerNode) {
    const wrap = document.createElement("div");
    wrap.className = "center-node anim anim-fade-in";
    // Si quieres tamaño máximo desde fuera:
    wrap.style.maxWidth  = "min(92vw, 720px)";
    wrap.style.maxHeight = "70vh";
    wrap.appendChild(centerNode);
    section.appendChild(wrap);
  }

  return section;
}

function posClass(pos) {
  return ({
    "top-left": "img-top-left",
    "top-right": "img-top-right",
    "bottom-left": "img-bottom-left",
    "bottom-right": "img-bottom-right",
    "left-center": "img-left-center",
    "right-center": "img-right-center",
    "center": "img-center",
    "bottom-center": "img-bottom-center",
  })[pos] || null;
}
function baseTransformFor(pos) {
  return ({
    "left-center": "translateY(-50%)",
    "right-center": "translateY(-50%)",
    "center": "translate(-50%, -50%)",
    "bottom-center": "translateX(-50%)",
  })[pos] || null;
}

// ====== Estilos (inyecta una sola vez) ======
const styleId = "hero-block-style";
if (!document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .hero-block {
  position: relative;
  width: var(--device-w);
  margin-inline: auto;
  /* Altura por contenido */
  height: auto;
  min-height: unset;
  overflow: visible;
  background: transparent;
  isolation: isolate;
  margin-bottom:50px
}

/* Fondo opcional: lo dejamos disponible pero sin parallax */
.hero-block .bg-layer {
  position: relative;      /* ya NO absolute para que contribuya al flujo si la usas */
  inset: auto;
  width: 100%;
  height: auto;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: 50% 0%;
  /* Sin parallax → eliminamos var(--bg-shift) */
  will-change: auto;
  z-index: 0;
}
  .hero-block.fullscreen {
  height: var(--device-h, 100svh);
  min-height: var(--device-h, 100svh);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom:0px;   
}




    /* === posiciones base de overlays (igual que antes) === */
    .hero-block .img-top-left {
      position: absolute;
      top:0;
      left:0;
      width: var(--img-small);
      height: auto;
      object-fit: contain;
      pointer-events: none;
      transform: var(--base-transform, none);
    }
    .hero-block .img-top-right {
      position: absolute;
      top: 0;
      right: 0;
      width: var(--img-small);
      height: auto;
      object-fit: contain;
      pointer-events: none;
      transform: var(--base-transform, none);
    }
    .hero-block .img-bottom-left {
      position: absolute;
      bottom: 0;
      left: 0;
      max-width: 400px;
      max-height: 400px;
      object-fit: contain;
      pointer-events: none;
      z-index:3;
      transform: var(--base-transform, none);
    }
    .hero-block .img-bottom-right {
      position: absolute;
      bottom: 0;
      right: 0;
      max-width: 400px;
      max-height: 400px;
      object-fit: contain;
      pointer-events: none;
      z-index: 3;
      transform: var(--base-transform, none);
    }

    .hero-block .img-left-center {
      position: absolute;
      top: 50%;
      left: 0;
      max-height: 400px;
      max-width: 120px;
      object-fit: contain;
      pointer-events: none;
      --base-transform: translate(0%,-50%);
      transform: var(--base-transform);
      z-index:1;
    }
    .hero-block .img-right-center {
      position: absolute;
      top: 50%;
      right:0;
      max-height:400px ;
      max-width: 120px;
      object-fit: contain;
      pointer-events: none;
      z-index:1;
      transform: translate(0%,-50%);
    }
    .hero-block .img-center {
      position: absolute;
      top: 50%;
      left: 50%;
      max-height: 80vh;
      max-width: 80vw;
      object-fit: contain;
      pointer-events: none;
      z-index: 2;
      --base-transform: translate(-50%, -50%);
      transform: var(--base-transform);
    }
    .hero-block .img-bottom-center {
      position: absolute;
      bottom: 0;
      left: 50%;
      max-width: var(--device-w);
      max-height: 1000px;
      width: auto;
      object-fit: contain;
      pointer-events: none;
      z-index: 4;
      --base-transform: translateX(-50%);
      transform: var(--base-transform);
    }
    .hero-block img {
      user-select: none;
      -webkit-user-drag: none;
      pointer-events: none;
    }
    .hero-block .center-node{
      position:absolute;
      top:50%;
      left:50%;
      --base-transform: translate(-50%, -50%); /* 👈 base */
      transform: var(--base-transform);  
      z-index:0;
      max-width: 80vw;   /* ajusta si quieres limitar ancho del componente */
      max-height: 80vh;  /* para que no rebase */
      pointer-events:auto; /* por si el componente tiene botones */
    }



    /* ====== Animaciones seguras (no pisan el base) ====== */
    .reveal .anim {
      transition-property: opacity, transform;
      transition-duration: 800ms;
      transition-timing-function: cubic-bezier(.2,.65,.2,1);
      will-change: opacity, transform;
      transition-delay: var(--delay, 0ms);
    }
    .anim-fade-in     { --anim-transform: translateY(12px); }
    .anim-slide-up    { --anim-transform: translateY(24px); }
    .anim-slide-down  { --anim-transform: translateY(-24px); }
    .anim-slide-left  { --anim-transform: translateX(24px); }
    .anim-slide-right { --anim-transform: translateX(-24px); }
    .anim-zoom-in     { --anim-transform: scale(.9); }

    html.reveal-armed .reveal:not(.in-view) .anim {
      opacity: 0;
      transform: var(--base-transform, none) var(--anim-transform, translateY(12px));
    }
    .reveal.in-view .anim {
      opacity: 1;
      transform: var(--base-transform, none);
    }
    html.reveal-no-anim .reveal .anim {
      transition: none !important;
    }
  `;
  document.head.appendChild(style);
}
