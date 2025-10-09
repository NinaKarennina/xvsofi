// components/audioPlayer.js
// Reproductor mini en overlay (no ocupa renglón), centrado y con "follow" al splitHero.
// Mantiene el tamaño indicado y sube hasta top cuando haces scroll.

export function initAudioPlayer({
  src,
  width = 'calc(var(--device-w, 430px) * 0.30)', // ~30% de 430px
  color = '#9645ad',
  top = 15,                // posición final desde el borde superior (px)
  safeTopPx = 0,           // suma extra (p.ej. notch) si la necesitas
  followAnchor = null,     // selector o HTMLElement; ej: topHero o '.split-hero'
  followMargin = 12,       // separación visual entre anchor y player al “nacer”
  fadeWhileFollowing = true, // desvanecer 0→1 mientras sube
  fadeDistancePx = 160     // distancia de desplazamiento usada para mapear opacidad
} = {}) {
  if (!src) throw new Error('initAudioPlayer: falta src');

  // ===== Estilos (inyecta una vez) =====
  if (!document.getElementById('audio-mini-styles')) {
    const style = document.createElement('style');
    style.id = 'audio-mini-styles';
    style.textContent = `
:root{
  --am-gold: ${color};
  --am-gold-after: ${color}77;
}

/* Overlay fijo, centrado. translateY se controla con --am-shift */
.am-root{
  position: fixed;
  top: var(--am-top, 15px);
  left: 50%;
  transform: translate(-50%, var(--am-shift, 0px));
  width: var(--am-width, ${width});
  z-index: 9990;
  pointer-events: none;
  will-change: transform, opacity;
}

.am-wrap{
  pointer-events: auto;
  margin: 6px 0 0 0;
  display: grid;
  gap: 8px;
  justify-items: center;
}

/* barra finita + knob */
.am-bar{
  width: 100%;
  height: 2px;
  position: relative;
  background: linear-gradient(to right, var(--am-gold) 0%, var(--am-gold-after) 0%);
  border-radius: 999px;
  overflow: visible;
}
.am-knob{
  position: absolute; top: 50%; left: 0%;
  width: 10px; height: 10px; transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--am-gold);
  box-shadow: 0 1px 2px rgba(0,0,0,.15);
}

/* botón circular */
.am-btn{
  width: 35px; height: 35px; border-radius: 999px;
  background: transparent;
  border: 2px solid var(--am-gold);
  display: grid; place-items: center;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;
  backdrop-filter: blur(2px);
}
.am-btn:hover{ filter: saturate(1.05) brightness(1.02); }
.am-btn:active{ transform: translateY(1px); }

.am-icon{ width: 18px; height: 18px; display: block; }
.am-icon .play{ fill: var(--am-gold); }
.am-icon .pause rect{ fill: var(--am-gold); }

@media (prefers-reduced-motion: reduce){
  .am-btn{ transition: none; }
}
`;
    document.head.appendChild(style);
  }

  // ===== DOM =====
  const root = document.createElement('div');
  root.className = 'am-root';
  root.style.setProperty('--am-width', width);
  root.style.setProperty('--am-top', `${Number(top) + Number(safeTopPx)}px`);
  root.style.setProperty('--am-shift', '0px');
  if (fadeWhileFollowing) root.style.opacity = '1';

  root.setAttribute('role','region');
  root.setAttribute('aria-label','Reproductor');

  root.innerHTML = `
    <div class="am-wrap">
      <div class="am-bar" aria-label="Progreso" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
        <div class="am-knob"></div>
      </div>
      <button class="am-btn" aria-label="Reproducir" aria-pressed="false" title="Reproducir / Pausar">
        <svg class="am-icon" viewBox="0 0 24 24" aria-hidden="true">
          <polygon class="play" points="7,5 19,12 7,19"></polygon>
          <g class="pause" style="display:none;">
            <rect x="7" y="5" width="4" height="14" rx="1.2"></rect>
            <rect x="13" y="5" width="4" height="14" rx="1.2"></rect>
          </g>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(root);

  const bar   = root.querySelector('.am-bar');
  const knob  = root.querySelector('.am-knob');
  const btn   = root.querySelector('.am-btn');
  const svg   = root.querySelector('.am-icon');
  const playEl  = svg.querySelector('.play');
  const pauseEl = svg.querySelector('.pause');

  // ===== Audio =====
  const audio = new Audio();
  audio.src = src;
  audio.preload = 'metadata';
  audio.playsInline = true;

  let isScrubbing = false;

  function setProgress(p){ // 0..1
    const pct = Math.max(0, Math.min(1, p));
    bar.style.background =
      `linear-gradient(to right, var(--am-gold) ${pct*100}%, var(--am-gold-after) ${pct*100}%)`;
    knob.style.left = `${pct*100}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(pct*100)));
  }

  function toggleUI(playing){
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playEl.style.display  = playing ? 'none' : 'block';
    pauseEl.style.display = playing ? 'block' : 'none';
  }

  audio.addEventListener('timeupdate', () => {
    if (isScrubbing) return;
    if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
  });
  audio.addEventListener('play',  () => toggleUI(true));
  audio.addEventListener('pause', () => toggleUI(false));
  audio.addEventListener('ended', () => { audio.currentTime = 0; setProgress(0); toggleUI(false); });

  btn.addEventListener('click', () => {
    if (audio.paused) { audio.play().catch(()=>{}); } else { audio.pause(); }
  });

  // Seeking con puntero
  function clientXToPct(clientX){
    const rect = bar.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return rect.width ? (x / rect.width) : 0;
  }
  const seekAt = (pct) => {
    if (!isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = pct * audio.duration;
    setProgress(pct);
  };

  bar.addEventListener('pointerdown', (e) => {
    bar.setPointerCapture(e.pointerId);
    isScrubbing = true;
    seekAt(clientXToPct(e.clientX));
  });
  bar.addEventListener('pointermove', (e) => {
    if (!isScrubbing) return;
    seekAt(clientXToPct(e.clientX));
  });
  bar.addEventListener('pointerup',   () => { isScrubbing = false; });
  bar.addEventListener('pointercancel',() => { isScrubbing = false; });

  // Teclado accesible
  bar.addEventListener('keydown', (e) => {
    if (!isFinite(audio.duration) || audio.duration <= 0) return;
    const step = 5; // % por tecla
    let pct = (audio.currentTime / audio.duration) * 100;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); pct = Math.max(0, pct - step); }
    if (e.key === 'ArrowRight') { e.preventDefault(); pct = Math.min(100, pct + step); }
    seekAt(pct/100);
  });

  // inicia en 0
  setProgress(0);

  // ===== “Follow” del splitHero (overlay, sin ocupar layout) =====
  const anchorEl =
    typeof followAnchor === 'string'
      ? document.querySelector(followAnchor)
      : (followAnchor instanceof HTMLElement ? followAnchor : null);

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function updateShift(){
    if (!anchorEl) return;
    const r = anchorEl.getBoundingClientRect();
    const targetTop = Number(top) + Number(safeTopPx);
    const shift = Math.max(0, Math.round(r.bottom + Number(followMargin) - targetTop));
    root.style.setProperty('--am-shift', shift + 'px');

    if (fadeWhileFollowing) {
      // opacidad 0..1 mapeada por la distancia restante (shift)
      const o = 1 - clamp(shift / Number(fadeDistancePx || 1), 0, 1);
      root.style.opacity = String(o);
    }
  }

  if (anchorEl) {
    window.addEventListener('scroll', updateShift, { passive: true });
    window.addEventListener('resize', updateShift);
    updateShift();
  }

  // ===== API pública =====
  return {
    el: root,
    audio,
    play: () => audio.play(),
    pause: () => audio.pause(),
    toggle: () => (audio.paused ? audio.play() : audio.pause()),
    setColor: (c) => {
      document.documentElement.style.setProperty('--am-gold', c);
      document.documentElement.style.setProperty('--am-gold-after', c + '77');
    },
    setWidth: (w) => { root.style.setProperty('--am-width', w); },
    setTop: (px) => { root.style.setProperty('--am-top', `${px}px`); updateShift(); },
    setFollowAnchor: (elOrSelector) => {
      const el = typeof elOrSelector === 'string'
        ? document.querySelector(elOrSelector)
        : (elOrSelector instanceof HTMLElement ? elOrSelector : null);
      if (el) {
        window.removeEventListener('scroll', updateShift);
        window.removeEventListener('resize', updateShift);
        followAnchor = el;
        updateShift();
        window.addEventListener('scroll', updateShift, { passive: true });
        window.addEventListener('resize', updateShift);
      }
    }
  };
}
