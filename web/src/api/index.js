// Picks the backend: VITE_BACKEND=memory for tests/local work, Supabase otherwise.
import { createMemoryApi } from './memory.js';
import { demoSeed } from './seed.js';

let api;
export async function getApi() {
  if (api) return api;
  if (import.meta.env.VITE_BACKEND === 'memory') {
    api = createMemoryApi(demoSeed());
  } else {
    const { createSupabaseApi } = await import('./supabase.js');
    api = createSupabaseApi(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  }
  return api;
}
