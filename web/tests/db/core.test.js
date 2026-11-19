import { describe, it, expect, beforeEach } from 'vitest';
import { createDb, as, addUser } from './harness.js';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const P1 = '00000000-0000-0000-0000-0000000000a1';
const P2 = '00000000-0000-0000-0000-0000000000a2';
const NOCAR = '00000000-0000-0000-0000-0000000000c0';
const inHours = (h) => new Date(Date.now() + h * 3600e3).toISOString();

let db, tripB, tripLast, tripPast;

beforeEach(async () => {
  db = await createDb();
  for (const [id, phone] of [[A, '996555000001'], [B, '996555000002'], [P1, '996555000011'], [P2, '996555000012'], [NOCAR, '996555000099']]) {
    await addUser(db, id, phone);
  }
  for (const owner of [A, B]) {
    await db.query("insert into cars (owner, brand, model, year, color, wheel, plate) values ($1,'Toyota','Camry',2018,'white','L','01KG123ABC')", [owner]);
  }
  const ins = "insert into trips (driver, from_city, to_city, starts_at, seats, price) values ($1,'Бишкек',$2,$3,$4,500) returning id";
  tripB = (await db.query(ins, [B, 'Ош', inHours(5), 3])).rows[0].id;
  tripLast = (await db.query(ins, [B, 'Нарын', inHours(6), 1])).rows[0].id;
  tripPast = (await db.query(ins, [B, 'Талас', inHours(-1), 4])).rows[0].id;
});

describe('trips RLS', () => {
  it('a user cannot update another driver’s trip', async () => {
    await as(db, A, (tx) => tx.query('update trips set price = 1 where id = $1', [tripB]));
    const { rows } = await db.query('select price from trips where id = $1', [tripB]);
    expect(rows[0].price).toBe(500);
  });

  it('a user without a car cannot create a trip', async () => {
    await expect(as(db, NOCAR, (tx) => tx.query(
      "insert into trips (driver, from_city, to_city, starts_at, seats, price) values ($1,'Бишкек','Ош',$2,3,500)", [NOCAR, inHours(3)],
    ))).rejects.toThrow();
  });

  it('a driver with a car can create a trip', async () => {
    const r = await as(db, A, (tx) => tx.query(
      "insert into trips (driver, from_city, to_city, starts_at, seats, price) values ($1,'Бишкек','Ош',$2,3,500) returning id", [A, inHours(3)],
    ));
    expect(r.rows).toHaveLength(1);
  });
});

describe('book_seats', () => {
  it('sells the last seat only once', async () => {
    await as(db, P1, (tx) => tx.query('select book_seats($1, 1)', [tripLast]));
    await expect(as(db, P2, (tx) => tx.query('select book_seats($1, 1)', [tripLast]))).rejects.toThrow(/no_seats/);
    const { rows } = await db.query("select coalesce(sum(seats),0)::int as n from bookings where trip = $1 and status = 'active'", [tripLast]);
    expect(rows[0].n).toBe(1);
  });

  it('passengers cannot insert bookings directly', async () => {
    await expect(as(db, P1, (tx) => tx.query('insert into bookings (trip, passenger, seats) values ($1,$2,1)', [tripB, P1]))).rejects.toThrow();
  });
});

describe('trip_contact', () => {
  it('hides the driver phone until the passenger books', async () => {
    const before = await as(db, P1, (tx) => tx.query('select trip_contact($1) as phone', [tripB]));
    expect(before.rows[0].phone).toBeNull();
    await as(db, P1, (tx) => tx.query('select book_seats($1, 1)', [tripB]));
    const after = await as(db, P1, (tx) => tx.query('select trip_contact($1) as phone', [tripB]));
    expect(after.rows[0].phone).toBe('996555000002');
  });
});

describe('profiles', () => {
  it('a user cannot make themselves admin', async () => {
    await as(db, A, (tx) => tx.query("update profiles set role = 'admin' where id = $1", [A])).catch(() => {});
    const { rows } = await db.query('select role from profiles where id = $1', [A]);
    expect(rows[0].role).toBe('user');
  });

  it('a user cannot read another user’s phone from profiles', async () => {
    const r = await as(db, A, (tx) => tx.query('select phone from profiles where id = $1', [B]));
    expect(r.rows).toHaveLength(0);
  });
});

describe('trip_cards', () => {
  it('lists upcoming trips with seats left and hides past ones', async () => {
    const r = await as(db, P1, (tx) => tx.query('select id, seats_left, driver_name from trip_cards'));
    const ids = r.rows.map((x) => x.id);
    expect(ids).toContain(tripB);
    expect(ids).not.toContain(tripPast);
    expect(r.rows.find((x) => x.id === tripB).seats_left).toBe(3);
  });
});
