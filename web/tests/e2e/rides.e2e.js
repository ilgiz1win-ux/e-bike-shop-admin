// Browser test on the memory backend: sign-up, filters, create trip, booking reveals phone.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { preview } from 'vite';

const require = createRequire('/opt/node-tools/');
const { chromium } = require('playwright');

let server, browser, base;
beforeAll(async () => {
  server = await preview({ preview: { port: 4317, strictPort: true }, build: { outDir: 'dist-e2e' } });
  base = 'http://localhost:4317';
  browser = await chromium.launch();
});
afterAll(async () => { await browser?.close(); await server?.close(); });

async function signUp(page, phone, name) {
  await page.goto(base);
  await page.fill('#authPhone', phone);
  await page.click('#authSend');
  await page.fill('#authCode', '123456');
  await page.click('#authVerify');
  await page.fill('#authName', name);
  await page.click('#authSaveName');
  await page.click('#authLocation');
  await page.waitForSelector('.home-hero');
}

describe('rides', () => {
  it('filters the home feed by destination', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.context().grantPermissions(['geolocation']);
    await signUp(page, '0700111222', 'Айбек');
    await page.click('[data-to="Ош"]');
    const dests = await page.$$eval('.trip [data-dest]', (els) => els.map((e) => e.dataset.dest));
    expect(dests.length).toBeGreaterThan(0);
    expect(new Set(dests)).toEqual(new Set(['Ош']));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.close();
  });

  it('a driver adds a car and publishes a trip that shows in My trips', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await signUp(page, '0700333444', 'Нурлан');
    await page.click('[data-t=create]');
    await page.click('#addCar');
    await page.fill('#cb', 'Toyota'); await page.fill('#cm', 'Camry');
    await page.click('#carf button[type=submit]');
    await page.click('#cTo');
    await page.click('.citylist button[data-c="Нарын"]');
    await page.fill('#cPrice', '600');
    await page.click('#cf button[type=submit]');
    await page.click('[data-t=trips]');
    const text = await page.textContent('#screen');
    expect(text).toContain('Нарын');
    await page.close();
  });

  it('the driver phone appears only after booking', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await signUp(page, '0700555666', 'Асель');
    await page.click('.trip');
    expect(await page.$('#drvPhone')).toBeNull();
    await page.click('#book');
    await page.click('#cOk');
    await page.waitForSelector('#drvPhone');
    expect(await page.textContent('#drvPhone')).toMatch(/\+996/);
    await page.close();
  });
});
