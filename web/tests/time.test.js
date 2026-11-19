import { describe, it, expect } from 'vitest';
import { isPastInBishkek, durationText, dayLabel } from '../src/lib/time.js';

describe('isPastInBishkek', () => {
  const now = new Date('2026-11-19T09:00:00+06:00');
  it('is true for a trip earlier today in Bishkek time', () => {
    expect(isPastInBishkek('2026-11-19T08:00:00+06:00', now)).toBe(true);
  });
  it('is false for a trip later today', () => {
    expect(isPastInBishkek('2026-11-19T10:00:00+06:00', now)).toBe(false);
  });
});

describe('durationText', () => {
  it('formats hours and minutes in Kyrgyz and Russian', () => {
    const a = '2026-11-19T09:00:00+06:00', b = '2026-11-19T13:30:00+06:00';
    expect(durationText(a, b, 'ky')).toBe('4 саат 30 мүн');
    expect(durationText(a, b, 'ru')).toBe('4 ч 30 мин');
  });
  it('returns empty string without an end time', () => {
    expect(durationText('2026-11-19T09:00:00+06:00', null, 'ky')).toBe('');
  });
});

describe('dayLabel', () => {
  const now = new Date('2026-11-19T23:30:00+06:00');
  it('uses Bishkek calendar day for today and tomorrow', () => {
    expect(dayLabel('2026-11-19T23:50:00+06:00', 'ky', now)).toBe('Бүгүн');
    expect(dayLabel('2026-11-20T07:00:00+06:00', 'ru', now)).toBe('Завтра');
  });
});
