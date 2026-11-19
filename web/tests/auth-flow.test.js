// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startAuth } from '../src/screens/auth.js';
import { createMemoryApi } from '../src/api/memory.js';
import { t, setLang } from '../src/i18n/index.js';

const tick = () => new Promise((r) => setTimeout(r, 0));
const $ = (sel) => document.querySelector(sel);
async function type(sel, value) { $(sel).value = value; }
async function click(sel) { $(sel).click(); await tick(); await tick(); }

describe('sign-up flow', () => {
  let root;
  beforeEach(() => { setLang('ky'); document.body.innerHTML = '<div id="root"></div>'; root = $('#root'); });

  it('rejects a bad phone without sending an SMS', async () => {
    const api = createMemoryApi();
    const spy = vi.spyOn(api.auth, 'sendCode');
    startAuth(root, api, () => {}, { requestLocation: async () => 'granted' });
    await type('#authPhone', '12345');
    await click('#authSend');
    expect($('#authErr').textContent).toBe(t('checkPhone'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('shows an SMS failure and stays on the phone step', async () => {
    const api = createMemoryApi({ failSend: true });
    startAuth(root, api, () => {}, { requestLocation: async () => 'granted' });
    await type('#authPhone', '0555123456');
    await click('#authSend');
    expect($('#authErr').textContent).toBe(t('smsFailed'));
    expect($('#authCode')).toBeNull();
  });

  it('goes phone → code → name → location and saves location_granted', async () => {
    const api = createMemoryApi();
    const upsert = vi.spyOn(api.profiles, 'upsert');
    const done = vi.fn();
    startAuth(root, api, done, { requestLocation: async () => 'granted' });
    await type('#authPhone', '+996 555 12 34 56');
    await click('#authSend');
    await type('#authCode', '123456');
    await click('#authVerify');
    await type('#authName', 'Айбек');
    await click('#authSaveName');
    await click('#authLocation');
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ location_granted: true }));
    expect(done).toHaveBeenCalledOnce();
    expect((await api.profiles.me()).name).toBe('Айбек');
  });

  it('finishes sign-up when location is denied, with a notice', async () => {
    const api = createMemoryApi();
    const upsert = vi.spyOn(api.profiles, 'upsert');
    const done = vi.fn();
    startAuth(root, api, done, { requestLocation: async () => 'denied' });
    await type('#authPhone', '555123456');
    await click('#authSend');
    await type('#authCode', '123456');
    await click('#authVerify');
    await type('#authName', 'Асель');
    await click('#authSaveName');
    await click('#authLocation');
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ location_granted: false }));
    expect($('#authNotice').textContent).toBe(t('locationLater'));
    expect(done).toHaveBeenCalledOnce();
  });
});
