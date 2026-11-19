// My trips: ones I drive and ones I booked, upcoming first.
import { t } from '../i18n/index.js';
import { $, I, topbar, tripCard } from '../ui/components.js';

export async function myTripsScreen(ctx) {
  topbar(t('myTrips'));
  const list = (await ctx.api.trips.mine()).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  $('#screen').innerHTML = list.length
    ? list.map((x) => `<div class="stack" style="gap:6px"><span><span class="pill ${x.driver === ctx.me.id ? '' : 'grey'}">${x.driver === ctx.me.id ? t('iDriver') : t('iPassenger')}</span></span>${tripCard(x)}</div>`).join('')
    : `<div class="card empty">${I.road}<h3 style="margin-top:8px">${t('emptyTrips')}</h3><p>${t('emptyTripsText')}</p></div>`;
  document.querySelectorAll('[data-trip]').forEach((b) => { b.onclick = () => ctx.go('trip', { id: b.dataset.trip }); });
}
