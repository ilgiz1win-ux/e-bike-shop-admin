// Sign-up: phone → SMS code → name → location permission.
import { t } from '../i18n/index.js';
import { normalizePhone, formatPhone } from '../lib/phone.js';
import { requestLocation as defaultRequestLocation } from '../lib/geo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function startAuth(root, api, onDone, deps = {}) {
  const requestLocation = deps.requestLocation ?? defaultRequestLocation;
  const st = { phone: '', step: 'phone', busy: false };

  const steps = (n) => `<div class="steps">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const err = () => '<p class="small" id="authErr" role="alert" style="margin:0;color:var(--danger)"></p>';
  const showErr = (msg) => { const e = root.querySelector('#authErr'); if (e) e.textContent = msg; };

  function draw() {
    if (st.step === 'phone') {
      root.innerHTML = `<form class="card stack" id="authForm" novalidate>${steps(1)}<h3>${t('login')}</h3>
        <label class="lbl" for="authPhone">${t('phone')}</label>
        <div class="field"><input id="authPhone" inputmode="tel" autocomplete="tel" placeholder="+996 555 00 00 00" value="${esc(st.phone ? formatPhone(st.phone) : '+996 ')}"></div>
        <p class="small muted" style="margin:0">${t('phoneNote')}</p>${err()}
        <button class="btn" type="submit" id="authSend">${t('getCode')}</button></form>`;
      root.querySelector('#authForm').onsubmit = (e) => { e.preventDefault(); send(); };
    } else if (st.step === 'code') {
      root.innerHTML = `<form class="card stack" id="authForm" novalidate>${steps(2)}<h3>${t('codeTitle')}</h3>
        <p class="muted" style="margin:0">${t('codeSent', { phone: esc(formatPhone(st.phone)) })}</p>
        <div class="field"><input id="authCode" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-label="${t('codeTitle')}"></div>${err()}
        <button class="btn" type="submit" id="authVerify">${t('confirm')}</button>
        <button class="linkbtn" type="button" id="authChange">${t('changeNumber')}</button></form>`;
      root.querySelector('#authForm').onsubmit = (e) => { e.preventDefault(); verify(); };
      root.querySelector('#authChange').onclick = () => { st.step = 'phone'; draw(); };
    } else if (st.step === 'name') {
      root.innerHTML = `<form class="card stack" id="authForm" novalidate>${steps(3)}<h3>${t('yourName')}</h3>
        <div class="field"><input id="authName" maxlength="30" autocomplete="given-name" placeholder="${t('namePh')}"></div>${err()}
        <button class="btn" type="submit" id="authSaveName">${t('continue')}</button></form>`;
      root.querySelector('#authForm').onsubmit = (e) => { e.preventDefault(); saveName(); };
    } else {
      root.innerHTML = `<div class="card stack">${steps(4)}<h3>${t('locationTitle')}</h3>
        <p class="muted" style="margin:0">${t('locationAsk')}</p>
        <p class="small" id="authNotice" role="status" style="margin:0"></p>
        <button class="btn" type="button" id="authLocation">${t('locationBtn')}</button></div>`;
      root.querySelector('#authLocation').onclick = askLocation;
    }
  }

  async function guard(fn) {
    if (st.busy) return;
    st.busy = true;
    try { await fn(); } finally { st.busy = false; }
  }

  const send = () => guard(async () => {
    const phone = normalizePhone(root.querySelector('#authPhone').value);
    if (!phone) return showErr(t('checkPhone'));
    try { await api.auth.sendCode(phone); } catch { return showErr(t('smsFailed')); }
    st.phone = phone; st.step = 'code'; draw();
  });

  const verify = () => guard(async () => {
    const code = root.querySelector('#authCode').value.replace(/\D/g, '');
    if (code.length !== 6) return showErr(t('enterCode'));
    try { await api.auth.verifyCode(st.phone, code); } catch { return showErr(t('wrongCode')); }
    const me = await api.profiles.me();
    st.step = me?.name ? 'location' : 'name'; draw();
  });

  const saveName = () => guard(async () => {
    const name = root.querySelector('#authName').value.trim();
    if (name.length < 2) return showErr(t('enterName'));
    await api.profiles.upsert({ name });
    st.step = 'location'; draw();
  });

  const askLocation = () => guard(async () => {
    const res = await requestLocation();
    const granted = res === 'granted';
    const profile = await api.profiles.upsert({ location_granted: granted });
    if (!granted) root.querySelector('#authNotice').textContent = t('locationLater');
    onDone(profile);
  });

  draw();
}
