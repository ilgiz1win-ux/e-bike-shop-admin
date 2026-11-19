// Supabase Auth "Send SMS" hook → Nikita.kg.
// Secrets: NIKITA_LOGIN, NIKITA_PWD, NIKITA_SENDER, SEND_SMS_HOOK_SECRET (format "v1,whsec_..."), optional NIKITA_URL.
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { smsText, buildNikitaXml, parseNikitaResponse, NIKITA_URL_DEFAULT } from './nikita.js';

const fail = (message: string) =>
  new Response(JSON.stringify({ error: { http_code: 500, message } }), { status: 500, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const raw = await req.text();
  let payload: { user: { phone: string }; sms: { otp: string } };
  try {
    const secret = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '');
    payload = new Webhook(secret).verify(raw, Object.fromEntries(req.headers)) as typeof payload;
  } catch {
    return fail('bad_signature');
  }

  const phone = String(payload.user?.phone ?? '').replace(/\D/g, '');
  const xml = buildNikitaXml({
    login: Deno.env.get('NIKITA_LOGIN') ?? '',
    pwd: Deno.env.get('NIKITA_PWD') ?? '',
    sender: Deno.env.get('NIKITA_SENDER') ?? 'SMSPRO.KG',
    id: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
    phone,
    text: smsText(payload.sms.otp),
  });

  try {
    const res = await fetch(Deno.env.get('NIKITA_URL') ?? NIKITA_URL_DEFAULT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: xml,
    });
    const parsed = parseNikitaResponse(await res.text());
    if (!res.ok || !parsed.ok) {
      console.error('nikita_failed', res.status, parsed.status);
      return fail('sms_failed');
    }
  } catch (e) {
    console.error('nikita_unreachable', String(e));
    return fail('sms_failed');
  }
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
