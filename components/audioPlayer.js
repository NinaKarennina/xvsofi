// components/audioMini.js
// Reproductor fijo, súper compacto, dorado. Solo play/pause + barra fina.

export function initAudioPlayer({
  src,
  width = 'calc(var(--device-w, 430px) * 0.3)',   // ≈ 30% de 430px (~129px)
  color = '#9645ad',                               // dorado base (ajústalo si quieres)
  topOffset = 'env(safe-area-inset-top)'           // respeta notch en iPhone
} = {}) {
  if (!src) throw new Error('initAudioMini: falta src');

  // ===== estilos (una sola vez) =====
  if (!document.getElementById('audio-mini-styles')) {
    const style = document.createElement('style');
    style.id = 'audio-mini-styles';
    style.textContent = `
:root { --am-gold: ${color};
        --am-gold-after: #9645ad77 }

.am-root{
  position: fixed; top: 15px; left: 50%; transform: translateX(-50%);
  width: ${width};
  z-index: 9990;
  padding-top: ${topOffset};
  pointer-events: none; /* deja pasar scroll si clican fuera */
}
.am-wrap{
  pointer-events: auto;
  margin: 6px 0 0 0;
  display: grid; gap: 8px; justify-items: center;
}

/* barra finita (2px) + knob */
.am-bar{
  width: 100%;
  height: 2px;
  position: relative;
  background: linear-gradient(to right, var(--am-gold) 0%, var(--am-gold--after) 0%); /* progreso por JS */
  border-radius: 999px;
  overflow: visible;
}
.am-bar::before{
  content: "";
  position: relative;  /* top:0; left:0; bottom:0 */
  width: var(--am-w, 0%);                 /* lo actualiza JS */
  background: var(--am-gold);             /* dorado lleno */
  border-radius: inherit;
}

.am-knob{
  position: absolute; top: 50%; left: 0%;
  width: 10px; height: 10px; transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--am-gold);
  box-shadow: 0 1px 2px rgba(0,0,0,.15);
}

/* botón circular sin relleno */
.am-btn{
  width: 35px; height: 35px; border-radius: 999px;
  background: transparent;
  border: 2px solid var(--am-gold);
  display: grid; place-items: center;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;
  backdrop-filter: blur(2px); /* un pelín de contraste sobre fondos claros */
}
.am-btn:hover{ filter: saturate(1.05) brightness(1.02); }
.am-btn:active{ transform: translateY(1px); }

/* icono dorado */
.am-icon{ width: 18px; height: 18px; display: block; }
.am-icon .play{ fill: var(--am-gold); }
.am-icon .pause rect{ fill: var(--am-gold); }

/* accesibilidad */
@media (prefers-reduced-motion: reduce){
  .am-btn{ transition: none; }
}
`;
    document.head.appendChild(style);
  }

  // ===== DOM =====
  const root = document.createElement('div');
  root.className = 'am-root';
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

  // ===== audio =====
  const audio = new Audio();
  audio.src = src;
  audio.preload = 'metadata';
  audio.playsInline = true; // iPhone

  let isScrubbing = false;

  function setProgress(p){ // p: 0..1
    const pct = Math.max(0, Math.min(1, p));
    bar.style.background = `linear-gradient(to right, var(--am-gold) ${pct*100}%, var(--am-gold-after) ${pct*100}%)`;
    knob.style.left = `${pct*100}%`;
    bar.setAttribute('aria-valuenow', String(Math.round(pct*100)));
  }

  function toggleUI(playing){
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playEl.style.display  = playing ? 'none' : 'block';
    pauseEl.style.display = playing ? 'block' : 'none';
  }

  // eventos audio
  audio.addEventListener('timeupdate', () => {
    if (isScrubbing) return;
    if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
  });
  audio.addEventListener('play',  () => toggleUI(true));
  audio.addEventListener('pause', () => toggleUI(false));
  audio.addEventListener('ended', () => { audio.currentTime = 0; setProgress(0); toggleUI(false); });

  // controles
  btn.addEventListener('click', () => {
    if (audio.paused) { audio.play().catch(()=>{}); } else { audio.pause(); }
  });

  // seeking tocando la barra
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
    const pct = clientXToPct(e.clientX);
    seekAt(pct);
  });
  bar.addEventListener('pointermove', (e) => {
    if (!isScrubbing) return;
    const pct = clientXToPct(e.clientX);
    seekAt(pct);
  });
  bar.addEventListener('pointerup',   () => { isScrubbing = false; });
  bar.addEventListener('pointercancel',() => { isScrubbing = false; });

  // teclado (accesible)
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

  // API
  return {
    el: root, audio,
    play: () => audio.play(),
    pause: () => audio.pause(),
    toggle: () => (audio.paused ? audio.play() : audio.pause()),
    setColor: (c) => { document.documentElement.style.setProperty('--am-gold', c); },
    setWidth: (w) => { root.style.width = w; }
  };
}
