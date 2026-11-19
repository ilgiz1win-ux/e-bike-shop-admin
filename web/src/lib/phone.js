// Kyrgyz mobile numbers: stored as 996XXXXXXXXX, shown as +996 XXX XX XX XX.
export function normalizePhone(input) {
  let d = String(input ?? '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) d = '996' + d.slice(1);
  else if (d.length === 9) d = '996' + d;
  return /^996\d{9}$/.test(d) ? d : null;
}

export function formatPhone(p) {
  const d = String(p ?? '').replace(/\D/g, '');
  if (d.length !== 12) return p;
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
}
