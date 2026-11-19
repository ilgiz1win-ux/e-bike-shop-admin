# Жолдош — Design System (MASTER)

Global source of truth for every screen of the app (`app/index.html`).
Page-specific overrides go to `design-system/joldosh/pages/<page>.md`.

Sources: UI UX Pro Max skill (product row **Logistics/Delivery**: Minimalism & Swiss + Flat,
status colours blue/orange/green; typography row **Geometric Modern**) combined with the owner's
brand decision (blue; layout from the reference screenshots). Generic landing-page output of the generator was
rejected as off-topic and is not used here.

## 1. Product
- Mobile-first web app: carpooling + parcel delivery in Kyrgyzstan, KG/RU.
- Audience: passengers, senders, drivers; used outdoors, on the go, one hand.
- Tone: friendly, trustworthy, fast. Content first, no decoration for its own sake.

## 2. Style
- **Minimal + Flat, MD3-like tonal surfaces.** No borders on cards; ambient shadow only.
- Pill-shaped buttons, chips and segmented controls (`border-radius: 999px`).
- Cards `22px` radius, hero panels `26–30px`, fields `16px`.
- One deep-green hero per screen at most (home header, profile, wallet, support).

## 3. Colour tokens (light)
Brand changed to **trust blue** by the owner — it matches the skill's Logistics/Delivery primary `#2563EB`.
Green is now semantic only (delivered, verified).

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f2f5fa` | page background (never pure white) |
| `--surface` | `#ffffff` | cards, sheets, bars |
| `--field` | `#eaeff7` | inputs, neutral chips |
| `--fg` | `#0f1a2e` | text |
| `--muted` | `#5b6678` | secondary text (≥4.5:1 on bg) |
| `--line` | `#e0e6f0` | dividers |
| `--accent` | `#2563eb` | brand fill; white text on it ≈5.2:1 |
| `--on-accent` | `#ffffff` | text/icons on brand fill |
| `--accent-ink` | `#1d4ed8` | blue text/icons on white (≈6.7:1) |
| `--accent-soft` | `#e7efff` | tonal containers, active nav indicator |
| `--ink` → `--ink2` | `#1e40af → #172f7a` | hero gradient, white text on it |
| `--ok` | `#16a34a` | delivered, verified (semantic green) |
| `--danger` | `#e5484d` | destructive |

### Status colours (parcel / trip lifecycle)
| Status | Token | Value | Meaning |
|---|---|---|---|
| open | `--st-open` | `#5b6678` | waiting for a driver |
| accepted | `--st-accepted` | `#7c3aed` | driver took it (violet — kept apart from brand blue) |
| onway | `--st-onway` | `#ea580c` | in transit (tracking orange) |
| delivered | `--ok` | `#16a34a` | done |
| cancelled | `--danger` | | cancelled |

Never rely on colour alone: every status also has a text label.

Dark mode mirrors every token (brand `#4f8cff` with dark text `#06122b`).

## 4. Typography
- **Montserrat** (geometric sans, same family of mood as the recommended Outfit; full Cyrillic incl. ө ү ң), fallback Inter, system-ui.
- Scale: hero greeting 26/700 · page title 17/700 · section title 17/700 sentence case · card title 15/700 · body 15/500 · meta 12–13/500.
- No uppercase grey section labels. Numbers that align use `tabular-nums`.

## 5. Layout & spacing
- Single column, max width 480px, side gutter `max(16px, safe-area)`.
- Vertical rhythm 16px between blocks, 10px inside groups.
- Floating bottom bar (5 items max), translucent top bar with blur.
- Touch targets ≥ 44×44px.

## 6. Components
- **Trip card:** vertical timeline left (time 22/700, city muted), driver + car right, seats + price pill bottom, date · duration line.
- **Order card:** photo/box thumb 88px, title, route, status pill.
- **Quick actions:** 2-up tiles, first tile brand-filled.
- **Status pill / step bar:** coloured by status token.
- **Lists:** 36px tonal icon square + label + chevron.
- **Chat:** own bubbles brand fill, peer bubbles surface; quick replies as chips.

## 7. Motion
- Standard tier: 150–350ms, emphasized easing `cubic-bezier(.2,0,0,1)`.
- Screen push: slide 28px; tab switch: rise + stagger 40ms; press: scale .97.
- Success: check-mark draw. Respect `prefers-reduced-motion` (all motion off).

## 8. Pre-delivery checklist
- [ ] Text contrast ≥ 4.5:1 (light and dark)
- [ ] No emoji as structural icons (SVG only)
- [ ] Focus visible, aria-labels on icon buttons
- [ ] Touch targets ≥ 44px, 8px+ spacing
- [ ] No horizontal scroll at 375–390px
- [ ] Reduced motion respected
- [ ] Status shown by colour **and** label

## 9. Brand colour themes (switchable)
Profile → «Колдонмонун түсү» switches the brand set at runtime (`BRANDS` in `app/index.html`; JS sets the brand tokens on `:root`, light/dark aware).
Default: **teal / бирюза** (`#14b8a6` fill with dark text `#042f2e`, ink `#0f766e → #134e4a`).
Alternatives: orange `#f97316`, violet `#7c3aed`, green `#2bc66f`, blue `#2563eb` (the §3 table above).
When a brand collides with a status colour the status moves: orange brand → in-transit becomes cyan; violet/green brand → accepted becomes blue.
