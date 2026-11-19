# Жолдош веб — 1-этап: негиз, SMS-кирүү, попутка — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Чыныгы колдонуучулар SMS код менен катталып, попутка сапарларын жарыялап, издеп жана орун брондой ала турган иштеген сайт.

**Architecture:** `web/` — Vite + жөнөкөй JS модулдары (демонун экрандары, CSS токендери жана KG/RU тексттери модулдарга бөлүнөт). Бардык маалымат `api` интерфейси аркылуу өтөт: `api/supabase.js` (чыныгы) жана `api/memory.js` (тест жана Supabase'сиз локалдык иш). `supabase/` — SQL миграциялары (RLS менен) жана SMS үчүн эдж-функция (Send SMS hook → Nikita.kg).

**Tech Stack:** Node 22, Vite 8, Vitest 5, Playwright (контейнерде орнотулган), @supabase/supabase-js 2, PGlite 0.5 (миграциялар жана RLS тесттери үчүн), Supabase Edge Functions (Deno).

**Spec:** `docs/superpowers/specs/2026-11-19-joldosh-web-mvp-design.md`

**Кийинки пландар (бул пландын чегинен тышкары):**
- 2-этап: посылка заказы, жарыяланган баалуулук (VALUE_LIMIT), алуудагы сүрөт, жеткирүү коду, GPS изи, карта.
- 3-этап: айдоочуну текшерүү (KYC, кепилдер), оператор панели, бөгөттөө, арыздар.
- 4-этап: чат, пикирлер, билдирүүлөр, PWA жылмалоо, деплой автоматташтыруу.

## Global Constraints

- Телефон форматы ичинде: `996XXXXXXXXX` (12 сан); экранда `+996 XXX XX XX XX`.
- Убакыт алкагы: `Asia/Bishkek` (UTC+6). Сапарлар `timestamptz` катары сакталат; «өткөн сапар» Бишкек убактысы менен эсептелет.
- Тилдер: `ky` (демейки) жана `ru`; ар бир UI тексти `web/src/i18n/strings.js` аркылуу.
- Дизайн: `design-system/joldosh/MASTER.md` токендери; демейки бренд `teal`.
- Төлөм, капчык, лимит — жок (spec §3).
- SMS: Nikita.kg; жөнөтүүчү аты `NIKITA_SENDER` (тестте `SMSPRO.KG`); логин/сырсөз эч качан репозиторийде жок — Supabase secrets гана.
- SMS тексти так: `Жолдош: кирүү кодуңуз {code}. Эч кимге айтпаңыз.`
- Жашыруун ачкычтар (`service_role`, Nikita сырсөзү) фронтендге эч качан тийбейт; фронтенд `anon` ачкычын гана колдонот.
- Акысыз пландар: Supabase Free, Cloudflare Pages.

## Review Focus

1. Телефон ар кандай форматта жазылат (`+996 555 12 34 56`, `0555123456`, `555123456`, `996555123456`) → баары `996555123456` болот; туура эмеси (`12345`, `+7…`) — «Номерди текшериңиз» катасы. → Task 4 тести.
2. Эки жүргүнчү акыркы орунду бир убакта брондойт → бирөө гана ийгиликтүү, орун терс санга түшпөйт. → Task 3 тести.
3. Nikita.kg ката кайтарат (баланс жок, тестовый режимде башка номер) → hook HTTP 500 жана `{"error":{…}}` кайтарат, колдонуучу «SMS жөнөтүлгөн жок, кийинчерээк кайталаңыз» көрөт, «код жөнөтүлдү» деп жазылбайт. → Task 2 жана Task 4 тесттери.
4. Жайгашкан жерге уруксат берилбейт → каттоо бүтөт, профилде `location_granted=false`, «Айдоочу катары посылка алуу үчүн кийин уруксат керек болот» эскертүүсү. → Task 4 тести.
5. Сапар бүгүн, бирок убактысы өтүп кеткен (Бишкек убактысы) → издөөдө жана башкы бетте көрүнбөйт. → Task 3 тести.

---

### Task 1: `web/` негизи — Vite, i18n, токендер, `api` интерфейси жана memory ишке ашыруусу

**Files:**
- Create: `web/package.json`, `web/vite.config.js`, `web/index.html`, `web/public/manifest.webmanifest`
- Create: `web/src/styles/tokens.css` (демонун `:root` токендери + `BRANDS.teal`), `web/src/styles/app.css` (демонун компонент стилдери)
- Create: `web/src/i18n/strings.js` (демонун `L` объекти), `web/src/i18n/index.js`
- Create: `web/src/lib/phone.js`, `web/src/lib/time.js`
- Create: `web/src/api/index.js`, `web/src/api/memory.js`
- Test: `web/tests/i18n.test.js`, `web/tests/phone.test.js`, `web/tests/time.test.js`, `web/tests/api-memory.test.js`

**Interfaces:**
- Produces:
  - `t(key: string, vars?: object): string`, `tp(n: number, key: string): string`, `setLang(lang: 'ky'|'ru'): void`, `getLang(): 'ky'|'ru'` — `web/src/i18n/index.js`
  - `normalizePhone(input: string): string | null` (кайтарат `996XXXXXXXXX` же `null`), `formatPhone(p: string): string` — `web/src/lib/phone.js`
  - `isPastInBishkek(startsAtIso: string, now?: Date): boolean`, `durationText(startIso: string, endIso: string|null, lang): string`, `dayLabel(dateIso: string, lang, now?: Date): string` — `web/src/lib/time.js`
  - `api` объектинин формасы (бардык методдор `Promise` кайтарат):
    `auth.sendCode(phone)`, `auth.verifyCode(phone, code) -> {userId}`, `auth.session() -> {userId}|null`, `auth.signOut()`,
    `profiles.me() -> Profile|null`, `profiles.upsert({name, lang, location_granted}) -> Profile`,
    `cars.mine() -> Car|null`, `cars.save(car) -> Car`,
    `trips.search({from?, to?, date?, type?}) -> Trip[]`, `trips.get(id) -> Trip`, `trips.create(input) -> Trip`, `trips.mine() -> Trip[]`, `trips.cancel(id)`,
    `bookings.book(tripId, seats) -> Booking`, `bookings.cancel(bookingId)`, `bookings.mine() -> Booking[]`
  - `createMemoryApi(seed?) -> api` — `web/src/api/memory.js`; `getApi() -> api` — `web/src/api/index.js` (`import.meta.env.VITE_BACKEND === 'memory'` болсо memory, болбосо supabase).

- [ ] **Step 1: Тесттерди жаз** — `phone.test.js`: Review Focus 1 боюнча төрт туура формат → `'996555123456'`; `'12345'` жана `'+79001234567'` → `null`; `formatPhone('996555123456') === '+996 555 12 34 56'`. `time.test.js`: `isPastInBishkek('2026-11-19T08:00:00+06:00', new Date('2026-11-19T09:00:00+06:00')) === true`, ошол эле күн 10:00 → `false`; `durationText` 09:00→13:30 ky `'4 саат 30 мүн'`, ru `'4 ч 30 мин'`. `i18n.test.js`: `t('login')` ky `'Кирүү'`, ru `'Вход'`; `tp(3,'seat')` ru `'места'`, ky `'орун'`. `api-memory.test.js`: `trips.search({to:'Ош'})` Ошко баргандарды гана кайтарат; `bookings.book` бош орундан ашса `Error('no_seats')`.
- [ ] **Step 2: Иштет — FAIL** — `cd web && npx vitest run` → модулдар табылбайт.
- [ ] **Step 3: Ишке ашыр** — тексттерди жана токендерди демодон (`app/index.html`) көчүр; `normalizePhone`: сандардан башкасын алып сал; `0XXXXXXXXX` → `996` + 9 сан; 9 сан → `996` + сан; натыйжа `/^996\d{9}$/` болбосо `null`. `isPastInBishkek` — `Intl`/UTC offset +6 менен эсепте (китепкана жок).
- [ ] **Step 4: Иштет — PASS** — `cd web && npx vitest run` → бардык тесттер өтөт; `npm run build` → `web/dist/` түзүлөт.
- [ ] **Step 5: Commit** — `git add web && git commit -m "feat(web): scaffold, i18n, phone/time utils, memory api"`

### Task 2: SMS hook — Supabase эдж-функциясы Nikita.kg аркылуу

**Files:**
- Create: `supabase/functions/send-sms/nikita.js` (таза функциялар), `supabase/functions/send-sms/index.ts` (Deno handler)
- Create: `supabase/config.toml` (auth: phone enabled, hook `send_sms` → функция)
- Test: `web/tests/nikita.test.js` (vitest `../supabase/functions/send-sms/nikita.js` импорттойт)

**Interfaces:**
- Produces:
  - `smsText(code: string): string` → Global Constraints'теги так текст.
  - `buildNikitaXml({login, pwd, sender, id, phone, text}): string`
  - `parseNikitaResponse(xml: string): {ok: boolean, status: number, message?: string}` (`status === 0` → ok)
  - Handler: Supabase «Send SMS hook» payload `{user:{phone}, sms:{otp}}`; ийгиликте HTTP 200 `{}`; катада HTTP 500 `{"error":{"http_code":500,"message":"sms_failed"}}`.
- Env (Supabase secrets): `NIKITA_LOGIN`, `NIKITA_PWD`, `NIKITA_SENDER`, `SEND_SMS_HOOK_SECRET`.

- [ ] **Step 1: Тесттерди жаз** — `smsText('4821') === 'Жолдош: кирүү кодуңуз 4821. Эч кимге айтпаңыз.'`; `buildNikitaXml` натыйжасында `<login>`, `<pwd>`, `<sender>SMSPRO.KG</sender>`, `<phone>996555123456</phone>`, `<text>` бар, `&`/`<` экранделген; `parseNikitaResponse('<response><status>0</status></response>').ok === true`; `status` 0'дон башка → `ok:false` (Review Focus 3).
- [ ] **Step 2: Иштет — FAIL** — `cd web && npx vitest run tests/nikita.test.js`.
- [ ] **Step 3: Ишке ашыр** — XML форматын Nikita.kg кабинетиндеги «API-интеграция» документациясы менен салыштырып текшер (endpoint, тег аттары, статус коддору); айырма болсо документацияга ылайыкта жана тестти оңдо. Handler: `standardwebhooks` менен кол тамганы текшер → `buildNikitaXml` → `fetch` POST → `parseNikitaResponse` → 200 же 500.
- [ ] **Step 4: Иштет — PASS** — vitest өтөт. Кол менен: `supabase functions serve send-sms` + тесттик payload → ээсинин профилиндеги номерге SMS келет (тестовый режим).
- [ ] **Step 5: Commit** — `git add supabase web/tests/nikita.test.js && git commit -m "feat(supabase): send-sms hook via Nikita.kg"`

### Task 3: Маалымат базасы — profiles, cars, trips, bookings жана RLS

**Files:**
- Create: `supabase/migrations/20261119000001_core.sql`
- Create: `web/tests/db/harness.js` (PGlite: `auth` схемасынын стабы — `auth.users`, `auth.uid()` = `current_setting('request.jwt.claim.sub', true)::uuid`; ролдор `anon`, `authenticated`; миграцияларды жүктөйт)
- Test: `web/tests/db/core.test.js`

**Interfaces:**
- Produces (SQL):
  - `profiles(id uuid pk → auth.users, name text, phone text, lang text default 'ky', avatar_url text, location_granted bool default false, role text default 'user' check in ('user','operator','admin'), blocked bool default false, created_at timestamptz)`
  - `cars(id, owner uuid, brand, model, year int, color text, wheel text check in ('L','R'), plate text)`
  - `trips(id, driver uuid, from_city, to_city, starts_at timestamptz, ends_at timestamptz null, seats int check >0, price int check >=0, takes_parcels bool, parcel_price int, payment text, comment text, status text default 'active')`
  - `bookings(id, trip uuid, passenger uuid, seats int check >0, status text default 'active', created_at)`
  - `function book_seats(p_trip uuid, p_seats int) returns bookings` — `security definer`, `select … for update` менен бош орунду текшерет; жетпесе `raise exception 'no_seats'`.
  - view `trip_cards` — сапар + айдоочунун аты, рейтинги (азырынча null), машинасы, `seats_left`; айдоочунун телефону жок.
  - `function trip_contact(p_trip uuid) returns text` — айдоочунун телефонун ошол сапарда активдүү брону бар жүргүнчүгө же айдоочунун өзүнө гана кайтарат, калганда null.
  - RLS: `profiles` — ар ким өзүн окуйт/жаңыртат, `role`/`blocked` талааларын колдонуучу өзгөртө албайт (trigger); `trips` — бардыгы окуйт, жаратуу/өзгөртүү `driver = auth.uid()` жана машинасы бар болсо; `bookings` — жүргүнчү жана сапардын айдоочусу окуйт, түз INSERT жок (жалаң `book_seats`).

- [ ] **Step 1: Тесттерди жаз** — `core.test.js`: (а) A колдонуучу B'нин сапарын UPDATE кыла албайт; (б) машинасы жок колдонуучу сапар түзө албайт; (в) 1 бош орун калган сапарга эки `book_seats` чакыруусу ырааттуу: биринчиси өтөт, экинчиси `no_seats` (Review Focus 2); (г) `trip_contact` бөтөн колдонуучуга `null`, брондогондон кийин телефонду кайтарат; (д) колдонуучу өз `role` талаасын `admin` кыла албайт; (е) `trip_cards` Бишкек убактысы менен өткөн сапарды көрсөтпөйт (Review Focus 5 — view `starts_at > now()` чыпкасы).
- [ ] **Step 2: Иштет — FAIL** — `cd web && npx vitest run tests/db` → таблицалар жок.
- [ ] **Step 3: Ишке ашыр** — миграцияны жаз; harness миграцияларды `supabase/migrations/*.sql` аты боюнча иреттеп жүктөйт.
- [ ] **Step 4: Иштет — PASS** — `npx vitest run tests/db` өтөт.
- [ ] **Step 5: Commit** — `git add supabase/migrations web/tests/db && git commit -m "feat(db): core schema, RLS, atomic booking"`

### Task 4: Supabase api жана каттоо агымы (SMS → аты → жайгашкан жерге уруксат)

**Files:**
- Create: `web/src/api/supabase.js` (Task 1'деги `api` формасы, `@supabase/supabase-js` менен; `book` → `rpc('book_seats')`)
- Create: `web/src/screens/auth.js` (телефон → код → аты → уруксат кадамдары), `web/src/lib/geo.js`
- Test: `web/tests/auth-flow.test.js`, `web/tests/geo.test.js`

**Interfaces:**
- Consumes: `api.auth.*`, `api.profiles.*`, `normalizePhone`, `t`.
- Produces: `startAuth(root: HTMLElement, api, onDone: (profile) => void): void`; `requestLocation(): Promise<'granted'|'denied'|'unavailable'>` — `web/src/lib/geo.js`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env.local`, git'ке кирбейт; `.env.example` гана).

- [ ] **Step 1: Тесттерди жаз** — `auth-flow.test.js` (jsdom + memory api): туура эмес номер → `t('checkPhone')` катасы, `sendCode` чакырылбайт; `sendCode` reject болсо → `t('smsFailed')` («SMS жөнөтүлгөн жок, кийинчерээк кайталаңыз»), код кадамына өтпөйт (Review Focus 3); туура код → аты кадамы → уруксат кадамы; `requestLocation` `'denied'` кайтарса → `profiles.upsert` `location_granted:false` менен чакырылат жана `onDone` бәрибир чакырылат, эскертүү `t('locationLater')` көрсөтүлөт (Review Focus 4). `geo.test.js`: `navigator.geolocation` жок → `'unavailable'`.
- [ ] **Step 2: Иштет — FAIL**.
- [ ] **Step 3: Ишке ашыр** — UI демонун кирүү экранын кайталайт (steps бар, KG/RU). Код талаасы 6 сан (Supabase OTP узундугу); `autocomplete="one-time-code"`. Жаңы тексттерди `strings.js`'ке кош: `smsFailed`, `locationAsk`, `locationLater`.
- [ ] **Step 4: Иштет — PASS**; кол менен: `.env.local` менен `npm run dev` → ээсинин номерине чыныгы SMS келип, кирүү иштейт.
- [ ] **Step 5: Commit** — `git add web && git commit -m "feat(web): supabase api and SMS sign-up flow with location permission"`

### Task 5: Попутка экрандары — башкы бет, издөө, сапар, түзүү, менин сапарларым, профиль

**Files:**
- Create: `web/src/main.js` (роутер: `home`, `trip/:id`, `create`, `mytrips`, `profile`, `car`; демонун `go/back/switchTab` логикасы), `web/src/screens/home.js`, `trip.js`, `create-trip.js`, `my-trips.js`, `profile.js`, `car.js`, `web/src/ui/components.js` (tripCard, topbar, tabs, sheet, toast, celebrate)
- Test: `web/tests/e2e/rides.spec.js` (Playwright, `VITE_BACKEND=memory`, `vite preview`)

**Interfaces:**
- Consumes: Task 1 `api` формасы, `t`, `time.js` функциялары, Task 4 `startAuth`.
- Produces: `render()` жана `go(name, params)` — `web/src/main.js`.

- [ ] **Step 1: Тестти жаз** — `rides.spec.js`: (1) кирүү (memory: каалаган код `000000`) → башкы бет; «Ош» чипи → карточкалардын баары `→ Ош`; (2) айдоочу: машина кошуу → сапар түзүү → «Менин сапарларым»да көрүнөт; (3) жүргүнчү: сапарды ачып 1 орун брондойт → айдоочунун телефону эми көрүнөт (брондоодон мурун көрүнбөйт); (4) 390px туурада `document.documentElement.scrollWidth === 390`.
- [ ] **Step 2: Иштет — FAIL** — `cd web && npx playwright test --trace off`.
- [ ] **Step 3: Ишке ашыр** — демонун экрандарын модулдарга көчүр, `S` глобалдык абалынын ордуна `api` чакыруулары; посылка/чат/капчык бөлүмдөрү бул этапта жашырылат.
- [ ] **Step 4: Иштет — PASS** — `npx playwright test --trace off` жана `npx vitest run` экөө тең өтөт.
- [ ] **Step 5: Commit** — `git add web && git commit -m "feat(web): rides screens on api layer"`

### Task 6: Деплой — Cloudflare Pages жана Supabase жөндөөлөрү

**Files:**
- Create: `web/.env.example`, `docs/deploy.md` (кадамдар: Supabase долбоору, миграцияларды колдонуу `supabase db push`, функцияны жайгаштыруу `supabase functions deploy send-sms`, secrets коюу, Auth → Hooks → Send SMS hook, Cloudflare Pages: build `npm run build`, root `web`, output `dist`, env vars)
- Modify: `README.md` (жаңы `web/` бөлүмү)

**Interfaces:**
- Consumes: бардык мурунку тапшырмалар.

- [ ] **Step 1: Текшерүү скриптин жаз** — `web/package.json`'ге `"check": "vitest run && vite build"`.
- [ ] **Step 2: Иштет** — `cd web && npm run check` → тесттер өтөт, `dist/` бар, `dist` ичинде `service_role` же `NIKITA` деген сап жок (`grep -r "service_role\|NIKITA" dist` бош).
- [ ] **Step 3: Ээси менен деплой** — ээси Supabase жана Cloudflare аккаунттарын ачат; ачкычтар коопсуз форма аркылуу; `docs/deploy.md` боюнча жайгаштыруу; `*.pages.dev` дарегинде ээсинин номери менен SMS-кирүү иштейт.
- [ ] **Step 4: Commit** — `git add web/.env.example docs/deploy.md README.md web/package.json && git commit -m "docs: deploy guide for Supabase and Cloudflare Pages"`
