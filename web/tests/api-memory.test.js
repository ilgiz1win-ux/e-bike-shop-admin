import { describe, it, expect, beforeEach } from 'vitest';
import { createMemoryApi } from '../src/api/memory.js';

const future = (h) => new Date(Date.now() + h * 3600e3).toISOString();

describe('memory api', () => {
  let api;
  beforeEach(async () => {
    api = createMemoryApi({
      trips: [
        { id: 't1', driver: 'd1', from_city: 'Бишкек', to_city: 'Ош', starts_at: future(5), seats: 2, price: 1500 },
        { id: 't2', driver: 'd1', from_city: 'Бишкек', to_city: 'Нарын', starts_at: future(6), seats: 4, price: 600 },
        { id: 't3', driver: 'd1', from_city: 'Бишкек', to_city: 'Ош', starts_at: future(-2), seats: 4, price: 1500 },
      ],
      profiles: [{ id: 'd1', name: 'Иса', phone: '996555000111' }],
    });
    await api.auth.verifyCode('996700111222', '000000');
  });

  it('search filters by destination and hides past trips', async () => {
    const res = await api.trips.search({ to: 'Ош' });
    expect(res.map((x) => x.id)).toEqual(['t1']);
  });

  it('booking more seats than left fails with no_seats', async () => {
    await api.bookings.book('t1', 2);
    await expect(api.bookings.book('t1', 1)).rejects.toThrow('no_seats');
  });

  it('driver contact is hidden until the user books', async () => {
    expect(await api.trips.contact('t1')).toBeNull();
    await api.bookings.book('t1', 1);
    expect(await api.trips.contact('t1')).toBe('996555000111');
  });
});
