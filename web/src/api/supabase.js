// Supabase backend with the same shape as api/memory.js.
// Uses only the anon key; every rule is enforced by RLS and SQL functions.
import { createClient } from '@supabase/supabase-js';

const unwrap = ({ data, error }) => {
  if (error) throw new Error(/no_seats|not_found|own_trip|not_signed_in/.exec(error.message)?.[0] ?? error.message);
  return data;
};
const toCard = (r) => r && ({
  ...r,
  car: r.car_brand ? { brand: r.car_brand, model: r.car_model, year: r.car_year, color: r.car_color } : null,
});

export function createSupabaseApi(url, anonKey) {
  if (!url || !anonKey) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
  const sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  const uid = async () => {
    const { data } = await sb.auth.getSession();
    const id = data.session?.user?.id;
    if (!id) throw new Error('not_signed_in');
    return id;
  };

  return {
    auth: {
      async sendCode(phone) { unwrap(await sb.auth.signInWithOtp({ phone: '+' + phone })); return { phone }; },
      async verifyCode(phone, code) {
        const data = unwrap(await sb.auth.verifyOtp({ phone: '+' + phone, token: code, type: 'sms' }));
        return { userId: data.user.id };
      },
      async session() { const { data } = await sb.auth.getSession(); return data.session ? { userId: data.session.user.id } : null; },
      async signOut() { await sb.auth.signOut(); },
    },
    profiles: {
      async me() {
        const { data } = await sb.auth.getSession();
        if (!data.session) return null;
        return unwrap(await sb.from('profiles').select('*').eq('id', data.session.user.id).maybeSingle());
      },
      async upsert(patch) {
        const id = await uid();
        const { name, lang, location_granted, avatar_url } = patch;
        const clean = Object.fromEntries(Object.entries({ name, lang, location_granted, avatar_url }).filter(([, v]) => v !== undefined));
        return unwrap(await sb.from('profiles').update(clean).eq('id', id).select().single());
      },
    },
    cars: {
      async mine() { const id = await uid(); return unwrap(await sb.from('cars').select('*').eq('owner', id).maybeSingle()); },
      async save(car) {
        const id = await uid();
        const { brand, model, year, color, wheel, plate } = car;
        return unwrap(await sb.from('cars').upsert({ owner: id, brand, model, year, color, wheel, plate }, { onConflict: 'owner' }).select().single());
      },
    },
    trips: {
      async search({ from, to, date } = {}) {
        let q = sb.from('trip_cards').select('*').order('starts_at');
        // A place also matches points inside it ("Бишкек, Жал" is in "Бишкек").
        const within = (col, v) => `${col}.eq."${v}",${col}.like."${v}, *"`;
        if (from) q = q.or(within('from_city', from));
        if (to) q = q.or(within('to_city', to));
        if (date) q = q.gte('starts_at', `${date}T00:00:00+06:00`).lt('starts_at', `${date}T23:59:59+06:00`);
        return (unwrap(await q.limit(200)) ?? []).map(toCard);
      },
      async get(id) { return toCard(unwrap(await sb.from('trip_cards').select('*').eq('id', id).single())); },
      async create(input) {
        const id = await uid();
        const row = unwrap(await sb.from('trips').insert({ ...input, driver: id }).select('id').single());
        return this.get(row.id);
      },
      async mine() {
        const id = await uid();
        const own = unwrap(await sb.from('trip_cards').select('*').eq('driver', id));
        const bk = unwrap(await sb.from('bookings').select('trip').eq('passenger', id).eq('status', 'active'));
        const ids = bk.map((b) => b.trip);
        const booked = ids.length ? unwrap(await sb.from('trip_cards').select('*').in('id', ids)) : [];
        return [...own, ...booked].map(toCard);
      },
      async cancel(tripId) { unwrap(await sb.from('trips').update({ status: 'cancelled' }).eq('id', tripId)); },
      async contact(tripId) { return unwrap(await sb.rpc('trip_contact', { p_trip: tripId })); },
    },
    bookings: {
      async book(tripId, seats) { return unwrap(await sb.rpc('book_seats', { p_trip: tripId, p_seats: seats })); },
      async cancel(bookingId) { unwrap(await sb.rpc('cancel_booking', { p_booking: bookingId })); },
      async mine() { const id = await uid(); return unwrap(await sb.from('bookings').select('*').eq('passenger', id)); },
    },
  };
}
