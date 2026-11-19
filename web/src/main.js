import './styles/tokens.css';
import './styles/app.css';
import { getApi } from './api/index.js';
import { t, setLang, getLang } from './i18n/index.js';
import { $, I } from './ui/components.js';
import { startAuth } from './screens/auth.js';
import { homeScreen } from './screens/home.js';
import { tripScreen } from './screens/trip.js';
import { createTripScreen } from './screens/create-trip.js';
import { myTripsScreen } from './screens/my-trips.js';
import { profileScreen } from './screens/profile.js';
import { carScreen } from './screens/car.js';

const screens = { home: homeScreen, trip: tripScreen, create: createTripScreen, trips: myTripsScreen, profile: profileScreen, car: carScreen };
const TABS = [['trips', 'tTrips', I.road], ['home', 'tHome', I.search], ['create', 'tCreate', I.plus], ['profile', 'tProfile', I.user]];

export const ctx = {
  api: null, me: null, tab: 'home', stack: [],
  go(name, params = {}) { ctx.stack.push({ name, params }); render(); window.scrollTo(0, 0); },
  back() { ctx.stack.pop(); render(); },
  switchTab(name) { ctx.tab = name; ctx.stack = []; render(); window.scrollTo(0, 0); },
  async refreshMe() { ctx.me = await ctx.api.profiles.me(); if (ctx.me?.lang) setLang(ctx.me.lang); },
};

function renderTabs() {
  $('#tabs').innerHTML = TABS.map(([k, l, ic]) => `<button class="tab ${ctx.tab === k ? 'on' : ''}" data-t="${k}" aria-label="${t(l)}">${ic}<span>${t(l)}</span></button>`).join('');
  $('#tabs').onclick = (e) => { const b = e.target.closest('.tab'); if (b) ctx.switchTab(b.dataset.t); };
}

export async function render() {
  document.documentElement.lang = getLang();
  document.body.classList.remove('on-home');
  if (!ctx.me?.name) {
    $('.tabs').hidden = true;
    $('#topbar').innerHTML = '<div></div><h1>Жолдош</h1><div></div>';
    const root = $('#screen');
    root.innerHTML = '';
    startAuth(root, ctx.api, async () => { await ctx.refreshMe(); ctx.tab = 'home'; render(); });
    return;
  }
  $('.tabs').hidden = false;
  renderTabs();
  const top = ctx.stack[ctx.stack.length - 1];
  await (top ? screens[top.name](ctx, top.params) : screens[ctx.tab](ctx));
}

(async () => {
  ctx.api = await getApi();
  if (await ctx.api.auth.session()) await ctx.refreshMe();
  render();
})();
