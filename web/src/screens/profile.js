// Profile: name, verified phone, language, car, sign out.
import { t, setLang, getLang } from '../i18n/index.js';
import { $, esc, I, topbar, avatar, confirmSheet } from '../ui/components.js';
import { formatPhone } from '../lib/phone.js';

export async function profileScreen(ctx) {
  topbar(t('tProfile'));
  const me = ctx.me;
  const car = await ctx.api.cars.mine();
  $('#screen').innerHTML = `
  <div class="hero-profile">${avatar(me.name, 'md')}<div style="flex:1;min-width:0"><b>${esc(me.name)}</b><span style="opacity:.85">${esc(formatPhone(me.phone ?? ''))}</span></div></div>
  <div class="list">
    <div class="li">${I.globe}<span class="grow">${t('language')}</span><div class="lang"><button data-lang="ky" class="${getLang() === 'ky' ? 'on' : ''}">KG</button><button data-lang="ru" class="${getLang() === 'ru' ? 'on' : ''}">RU</button></div></div>
    <button class="li" id="pCar">${I.car.replace('<svg', '<svg class="ic"')}<span class="grow">${t('carTitle')}<span class="small muted" style="display:block">${car ? esc(`${car.brand} ${car.model}`) : t('notAdded')}</span></span>${I.chev}</button>
  </div>
  <div class="list"><button class="li danger" id="out">${I.out}<span class="grow">${t('logout')}</span></button></div>`;
  document.querySelectorAll('[data-lang]').forEach((b) => { b.onclick = async () => { setLang(b.dataset.lang); await ctx.api.profiles.upsert({ lang: b.dataset.lang }); await ctx.refreshMe(); profileScreen(ctx); }; });
  $('#pCar').onclick = () => ctx.go('car');
  $('#out').onclick = () => confirmSheet(t('logoutQ'), '', t('logoutOk'), async () => { await ctx.api.auth.signOut(); ctx.me = null; ctx.stack = []; location.reload(); }, true);
}
