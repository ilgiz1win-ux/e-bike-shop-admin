import { L } from './strings.js';

let lang = 'ky';

export const getLang = () => lang;
export function setLang(next) {
  if (next === 'ky' || next === 'ru') lang = next;
}

export function t(key, vars = {}) {
  const s = L[lang]?.[key] ?? L.ru[key] ?? key;
  return typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (_, x) => vars[x] ?? '') : s;
}

export function tp(n, key) {
  const f = L[lang].P[key];
  if (typeof f === 'string') return f;
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return f[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return f[1];
  return f[2];
}
