# Жолдош — сайтты жайгаштыруу (1-этап)

Бардыгы акысыз пландарда. Төлөнүүчү бир гана нерсе — Nikita.kg'деги SMS.
Ачкычтарды (сырсөздөр, `service_role`) эч качан чатка, кодго же GitHub'ка жазбаңыз.

## 1. Supabase долбоору
1. https://supabase.com → **New project** (аты: `joldosh`, регион: Frankfurt же жакыныраак).
2. **Project Settings → API** бөлүмүнөн экөөнү алыңыз: `Project URL` жана `anon public` ачкычы (бул ачкыч ачык, сайтта колдонулат).
3. Supabase CLI менен миграцияны колдонуу:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push            # supabase/migrations/*.sql
   ```

## 2. SMS: Nikita.kg
1. Эдж-функцияны жайгаштыруу:
   ```bash
   npx supabase functions deploy send-sms --no-verify-jwt
   ```
2. **Authentication → Hooks → Send SMS hook** → тип *HTTPS*, дареги `https://<project-ref>.supabase.co/functions/v1/send-sms` → **Generate secret** (сырды көчүрүп алыңыз).
3. Сырларды коюу (терминалда, чатта эмес):
   ```bash
   npx supabase secrets set NIKITA_LOGIN=... NIKITA_PWD=... NIKITA_SENDER=SMSPRO.KG SEND_SMS_HOOK_SECRET='v1,whsec_...'
   ```
   `NIKITA_SENDER`: «Joldosh» аты бекитилгенче `SMSPRO.KG`.
4. **Authentication → Providers → Phone** → иштетүү. OTP узундугу 6, жарактуулук 300 сек.
5. Текшерүү: сайтта өз номериңиз менен кирүү. Nikita.kg аккаунту тестовый режимде турганда SMS профилдеги номерге гана барат.
   Келбесе: **Edge Functions → send-sms → Logs** (`nikita_failed` статусу). XML форматы Nikita.kg кабинетиндеги «API-интеграция» барагы менен дал келбесе, `supabase/functions/send-sms/nikita.js` оңдолот.

## 3. Сайт: Cloudflare Pages
1. https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → ушул репозиторий.
2. Build settings: Root directory `web`, Build command `npm run build`, Output `dist`.
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy → дарек `https://<аты>.pages.dev`.
5. Supabase → **Authentication → URL Configuration → Site URL** = ошол дарек.

## 4. Локалдык иштеп чыгуу
```bash
cd web
cp .env.example .env.local    # маанилерди толтуруңуз же VITE_BACKEND=memory
npm install
npm run dev                   # http://localhost:5173
npm test                      # unit + маалымат базасынын тесттери
npm run e2e                   # браузер тесттери (memory backend)
```

## Рабочий режимге өтүүдөн мурун
- Nikita.kg: жөнөтүүчү атын бекиттирүү (names@nikita.kg) жана келишим — ансыз SMS бөтөн номерлерге барбайт.
- Supabase Auth → Rate limits: бир номерге SMS жыштыгын чектөө (демейки 60 сек).
