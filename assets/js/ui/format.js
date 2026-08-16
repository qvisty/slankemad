/** Små hjælpere, som alle visninger bruger. */

export const $ = (v, rod = document) => rod.querySelector(v);
export const $$ = (v, rod = document) => [...rod.querySelectorAll(v)];

export const tal = (n, d = 0) =>
  Number.isFinite(Number(n))
    ? Number(n).toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '–';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const idag = () => new Date().toISOString().slice(0, 10);

export const minutter = m => (m >= 60 ? `${Math.floor(m / 60)} t ${m % 60} min` : `${m} min`);

/** Kort bekræftelse i bunden af skærmen. */
let toastTimer;
export function toast(besked) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    Object.assign(el.style, {
      position: 'fixed', left: '50%', transform: 'translateX(-50%)',
      bottom: 'calc(var(--bund) + 20px)', zIndex: '60',
      background: 'var(--text)', color: 'var(--bg)',
      padding: '10px 18px', borderRadius: '999px',
      fontSize: '14px', fontWeight: '600', boxShadow: 'var(--e3)',
      opacity: '0', transition: 'opacity .18s ease', pointerEvents: 'none',
      maxWidth: 'calc(100vw - 32px)', textAlign: 'center'
    });
    document.body.appendChild(el);
  }
  el.textContent = besked;
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2200);
}
