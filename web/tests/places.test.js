import { describe, it, expect } from 'vitest';
import { inPlace, ALL_PLACES, PLACES } from '../src/ui/places.js';
import { createMemoryApi } from '../src/api/memory.js';

describe('inPlace', () => {
  it('matches the same place and points inside it', () => {
    expect(inPlace('Бишкек, Жал', 'Бишкек')).toBe(true);
    expect(inPlace('Бишкек', 'Бишкек')).toBe(true);
    expect(inPlace('Ош', 'Бишкек')).toBe(false);
    expect(inPlace('Бишкекчи', 'Бишкек')).toBe(false);
    expect(inPlace('Ош', '')).toBe(true);
  });
});

describe('places list', () => {
  it('has no duplicates and includes Bishkek points and villages', () => {
    expect(new Set(ALL_PLACES).size).toBe(ALL_PLACES.length);
    expect(PLACES.find((g) => g.key === 'bishkek').items).toContain('Бишкек, Дордой базары');
    expect(ALL_PLACES).toContain('Ананьево');
  });

  it('has bazaars of other towns, each a point inside its town, found once by search', () => {
    const bz = PLACES.find((g) => g.key === 'bazaars').items;
    expect(bz).toContain('Ош, Жайма базары');
    expect(bz).toContain('Баткен, Борбордук базар');
    expect(inPlace('Ош, Жайма базары', 'Ош')).toBe(true);
    expect(searchPlaces('Дордой').filter((h) => h.label === 'Бишкек, Дордой базары')).toHaveLength(1);
  });
});

describe('memory search with places', () => {
  it('a search to Бишкек finds trips to points inside Bishkek', async () => {
    const soon = new Date(Date.now() + 3600e3).toISOString();
    const api = createMemoryApi({ trips: [
      { id: 'a', driver: 'd', from_city: 'Бишкек, Жал', to_city: 'Бишкек, Дордой базары', starts_at: soon, seats: 3, price: 80 },
      { id: 'b', driver: 'd', from_city: 'Бишкек', to_city: 'Ош', starts_at: soon, seats: 3, price: 1500 },
    ] });
    expect((await api.trips.search({ from: 'Бишкек', to: 'Бишкек' })).map((x) => x.id)).toEqual(['a']);
  });
});

import { searchPlaces, RU_NAMES } from '../src/ui/places.js';
describe('searchPlaces', () => {
  it('finds a village by its Russian name', () => {
    const ru = Object.entries(RU_NAMES)[0];
    expect(searchPlaces(ru[1].toLowerCase()).map((x) => x.label)).toContain(ru[0]);
  });
  it('caps the number of results', () => {
    expect(searchPlaces('а').length).toBeLessThanOrEqual(80);
  });
  it('finds Naryn villages', () => {
    expect(searchPlaces('ат-башы').some((x) => x.label.startsWith('Ат-Башы'))).toBe(true);
  });
});
