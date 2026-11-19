// Pure helpers for the Nikita.kg (smspro.nikita.kg) XML API.
// Format: POST XML <message> to NIKITA_URL; response <response><status>0</status>…</response>, 0 = accepted.
// Check against the cabinet's "API-интеграция" page when going live.

export const NIKITA_URL_DEFAULT = 'https://smspro.nikita.kg/api/message';

export const smsText = (code) => `Жолдош: кирүү кодуңуз ${code}. Эч кимге айтпаңыз.`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildNikitaXml({ login, pwd, sender, id, phone, text }) {
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + `<message><login>${esc(login)}</login><pwd>${esc(pwd)}</pwd><id>${esc(id)}</id>`
    + `<sender>${esc(sender)}</sender><text>${esc(text)}</text>`
    + `<phones><phone>${esc(phone)}</phone></phones></message>`;
}

export function parseNikitaResponse(xml) {
  const m = /<status>\s*(-?\d+)\s*<\/status>/.exec(String(xml));
  if (!m) return { ok: false, status: -1, message: 'unparseable' };
  const status = Number(m[1]);
  return status === 0 ? { ok: true, status } : { ok: false, status };
}
