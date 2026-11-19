// Car form: brand, model, year, plate (never shown to passengers), wheel, colour.
import { t } from '../i18n/index.js';
import { $, esc, I, topbar, toast } from '../ui/components.js';
import { COLORS } from '../ui/data.js';

export async function carScreen(ctx) {
  topbar(t('carTitle'), { back: ctx.back });
  const saved = await ctx.api.cars.mine();
  const c = saved ? { ...saved } : { brand: '', model: '', year: '', plate: '', wheel: 'L', color: 'black' };
  const draw = () => {
    $('#screen').innerHTML = `<h2>${t('carQ')}</h2>
    <form class="stack" id="carf" novalidate>
      <div class="field">${I.car}<input id="cb" maxlength="30" placeholder="${t('brand')}" aria-label="${t('brand')}" value="${esc(c.brand)}"></div>
      <div class="field">${I.car}<input id="cm" maxlength="30" placeholder="${t('model')}" aria-label="${t('model')}" value="${esc(c.model)}"></div>
      <div class="field">${I.cal}<input id="cy" type="number" inputmode="numeric" min="1970" max="2100" placeholder="${t('year')}" aria-label="${t('year')}" value="${esc(c.year ?? '')}"></div>
      <div class="field">${I.plate}<input id="cpl" maxlength="12" placeholder="${t('plate')}" aria-label="${t('plate')}" value="${esc(c.plate ?? '')}" style="text-transform:uppercase"></div>
      <p class="small muted" style="margin:-4px 0 0 4px">${t('plateNote')}</p>
      <div class="seg"><button type="button" data-w="L" class="${c.wheel === 'L' ? 'on' : ''}">${t('leftBtn')}</button><button type="button" data-w="R" class="${c.wheel === 'R' ? 'on' : ''}">${t('rightBtn')}</button></div>
      <span class="lbl">${t('colorLbl', { c: t('c_' + c.color) })}</span>
      <div class="colors">${COLORS.map(([n, h]) => `<button type="button" class="swatch ${c.color === n ? 'on' : ''}" data-c="${n}" style="background:${h}" aria-label="${t('c_' + n)}"></button>`).join('')}</div>
      <button class="btn" type="submit">${saved ? t('save') : t('add')}</button>
    </form>`;
    const keep = () => { c.brand = $('#cb').value; c.model = $('#cm').value; c.year = $('#cy').value; c.plate = $('#cpl').value.toUpperCase(); };
    document.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => { keep(); c.wheel = b.dataset.w; draw(); }; });
    document.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { keep(); c.color = b.dataset.c; draw(); }; });
    $('#carf').onsubmit = async (e) => {
      e.preventDefault(); keep();
      if (!c.brand.trim() || !c.model.trim()) return toast(t('needBrand'));
      await ctx.api.cars.save({ brand: c.brand.trim(), model: c.model.trim(), year: c.year ? Number(c.year) : null, color: c.color, wheel: c.wheel, plate: c.plate.trim() });
      toast(t('carSaved'));
      ctx.back();
    };
  };
  draw();
}
