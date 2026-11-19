// Loads supabase/migrations into PGlite with a minimal stand-in for Supabase's
// auth schema, so RLS policies and functions can be tested without Docker.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = new URL('../../../supabase/migrations/', import.meta.url).pathname;

const AUTH_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, phone text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`;

export async function createDb() {
  const db = new PGlite();
  await db.exec(AUTH_STUB);
  for (const f of readdirSync(MIGRATIONS).filter((x) => x.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS, f), 'utf8'));
  }
  return db;
}

// Run queries as a signed-in user (RLS applies), inside one transaction.
export async function as(db, userId, fn) {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    await tx.exec('set local role authenticated');
    return fn(tx);
  });
}

export async function addUser(db, id, phone, name = 'User') {
  await db.query('insert into auth.users (id, phone) values ($1, $2)', [id, phone]);
  await db.query('update public.profiles set name = $2 where id = $1', [id, name]);
}
