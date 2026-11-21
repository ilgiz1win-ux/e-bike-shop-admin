// In-memory backend with the same shape as api/supabase.js.
// Used by tests and for local work without Supabase. Mirrors the server rules
// that the UI relies on: past trips hidden, seats never oversold, driver phone
// visible only to the driver and to passengers with an active booking.
import { inPlace } from '../ui/places.js';

const uid = () => Math.random().toString(36).slice(2, 10);

export function createMemoryApi(seed = {}) {
  const db = {
    profiles: [...(seed.profiles ?? [])],
    cars: [...(seed.cars ?? [])],
    trips: (seed.trips ?? []).map((x) => ({ status: 'active', ...x })),
    bookings: [...(seed.bookings ?? [])],
  };
  let me = null;
  const failSend = seed.failSend ?? false;

  const need = () => { if (!me) throw new Error('not_signed_in'); return me; };
  const booked = (tripId) => db.bookings.filter((b) => b.trip === tripId && b.status === 'active').reduce((a, b) => a + b.seats, 0);
  const card = (tr) => {
    const d = db.profiles.find((p) => p.id === tr.driver);
    const car = db.cars.find((c) => c.owner === tr.driver) ?? null;
    return { ...tr, driver_name: d?.name ?? '', car, seats_left: tr.seats - booked(tr.id) };
  };

  return {
    auth: {
      async sendCode(phone) { if (failSend) throw new Error('sms_failed'); return { phone }; },
      async verifyCode(phone, code) {
        if (!/^\d{6}$/.test(code)) throw new Error('bad_code');
        let p = db.profiles.find((x) => x.phone === phone);
        me = p?.id ?? 'u_' + phone;
        if (!p) db.profiles.push({ id: me, phone, name: '', lang: 'ky', location_granted: false });
        return { userId: me };
      },
      async session() { return me ? { userId: me } : null; },
      async signOut() { me = null; },
    },
    profiles: {
      async me() { return me ? db.profiles.find((p) => p.id === me) ?? null : null; },
      async upsert(patch) {
        const id = need();
        const p = db.profiles.find((x) => x.id === id);
        const { role, blocked, ...safe } = patch;
        Object.assign(p, safe);
        return { ...p };
      },
    },
    cars: {
      async mine() { const id = need(); return db.cars.find((c) => c.owner === id) ?? null; },
      async save(car) {
        const id = need();
        const i = db.cars.findIndex((c) => c.owner === id);
        const row = { id: i >= 0 ? db.cars[i].id : uid(), ...car, owner: id };
        if (i >= 0) db.cars[i] = row; else db.cars.push(row);
        return row;
      },
    },
    trips: {
      async search({ from, to, date } = {}) {
        const now = Date.now();
        return db.trips
          .filter((x) => x.status === 'active' && new Date(x.starts_at).getTime() > now)
          .filter((x) => inPlace(x.from_city, from) && inPlace(x.to_city, to))
          .filter((x) => !date || x.starts_at.slice(0, 10) === date)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
          .map(card);
      },
      async get(id) { const tr = db.trips.find((x) => x.id === id); if (!tr) throw new Error('not_found'); return card(tr); },
      async create(input) {
        const id = need();
        if (!db.cars.some((c) => c.owner === id)) throw new Error('no_car');
        const tr = { id: uid(), status: 'active', ...input, driver: id };
        db.trips.push(tr);
        return card(tr);
      },
      async mine() {
        const id = need();
        const mineIds = new Set(db.bookings.filter((b) => b.passenger === id && b.status === 'active').map((b) => b.trip));
        return db.trips.filter((x) => x.driver === id || mineIds.has(x.id)).map(card);
      },
      async cancel(tripId) {
        const id = need();
        const tr = db.trips.find((x) => x.id === tripId && x.driver === id);
        if (!tr) throw new Error('forbidden');
        tr.status = 'cancelled';
      },
      async contact(tripId) {
        const id = need();
        const tr = db.trips.find((x) => x.id === tripId);
        if (!tr) return null;
        const allowed = tr.driver === id || db.bookings.some((b) => b.trip === tripId && b.passenger === id && b.status === 'active');
        return allowed ? db.profiles.find((p) => p.id === tr.driver)?.phone ?? null : null;
      },
    },
    bookings: {
      async book(tripId, seats) {
        const id = need();
        const tr = db.trips.find((x) => x.id === tripId && x.status === 'active');
        if (!tr) throw new Error('not_found');
        if (!(seats > 0) || booked(tripId) + seats > tr.seats) throw new Error('no_seats');
        const b = { id: uid(), trip: tripId, passenger: id, seats, status: 'active' };
        db.bookings.push(b);
        return b;
      },
      async cancel(bookingId) {
        const id = need();
        const b = db.bookings.find((x) => x.id === bookingId && x.passenger === id);
        if (!b) throw new Error('forbidden');
        b.status = 'cancelled';
      },
      async mine() { const id = need(); return db.bookings.filter((b) => b.passenger === id); },
    },
  };
}
