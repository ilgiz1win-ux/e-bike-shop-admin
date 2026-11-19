# Жолдош — Design System (MASTER)

Global source of truth for every screen of the app (`app/index.html`).
Page-specific overrides go to `design-system/joldosh/pages/<page>.md`.

Sources: UI UX Pro Max skill (product row **Logistics/Delivery**: Minimalism & Swiss + Flat,
status colours blue/orange/green; typography row **Geometric Modern**) combined with the owner's
brand decision (green, reference screenshots). Generic landing-page output of the generator was
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
| Token | Value | Use |
|---|---|---|
| `--bg` | `#f1f4f2` | page background (never pure white) |
| `--surface` | `#ffffff` | cards, sheets, bars |
| `--field` | `#ebf0ed` | inputs, neutral chips |
| `--fg` | `#16201b` | text |
| `--muted` | `#5f6b65` | secondary text (4.5:1 on bg) |
| `--line` | `#e1e7e3` | dividers |
| `--accent` | `#2bc66f` | brand fill (buttons, highlights) — **text on it is `--on-accent`** |
| `--on-accent` | `#06281a` | text/icons on brand fill (≈9:1) |
| `--accent-ink` | `#15803d` | green text/icons on white (≈5:1) |
| `--accent-soft` | `#e3f5ea` | tonal containers, active nav indicator |
| `--ink` → `--ink2` | `#146c3c → #0d4a2a` | hero gradient, white text on it |
| `--danger` | `#eb5757` | destructive |

### Status colours (parcel / trip lifecycle)
| Status | Token | Value | Meaning |
|---|---|---|---|
| open | `--st-open` | muted grey | waiting for a driver |
| accepted | `--st-accepted` | `#2563eb` | driver took it (tracking blue) |
| onway | `--st-onway` | `#ea580c` | in transit (tracking orange) |
| delivered | `--st-delivered` | `--accent-ink` | done |
| cancelled | `--danger` | | cancelled |

Never rely on colour alone: every status also has a text label.

Dark mode mirrors every token (see `:root` dark blocks in the app); brand fill stays green, text on it stays dark.

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
- [ ] Text contrast ≥ 4.5:1 (light and dark); no white text on `--accent`
- [ ] No emoji as structural icons (SVG only)
- [ ] Focus visible, aria-labels on icon buttons
- [ ] Touch targets ≥ 44px, 8px+ spacing
- [ ] No horizontal scroll at 375–390px
- [ ] Reduced motion respected
- [ ] Status shown by colour **and** label
