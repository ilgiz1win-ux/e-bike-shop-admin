// Home feed: ride-app header with from/to, destination chips, day chips, trips grouped by day.
import { t } from '../i18n/index.js';
import { $, esc, I, topbar, tripCard, citySheet } from '../ui/components.js';
import { dayLabel, bishkekDate } from '../lib/time.js';

const filter = { from: '', to: '', date: 'all' };
const POPULAR = ['Ош', 'Бишкек', 'Жалал-Абад', 'Каракол', 'Чолпон-Ата', 'Нарын', 'Талас', 'Балыкчы', 'Токмок'];

export async function homeScreen(ctx) {
  document.body.classList.add('on-home');
  topbar(t('homeTitle'));
  const all = await ctx.api.trips.search({ from: filter.from || undefined });
  const byDate = all.filter((x) => filter.date === 'all' || bishkekDate(new Date(x.starts_at)) === filter.date);
  const counts = {};
  byDate.forEach((x) => { counts[x.to_city] = (counts[x.to_city] || 0) + 1; });
  const list = byDate.filter((x) => !filter.to || x.to_city === filter.to);
  const cities = POPULAR.filter((c) => c !== filter.from);
  if (filter.to && !cities.includes(filter.to)) cities.unshift(filter.to);
  const today = bishkekDate(), tomorrow = bishkekDate(new Date(Date.now() + 86400e3));

  let last = '', body = '';
  for (const x of list) {
    const d = bishkekDate(new Date(x.starts_at));
    if (d !== last) { last = d; body += `<div class="section-title">${dayLabel(x.starts_at, ctx.me.lang)}</div>`; }
    body += tripCard(x);
  }

  $('#screen').innerHTML = `
  <section class="home-hero">
    <div class="hello"><b>${t('hello', { name: esc(ctx.me.name) })}</b><span>${t('helloSub')}</span></div>
    <div class="route-card">
      <button class="rc-row" id="fFrom">${I.pinO}<span><small>${t('from')}</small><b>${esc(filter.from) || t('anyCity')}</b></span></button>
      <i class="rc-div"></i>
      <button class="rc-row" id="fTo">${I.pin}<span><small>${t('to')}</small><b>${esc(filter.to) || t('anyCity')}</b></span></button>
      <button class="swap" id="fSwap" aria-label="${t('swap')}">${I.swap}</button>
    </div>
  </section>
  <div class="quick" style="grid-template-columns:1fr"><button class="qa" id="qaTrip"><span class="qa-ic">${I.car}</span><b>${t('chTrip')}</b><span>${t('qaTripS')}</span></button></div>
  <div class="chips scroll" aria-label="${t('goingTo')}"><button class="chip ${!filter.to ? 'on' : ''}" data-to="">${t('fAll')}<span class="cnt">${byDate.length}</span></button>${cities.map((c) => `<button class="chip ${filter.to === c ? 'on' : ''}" data-to="${esc(c)}">${esc(c)}<span class="cnt">${counts[c] || 0}</span></button>`).join('')}</div>
  <div class="chips scroll">${[['all', 'allDays'], [today, 'today'], [tomorrow, 'tomorrow']].map(([v, l]) => `<button class="chip ${filter.date === v ? 'on' : ''}" data-fd="${v}">${t(l)}</button>`).join('')}</div>
  <div class="found"><span>${t('found', { n: list.length })}</span></div>
  ${list.length ? body : `<div class="card empty">${I.road}<h3 style="margin-top:8px">${t('noOffers')}</h3><p>${t('noOffersText')}</p></div>`}`;

  const rerender = () => homeScreen(ctx);
  document.querySelectorAll('[data-to]').forEach((b) => { b.onclick = () => { filter.to = b.dataset.to; rerender(); }; });
  document.querySelectorAll('[data-fd]').forEach((b) => { b.onclick = () => { filter.date = b.dataset.fd; rerender(); }; });
  $('#fFrom').onclick = () => citySheet(filter.from, (c) => { filter.from = c; if (c && c === filter.to) filter.to = ''; rerender(); }, true);
  $('#fTo').onclick = () => citySheet(filter.to, (c) => { filter.to = c; if (c && c === filter.from) filter.from = ''; rerender(); }, true);
  $('#fSwap').onclick = () => { [filter.from, filter.to] = [filter.to, filter.from]; rerender(); };
  $('#qaTrip').onclick = () => ctx.switchTab('create');
  document.querySelectorAll('[data-trip]').forEach((b) => { b.onclick = () => ctx.go('trip', { id: b.dataset.trip }); });
}
