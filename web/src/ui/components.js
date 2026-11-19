// Shared UI pieces: escaping, avatar, trip card, top bar, sheets, toasts.
import { I } from './icons.js';
import { CITIES } from './data.js';
import { t, tp, getLang } from '../i18n/index.js';
import { durationText } from '../lib/time.js';

export const $ = (s, root = document) => root.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const AV = ['#14b8a6', '#1e88e5', '#f4511e', '#8e24aa', '#00897b', '#c0ca33', '#fb8c00', '#5e35b1', '#e91e63', '#3949ab'];
export function avatar(name, cls = '') {
  const n = String(name || '?');
  const color = AV[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return `<div class="avatar ${cls}" style="background:${color}">${esc(n.trim()[0] || '?').toUpperCase()}</div>`;
}

const hhmm = (iso) => new Date(new Date(iso).getTime() + 6 * 3600e3).toISOString().slice(11, 16);
export const timeOf = hhmm;

export function tripCard(tr) {
  const left = tr.seats_left ?? tr.seats;
  const seatIcons = Array.from({ length: Math.min(tr.seats, 6) }, (_, i) => `<span class="${i < tr.seats - left ? 'taken' : ''}">${I.seat}</span>`).join('');
  return `<button class="card trip" data-trip="${esc(tr.id)}" aria-label="${esc(tr.from_city)} — ${esc(tr.to_city)}, ${hhmm(tr.starts_at)}">
    <div class="tl">
      <div class="rail">${I.pinO}<span class="dots"></span>${I.pin}</div>
      <div class="stop"><div class="t">${hhmm(tr.starts_at)}</div><div class="c">${esc(tr.from_city)}</div></div>
      <div class="stop"><div class="t">${tr.ends_at ? hhmm(tr.ends_at) : '—'}</div><div class="c" data-dest="${esc(tr.to_city)}">${esc(tr.to_city)}</div></div>
      <div class="d tr-when">${durationText(tr.starts_at, tr.ends_at, getLang())}</div>
    </div>
    <div class="sep"></div>
    <div class="who">
      <div class="p">${avatar(tr.driver_name)}<div><div class="n">${esc(tr.driver_name)}</div><div class="s">${t('seatsFree', { n: left })}</div></div></div>
      <div class="p"><div class="carpic">${I.car}</div><div><div class="n">${esc(tr.car?.brand ?? t('carLbl'))}</div><div class="s">${esc(tr.car?.model ?? '')}${tr.car?.year ? ', ' + tr.car.year : ''}</div></div></div>
      <div class="row between"><div class="seats">${seatIcons}</div><div class="price">${tr.price} с</div></div>
    </div>
  </button>`;
}

export function topbar(title, { sub = '', back = null, right = '' } = {}) {
  $('#topbar').innerHTML = `<div>${back ? `<button class="icon-btn" id="bk" aria-label="${t('back')}">${I.back}</button>` : ''}</div>
    <h1>${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1><div style="display:flex;justify-content:flex-end">${right}</div>`;
  if (back) $('#bk').onclick = back;
}

export function sheet(html, onMount) {
  const ov = $('#overlay');
  ov.innerHTML = `<div class="sheet-wrap"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const wrap = ov.firstElementChild;
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeSheet(); });
  onMount?.(wrap.firstElementChild);
}
export function closeSheet() { $('#overlay').innerHTML = ''; }

export function confirmSheet(title, text, okLabel, onOk, danger = false) {
  sheet(`<h3>${esc(title)}</h3><p class="muted" style="margin:0">${esc(text)}</p>
    <button class="btn ${danger ? 'danger' : ''}" id="cOk">${esc(okLabel)}</button><button class="btn ghost" id="cNo">${t('back')}</button>`, (el) => {
    $('#cOk', el).onclick = () => { closeSheet(); onOk(); };
    $('#cNo', el).onclick = closeSheet;
  });
}

export function citySheet(current, onPick, allowAny = false) {
  sheet(`<h3>${t('chooseCity')}</h3><div class="field">${I.search}<input id="cq" placeholder="${t('startTyping')}" autocomplete="off"></div><div class="citylist" id="cl"></div>`, (el) => {
    const q = $('#cq', el), cl = $('#cl', el);
    const draw = () => {
      const v = q.value.trim().toLowerCase();
      const any = allowAny && !v ? `<button data-c="">${I.road}<span>${t('anyCity')}</span></button>` : '';
      cl.innerHTML = any + CITIES.filter((c) => c.toLowerCase().includes(v)).map((c) => `<button data-c="${esc(c)}">${I.pinO}<span>${esc(c)}</span>${c === current ? `<span class="pill" style="margin-left:auto">${t('selected')}</span>` : ''}</button>`).join('');
    };
    q.oninput = draw; draw();
    cl.onclick = (e) => { const b = e.target.closest('button'); if (b) { closeSheet(); onPick(b.dataset.c); } };
  });
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export const seatsWord = (n) => `${n} ${tp(n, 'seat')}`;
export { I };
