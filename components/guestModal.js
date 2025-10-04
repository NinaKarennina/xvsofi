// components/guestModal.js
// Modal accesible + envío a Google Apps Script (FormData + no-cors)
// Estilo acorde a tu invitación + decoraciones opcionales en 5 posiciones
export function initGuestModal({
  scriptURL,
  title = 'Lista de invitados',
  description = 'Déjanos tu nombre, cuántas personas vienen y un mensaje opcional.',
  decorTopLeftSrc = '',
  decorTopRightSrc = '',
  decorBottomCenterSrc = '',
  decorRightCenterSrc = '',
  decorLeftCenterSrc = ''
} = {}) {
  if (!scriptURL) throw new Error('initGuestModal: falta scriptURL');

  // ===== CSS (inyectado una sola vez) =====
  if (!document.getElementById('guest-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'guest-modal-styles';
    style.textContent = `
:root{
  /* Base morada */
  --paper:#fbf7ff;            /* fondo crema-lila dentro del modal */
  --ink:#3a2a4e;              /* texto (ciruela oscura) */
  --purple:#7a55d6;           /* acento principal */
  --purple-soft:#d9cff6;      /* bordes neutros en inputs */
  --ring: rgba(122,85,214,.28);/* halo de foco morado */
  --overlay: rgba(58,37,104,.35);/* overlay morado translúcido */

  /* Marco del modal (degradado morado) */
  --frame1:#cbb8ff;
  --frame2:#efe9ff;
  --frame3:#a487e8;

  /* Oro del botón: ¡lo dejamos igual! */
  --gold1:#caa86a;
  --gold2:#e9d396;
  --gold3:#b58b3a;
}

#guest-modal-overlay{
  position:fixed; inset:0; display:none; align-items:center; justify-content:center;
  background:var(--overlay); backdrop-filter:blur(2px); z-index:9999; padding:16px;
}
#guest-modal-overlay[aria-hidden="false"]{ display:flex; }

#guest-modal{
  position:relative;
  width:min(520px, 100%);
  max-height:min(90svh, 720px);
  overflow:auto; overflow-x:hidden;
  border-radius:20px;
  background:
  linear-gradient(var(--paper), var(--paper)) padding-box,
  linear-gradient(135deg, var(--frame1), var(--frame2) 45%, var(--frame3)) border-box;
  border:2px solid transparent;
  color:var(--ink);
  box-shadow:0 10px 30px rgba(0,0,0,.22), 0 0 0 1px rgba(255,255,255,.6) inset;
  padding:14px;
  animation:modalIn .22s ease-out;
}

/* capa de contenido con padding uniforme */
.gm-content{ position:relative; z-index:1; padding:6px 16px 14px; }
#guest-modal, #guest-modal *{ font-size:16px; line-height:1.25; box-sizing:border-box; }

#guest-close{
  position:absolute; top:10px; right:10px; border:none; background:transparent;
  font-size:28px; line-height:1; cursor:pointer; color:var(--rose); z-index:2;
}

#guest-modal-title{ margin: 2px 36px 6px 2px; font-weight:700; letter-spacing:.4px; }
#guest-desc{ margin:0 2px 12px 2px; opacity:.9; }

/* Decoraciones */
.gm-decor{
  position:absolute; pointer-events:none; user-select:none; opacity:.9;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.12));
}
.gm-decor.tl{ top:-14px; left:-8px; width:120px; max-width:40%; transform:rotate(6deg); }
.gm-decor.tr{ top:-18px; right:-10px; width:120px; max-width:40%; transform:rotate(-6deg); }
.gm-decor.bc{ bottom:0px; left:50%; transform:translateX(-50%); width:180px; max-width:70%; }
.gm-decor.rc{ right:-12px; top:50%; transform:translateY(-50%) rotate(-2deg); width:110px; max-width:34%; }
.gm-decor.lc{ left:-12px; top:50%; transform:translateY(-50%) rotate(2deg); width:110px; max-width:34%; }

/* Formulario */
.field{ margin:12px 0; }
.field label{ display:block; margin-bottom:6px; font-weight:600; letter-spacing:.2px; }
.field input, .field textarea{
  width:100%; padding:12px; border-radius:12px; border:1px solid #d8cfc8;
  background:#fff; color:var(--ink); outline:none;
  box-shadow:0 0 0 0 rgba(0,0,0,0);
  transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;
}
.field textarea{ resize:vertical; }
.field input:focus, .field textarea:focus{
  border-color:var(--rose); box-shadow:0 0 0 4px var(--ring); background:#fffefd;
}
.err{ display:block; color:#c02626; margin-top:6px; min-height:1.2em; }

.actions{ display:flex; gap:10px; justify-content:flex-end; margin-top:10px; }

.btn-gold{
  appearance:none; cursor:pointer; border-radius:999px; border:2px solid transparent;
  padding:10px 16px; color:#2b1d12; font-weight:700; letter-spacing:.2px;
  background:
    linear-gradient(#fff2cc, #ffeeb3) padding-box,
    linear-gradient(135deg, var(--gold1), var(--gold2) 50%, var(--gold3)) border-box;
  box-shadow:0 2px 0 rgba(0,0,0,.05), 0 6px 16px rgba(202,168,106,.35);
  transition: transform .06s ease, box-shadow .2s ease, filter .2s ease;
}
.btn-gold:hover{ filter:saturate(1.05); box-shadow:0 3px 0 rgba(0,0,0,.06), 0 8px 20px rgba(202,168,106,.45); }
.btn-gold:active{ transform:translateY(1px); }
.btn-gold[disabled]{ opacity:.7; cursor:progress; }

.btn-ghost{
  appearance:none; cursor:pointer; border-radius:999px;
  padding:10px 16px; background:transparent; color:var(--rose);
  border:2px solid var(--purple-soft);
}

#guest-status{ margin-top:10px; min-height:1.2em; }
body.modal-open{ overflow:hidden; touch-action:none; }

@keyframes modalIn{
  from{ transform:translateY(6px) scale(.98); opacity:0; }
  to{ transform:translateY(0) scale(1); opacity:1; }
}
`;
    document.head.appendChild(style);
  }

  // ===== DOM =====
  const overlay = document.createElement('div');
  overlay.id = 'guest-modal-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
  <div id="guest-modal" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title">
    <button id="guest-close" aria-label="Cerrar">×</button>

    ${decorTopLeftSrc ? `<img class="gm-decor tl" alt="" aria-hidden="true" src="${decorTopLeftSrc}">` : ``}
    ${decorTopRightSrc ? `<img class="gm-decor tr" alt="" aria-hidden="true" src="${decorTopRightSrc}">` : ``}
    ${decorBottomCenterSrc ? `<img class="gm-decor bc" alt="" aria-hidden="true" src="${decorBottomCenterSrc}">` : ``}
    ${decorRightCenterSrc ? `<img class="gm-decor rc" alt="" aria-hidden="true" src="${decorRightCenterSrc}">` : ``}
    ${decorLeftCenterSrc ? `<img class="gm-decor lc" alt="" aria-hidden="true" src="${decorLeftCenterSrc}">` : ``}

    <div class="gm-content">
      <form id="guest-form" novalidate>
        <h3 style="margin:4px 0 8px 0;">Confirmación de asistencia</h3>
        <p style="margin:0 0 12px 0;">Por favor ayúdanos a confirmar tu asistencia antes del 20 de octubre.</p>

        <div class="field">
          <label>¿Asistirás?</label>
          <div style="display:flex; gap:25px; align-items:center; margin-top:6px;">
            <label style="display:flex; gap:1px; align-items:center;">
              <input type="radio" name="attend" id="attend-yes" value="SI" required>
              <span>Sí</span>
            </label>
            <label style="display:flex; gap:2px; align-items:center;">
              <input type="radio" name="attend" id="attend-no" value="NO" required>
              <span>No</span>
            </label>
          </div>
          <span class="err" data-for="attend"></span>
        </div>

        <div class="field">
          <label for="family">Familia:</label>
          <input id="family" name="family" type="text" required maxlength="120" placeholder="Apellido o nombres">
          <span class="err" data-for="family"></span>
        </div>

        <div class="field">
          <label>Número de personas que asistirán:</label>
          <div style="display:grid; grid-template-columns: auto 90px; align-items:center; gap:10px; margin-top:6px;">
            <span>• Adultos:</span>
            <input id="adults" name="adults" type="number" min="0" max="50" value="0" inputmode="numeric">
            <span>• Niños:</span>
            <input id="kids" name="kids" type="number" min="0" max="50" value="0" inputmode="numeric">
          </div>
          <span class="err" data-for="counts"></span>
        </div>

        <div id="guest-status" role="status" aria-live="polite" style="margin-top:10px;"></div>

        <p style="margin:12px 2px 0 2px; opacity:.95;">
          ¡Gracias por confirmar!<br>
          Te esperamos con mucha ilusión para disfrutar, divertirnos y bailar juntos. 🎉 💃🕺
        </p>

        <div class="actions">
          <button type="button" class="btn-ghost" id="guest-cancel">Cancelar</button>
          <button type="submit" class="btn-gold" id="guest-submit">Enviar</button>
        </div>
      </form>
    </div>
  </div>
  `;
  document.body.appendChild(overlay);

  // ===== Refs & helpers =====
  const closeBtn  = overlay.querySelector('#guest-close');
  const form      = overlay.querySelector('#guest-form');
  const submitBtn = overlay.querySelector('#guest-submit');
  const statusEl  = overlay.querySelector('#guest-status');

  const yesEl     = overlay.querySelector('#attend-yes');
  const noEl      = overlay.querySelector('#attend-no');
  const familyEl  = overlay.querySelector('#family');
  const adultsEl  = overlay.querySelector('#adults');
  const kidsEl    = overlay.querySelector('#kids');
  const msgEl     = overlay.querySelector('#message');

  function onEsc(e){ if(e.key === 'Escape') close(); }
  function open(){
    overlay.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    setTimeout(()=> (yesEl?.focus() ?? familyEl?.focus()), 0);
    document.addEventListener('keydown', onEsc);
  }
  function close(){
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onEsc);
    statusEl.textContent = '';
    form.reset();
    refreshCountsState();
  }
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  overlay.querySelector('#guest-cancel').addEventListener('click', close);

  function setError(n, msg){ const el = form.querySelector('.err[data-for="'+n+'"]'); if(el) el.textContent = msg || ''; }

  // Habilitar/deshabilitar conteos según Sí/No
  function refreshCountsState(){
    const no = noEl.checked;
    adultsEl.disabled = no;
    kidsEl.disabled = no;
    if (no) { adultsEl.value = '0'; kidsEl.value = '0'; }
  }
  yesEl.addEventListener('change', refreshCountsState);
  noEl.addEventListener('change', refreshCountsState);
  refreshCountsState();

  function validate(){
    let ok = true;
    setError('attend',''); setError('family',''); setError('counts','');

    const attend = yesEl.checked ? 'SI' : (noEl.checked ? 'NO' : '');
    if (!attend) { setError('attend','Selecciona una opción.'); ok = false; }

    if (!familyEl.value.trim()) { setError('family','Escribe el nombre de la familia.'); ok = false; }

    const a = Number(adultsEl.value||0), k = Number(kidsEl.value||0);
    if (attend === 'SI'){
      if (!Number.isFinite(a) || a<0 || !Number.isFinite(k) || k<0 || (a+k)<1){
        setError('counts','Indica al menos 1 persona (adultos + niños).'); ok = false;
      }
    }
    return ok;
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(!validate()) return;
    submitBtn.disabled = true; statusEl.textContent = 'Enviando…';

    const attend = yesEl.checked ? 'SI' : 'NO';
    const fd = new FormData();
    fd.append('attend', attend);
    fd.append('family', familyEl.value.trim().slice(0,120));
    fd.append('adults', String(Math.max(0, Number(adultsEl.value||0))));
    fd.append('kids',   String(Math.max(0, Number(kidsEl.value||0))));
    // fd.append('token', '...'); // cuando agregues el secreto

    try{
      await fetch("https://script.google.com/macros/s/AKfycbyVY_LKXzrvVOeVVZlQFzNESQ0x05xctPWkRhPrsVhR5DLlUxd5Pf6OFG6YcPHms5rq-Q/exec", { method:'POST', body: fd, mode:'no-cors' });
      statusEl.textContent = '¡Registro enviado! 🎉';
      setTimeout(close, 900);
    }catch(err){
      statusEl.textContent = 'Fallo de red: ' + err.message;
    }finally{
      submitBtn.disabled = false;
    }
  });

  return { open, close, node: overlay };
}
