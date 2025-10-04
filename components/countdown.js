// components/countdown.js
export function createCountdown({
  target, // Date o string ej: '2026-01-15T00:00:00-06:00'
  bgSrc = "./images/countdown-bg.png",
  pill = {
    // estilo de las “píldoras” (rosa)
    height: "56px",
    minWidth: "88px",
    radius: "999px",
    color: "#9645ad", // rosa
    paddingInline: "16px",
    gapDigits: "6px",
  },
  gapBetweenPills = "16px",
  scaleWidth = "min(92vw, 720px)", // ancho máximo del componente
  digitsPath = (d) => `./digits/${d}.svg`, // mapping a partir del dígito
  zeroPad = { days: 2, hours: 2, minutes: 2, seconds: 2 }, // padding por campo
  labels = ["Días", "Horas", "Minutos", "Segundos"], // solo si NO están en el fondo
  showLabels = false, // déjalo en false si el fondo ya trae texto
}) {
  // Raíz
  const root = document.createElement("div");
  root.className = "cd-root";
  root.style.setProperty("--cd-width", scaleWidth);
  root.style.setProperty("--cd-gap-pills", gapBetweenPills);
  root.style.setProperty("--cd-pill-h", pill.height);
  root.style.setProperty("--cd-pill-minw", pill.minWidth);
  root.style.setProperty("--cd-pill-radius", pill.radius);
  root.style.setProperty("--cd-pill-color", pill.color);
  root.style.setProperty("--cd-pill-padx", pill.paddingInline);
  root.style.setProperty("--cd-digits-gap", pill.gapDigits);
  // dentro de createCountdown, tras crear 'root'
  const DESIGN_W = 720; // ancho base con el que hiciste el layout
  function setScale() {
    const w = root.clientWidth || DESIGN_W;
    const k = Math.max(0.5, Math.min(2, w / DESIGN_W)); // límites opcionales
    root.style.setProperty("--cd-scale", k);
  }

  // observa cambios de tamaño del componente
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(setScale);
    ro.observe(root);
  } else {
    // fallback simple
    window.addEventListener("resize", setScale);
  }
  setScale();

  // Fondo
  const bg = document.createElement("img");
  bg.className = "cd-bg";
  bg.src = bgSrc;
  bg.alt = "";

  bg.onload = () => {
    // relación de aspecto del arte del fondo (evita saltos en iOS)
    const w = bg.naturalWidth || 720;
    const h = bg.naturalHeight || 430;
    root.style.setProperty("--cd-ar", `${w} / ${h}`);

    // Rectángulo (en %) donde va la fila de pastillas dentro del fondo
    // Ajusta estos 4 números si tu PNG cambia: left, right, top, bottom (porcentaje).
    root.style.setProperty("--cd-box-left", "8"); // % desde el borde izquierdo
    root.style.setProperty("--cd-box-right", "8"); // % desde el borde derecho
    root.style.setProperty("--cd-box-top", "43"); // % desde arriba
    root.style.setProperty("--cd-box-bottom", "35"); // % desde abajo  => alto ≈ 22%
  };

  root.appendChild(bg);

  // Capa de UI (píldoras + dígitos) — centrada sobre el fondo
  const layer = document.createElement("div");
  layer.className = "cd-layer";
  root.appendChild(layer);

  // 4 contenedores (píldoras)
  const slots = ["days", "hours", "minutes", "seconds"].map(() => {
    const pillEl = document.createElement("div");
    pillEl.className = "cd-pill";
    pillEl.setAttribute("role", "group");
    pillEl.style.userSelect = "none";
    pillEl.style.webkitUserDrag = "none";
    layer.appendChild(pillEl);
    return pillEl;
  });

  // Etiquetas (si no vienen en tu imagen de fondo)
  if (showLabels) {
    const labelsRow = document.createElement("div");
    labelsRow.className = "cd-labels";
    labels.forEach((text) => {
      const span = document.createElement("span");
      span.textContent = text;
      labelsRow.appendChild(span);
    });
    root.appendChild(labelsRow);
  }

  // Render de un número con imágenes SVG por dígito
  function renderNumber(pillEl, n, padTo) {
    const str = String(n).padStart(padTo, "0");
    // Limpia y vuelve a poner los dígitos
    pillEl.replaceChildren();
    const row = document.createElement("div");
    row.className = "cd-digit-row";
    for (const ch of str) {
      const img = document.createElement("img");
      img.className = "cd-digit";
      img.src = digitsPath(ch);
      img.alt = ch;
      img.decoding = "async";
      img.loading = "eager"; // o 'lazy' si prefieres
      img.style.userSelect = "none";
      img.style.webkitUserDrag = "none";
      row.appendChild(img);
    }
    pillEl.appendChild(row);
  }

  // Lógica de tiempo
  const targetTime =
    target instanceof Date ? target.getTime() : new Date(target).getTime();

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, targetTime - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    renderNumber(slots[0], days, zeroPad.days ?? 2);
    renderNumber(slots[1], hours, zeroPad.hours ?? 2);
    renderNumber(slots[2], minutes, zeroPad.minutes ?? 2);
    renderNumber(slots[3], seconds, zeroPad.seconds ?? 2);

    if (targetTime - now <= 0) clearInterval(timer);
  }

  const timer = setInterval(tick, 1000);
  tick(); // primer render inmediato

  return root;
}

// —— CSS una sola vez
const STYLE_ID = "cd-style";
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.cd-root{
  position: relative;
  width: var(--cd-width, min(80vw, calc(var(--device-w, 430px) * 0.80)));
  margin-inline: auto;
  display: block;
  user-select: none;
  /* relación de aspecto igual al fondo (se setea en JS); fallback aproximado */
  aspect-ratio: var(--cd-ar, 720 / 430);
  --k: var(--cd-scale, 1);
}

.cd-bg{
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;   /* respeta márgenes del arte */
  display: block;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* Capa con las pastillas centrada y con ajuste fino vertical */
.cd-layer{
  position: absolute;
  left: 50%;
  top: var(--cd-layer-top, 50%);   /* ajustable en JS: 50–56% según tu PNG */
  transform: translate(-50%, -50%);
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--k) * 16px);
  max-width: 86%;                /* evita que toque los bordes dorados */
}

.cd-pill{
  min-width: calc(var(--k) * 70px);
  min-height: calc(var(--k) * 60px);
  border-radius: 999px;
  padding-inline: calc(var(--k) * 16px);
  background: var(--cd-pill-color, #A77A71);
  display:flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 0 rgba(255,255,255,.35) inset,
              0 10px 30px rgba(0,0,0,.18);
}

.cd-digit-row{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-height: calc(var(--k) * 10px);
}

.cd-digit{
  max-height: calc(var(--k) * 40px);
  width: auto;
  display: block;
  object-fit: contain;
}

.cd-labels{
  display:flex;
  justify-content:center;
  gap: clamp(calc(var(--k) * 12px), 5vmin, calc(var(--k) * 40px));
  margin-top: calc(var(--k) * 10px);
  font: 600 clamp(calc(var(--k) * 12px), 3.2vmin, calc(var(--k) * 16px))/1.3
        ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  opacity:.9;
}

  `;
  document.head.appendChild(style);
}
