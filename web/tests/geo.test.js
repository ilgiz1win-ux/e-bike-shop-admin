import { describe, it, expect, afterEach, vi } from 'vitest';
import { requestLocation } from '../src/lib/geo.js';

afterEach(() => vi.unstubAllGlobals());

describe('requestLocation', () => {
  it('is unavailable without the geolocation API', async () => {
    vi.stubGlobal('navigator', {});
    expect(await requestLocation()).toBe('unavailable');
  });
  it('is granted when a position arrives', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (ok) => ok({ coords: { latitude: 42.87, longitude: 74.59 } }) } });
    expect(await requestLocation()).toBe('granted');
  });
  it('is denied on PERMISSION_DENIED', async () => {
    vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_ok, err) => err({ code: 1 }) } });
    expect(await requestLocation()).toBe('denied');
  });
});
