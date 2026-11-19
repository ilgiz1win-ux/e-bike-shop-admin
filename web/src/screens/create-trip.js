// Create a trip (driver). Requires a car first.
import { t } from '../i18n/index.js';
import { $, esc, I, topbar, citySheet, toast } from '../ui/components.js';
import { bishkekDate } from '../lib/time.js';

const draft = { from: 'Бишкек', to: '', date: '', dep: '', arr: '', seats: 3, price: '', payment: 'cash', comment: '' };

function defaults() {
  const soon = new Date(Date.now() + 2 * 3600e3 + 6 * 3600e3); // Bishkek clock, two hours ahead
  if (!draft.date) draft.date = bishkekDate(new Date(Date.now() + 2 * 3600e3));
  if (!draft.dep) draft.dep = `${String(soon.getUTCHours()).padStart(2, '0')}:00`;
}
const toIso = (date, time) => (date && time ? new Date(`${date}T${time}:00+06:00`).toISOString() : null);

export async function createTripScreen(ctx) {
  topbar(t('newTrip'), { back: ctx.stack.length ? ctx.back : null });
  const car = await ctx.api.cars.mine();
  if (!car) {
    $('#screen').innerHTML = `<div class="card empty">${I.car}<h3 style="margin-top:8px">${t('addCarFirst')}</h3><p>${t('addCarText')}</p><button class="btn" id="addCar" style="margin-top:12px">${t('addCar')}</button></div>`;
    $('#addCar').onclick = () => ctx.go('car');
    return;
  }
  defaults();
  const c = draft;
  $('#screen').innerHTML = `
  <h2>${t('createHead')}</h2>
  <form class="stack" id="cf" novalidate>
    <div class="route-fields">
      <button type="button" class="field" id="cFrom" style="text-align:left">${I.pin}<span style="padding:13px 0">${esc(c.from) || `<span class="muted">${t('from')}</span>`}</span></button>
      <button type="button" class="field" id="cTo" style="text-align:left">${I.pin}<span style="padding:13px 0">${esc(c.to) || `<span class="muted">${t('to')}</span>`}</span></button>
    </div>
    <label class="lbl" for="cDate">${t('dateTime')}</label>
    <label class="field" for="cDate">${I.cal}<input type="date" id="cDate" min="${bishkekDate()}" value="${c.date}"></label>
    <div class="grid2">
      <div class="stack" style="gap:4px"><label class="lbl" for="cDep">${t('dep')}</label><label class="field" for="cDep">${I.clock}<input type="time" id="cDep" value="${c.dep}"></label></div>
      <div class="stack" style="gap:4px"><label class="lbl" for="cArr">${t('arr')}</label><label class="field" for="cArr">${I.clock}<input type="time" id="cArr" value="${c.arr}"></label></div>
    </div>
    <div class="grid2">
      <div class="stack" style="gap:4px"><span class="lbl">${t('freeSeats')}</span><div class="counter"><button type="button" id="sm">−</button><span><b id="sn">${c.seats}</b></span><button type="button" id="sp">+</button></div></div>
      <div class="stack" style="gap:4px"><label class="lbl" for="cPrice">${t('pricePerSeat')}</label><label class="field" for="cPrice">${I.wallet}<input type="number" id="cPrice" inputmode="numeric" min="0" step="10" placeholder="400" value="${esc(c.price)}"></label></div>
    </div>
    <label class="lbl" for="cPay">${t('payLbl')}</label>
    <label class="field" for="cPay">${I.wallet}<select id="cPay">${['cash', 'transfer', 'both'].map((p) => `<option value="${p}" ${p === c.payment ? 'selected' : ''}>${t('pay_' + p)}</option>`).join('')}</select></label>
    <label class="lbl" for="cCom">${t('details')}</label>
    <div class="field"><textarea id="cCom" maxlength="300" placeholder="${t('detailsPh')}">${esc(c.comment)}</textarea></div>
    <button class="btn" type="submit">${t('publish')}</button>
  </form>`;
  const keep = () => { c.date = $('#cDate').value; c.dep = $('#cDep').value; c.arr = $('#cArr').value; c.price = $('#cPrice').value; c.payment = $('#cPay').value; c.comment = $('#cCom').value; };
  const again = () => createTripScreen(ctx);
  $('#cFrom').onclick = () => { keep(); citySheet(c.from, (x) => { c.from = x; again(); }); };
  $('#cTo').onclick = () => { keep(); citySheet(c.to, (x) => { c.to = x; again(); }); };
  $('#sm').onclick = () => { c.seats = Math.max(1, c.seats - 1); $('#sn').textContent = c.seats; };
  $('#sp').onclick = () => { c.seats = Math.min(8, c.seats + 1); $('#sn').textContent = c.seats; };
  $('#cf').onsubmit = async (e) => {
    e.preventDefault(); keep();
    if (!c.from || !c.to) return toast(t('bothCities'));
    if (c.from === c.to) return toast(t('citiesDiffer'));
    const starts = toIso(c.date, c.dep);
    if (!starts) return toast(t('needDateTime'));
    if (new Date(starts) <= new Date()) return toast(t('timePassed'));
    const price = parseInt(c.price, 10);
    if (!(price >= 0)) return toast(t('needPrice'));
    let ends = toIso(c.date, c.arr);
    if (ends && new Date(ends) <= new Date(starts)) ends = new Date(new Date(ends).getTime() + 86400e3).toISOString();
    try {
      const tr = await ctx.api.trips.create({ from_city: c.from, to_city: c.to, starts_at: starts, ends_at: ends, seats: c.seats, price, payment: c.payment, comment: c.comment.trim() });
      Object.assign(draft, { to: '', price: '', comment: '', arr: '', date: '', dep: '' });
      toast(t('published'));
      ctx.tab = 'trips'; ctx.stack = []; ctx.go('trip', { id: tr.id });
    } catch (err) { toast(err.message === 'no_car' ? t('addCarFirst') : t('errFill')); }
  };
}
