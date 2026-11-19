// Trip detail: route, price, driver, car; booking reveals the driver phone.
import { t, tp, getLang } from '../i18n/index.js';
import { $, esc, I, topbar, avatar, confirmSheet, toast, timeOf } from '../ui/components.js';
import { formatPhone } from '../lib/phone.js';
import { dayLabel } from '../lib/time.js';

export async function tripScreen(ctx, { id }) {
  topbar(t('trip'), { back: ctx.back });
  const tr = await ctx.api.trips.get(id).catch(() => null);
  if (!tr) { $('#screen').innerHTML = `<div class="card empty"><p>${t('tripGone')}</p></div>`; return; }
  const mine = tr.driver === ctx.me.id;
  const phone = await ctx.api.trips.contact(id);
  const myBooking = (await ctx.api.bookings.mine()).find((b) => b.trip === id && b.status === 'active');
  const left = tr.seats_left ?? tr.seats;
  let n = Math.min(1, left);

  $('#screen').innerHTML = `
  ${mine ? `<div class="banner">${I.bulb}<span>${t('yourTrip')}</span></div>` : ''}
  ${myBooking ? `<div class="banner">${I.bulb}<span>${t('youBooked', { n: myBooking.seats, seats: tp(myBooking.seats, 'seat') })}</span></div>` : ''}
  <div class="card stack">
    <h2 style="margin:0">${dayLabel(tr.starts_at, getLang())}</h2>
    <div class="tl"><div class="rail">${I.pinO}<span class="dots"></span>${I.pin}</div>
      <div class="stop"><b>${timeOf(tr.starts_at)} ${esc(tr.from_city)}</b></div>
      <div class="stop" style="margin-top:14px"><b>${tr.ends_at ? timeOf(tr.ends_at) : '—'} ${esc(tr.to_city)}</b></div></div>
    <div class="muted small">${t('paymentLbl', { p: t('pay_' + tr.payment) })}</div>
    <div><span class="price">${tr.price} с</span> <span class="muted small">${t('perSeat')}, ${left ? t('leftSeats', { n: left, seats: tp(left, 'seat') }) : t('noSeats')}</span></div>
  </div>
  <div class="section-title">${t('driver')}</div>
  <div class="card"><div class="row">${avatar(tr.driver_name)}<div style="flex:1"><b>${esc(tr.driver_name)}</b></div></div>
    ${phone && !mine ? `<div class="contact"><a href="tel:+${esc(phone)}">${I.phone} ${t('call')}</a><a href="https://wa.me/${esc(phone)}" target="_blank" rel="noopener">${I.chat} ${t('write')}</a></div>` : ''}
  </div>
  ${phone && !mine ? `<p class="small muted" style="margin:-8px 0 0;text-align:center">${t('phoneLbl')} <b id="drvPhone" style="user-select:all;color:var(--fg)">${esc(formatPhone(phone))}</b></p>` : ''}
  ${tr.comment ? `<div class="section-title">${t('details')}</div><div class="card small">${esc(tr.comment)}</div>` : ''}
  <div class="section-title">${t('carLbl')}</div>
  <div class="card row"><div class="carpic">${I.car}</div><b style="font-weight:500">${esc(tr.car ? `${tr.car.brand} ${tr.car.model}${tr.car.year ? ', ' + tr.car.year : ''}` : t('notSpecified'))}</b></div>
  <div class="stack" id="act"></div>`;

  const act = $('#act');
  if (mine) act.innerHTML = `<button class="btn danger" id="del">${t('deleteTrip')}</button>`;
  else if (myBooking) act.innerHTML = `<button class="btn ghost" id="cancel">${t('cancelBooking')}</button>`;
  else if (left) act.innerHTML = `<div class="row between"><span class="muted">${t('seatsLbl')}</span><div class="counter" style="width:160px"><button id="bm" aria-label="−">−</button><span id="bn">${n}</span><button id="bp" aria-label="+">+</button></div></div>
    <button class="btn" id="book">${t('bookFor', { sum: `<span id="bsum">${tr.price * n}</span>` })}</button><p class="small muted" style="margin:0;text-align:center">${t('callTip')}</p>`;
  else act.innerHTML = `<div class="card muted" style="text-align:center">${t('noFreeSeats')}</div>`;

  const upd = () => { $('#bn').textContent = n; $('#bsum').textContent = tr.price * n; };
  if ($('#bm')) { $('#bm').onclick = () => { n = Math.max(1, n - 1); upd(); }; $('#bp').onclick = () => { n = Math.min(left, n + 1); upd(); }; }
  if ($('#book')) $('#book').onclick = () => confirmSheet(t('confirmBooking'),
    t('confirmBookingText', { from: tr.from_city, to: tr.to_city, date: dayLabel(tr.starts_at, getLang()), time: timeOf(tr.starts_at), n, seats: tp(n, 'seat'), sum: tr.price * n }),
    t('book'), async () => {
      try { await ctx.api.bookings.book(id, n); toast(t('booked')); } catch (e) { toast(e.message === 'no_seats' ? t('noFreeSeats') : t('tripGone')); }
      tripScreen(ctx, { id });
    });
  if ($('#cancel')) $('#cancel').onclick = () => confirmSheet(t('cancelQ'), t('cancelText'), t('cancelOk'), async () => { await ctx.api.bookings.cancel(myBooking.id); toast(t('cancelled')); tripScreen(ctx, { id }); }, true);
  if ($('#del')) $('#del').onclick = () => confirmSheet(t('delQ'), t('delText'), t('del'), async () => { await ctx.api.trips.cancel(id); toast(t('deleted')); ctx.back(); }, true);
}
