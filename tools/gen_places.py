# Builds web/src/ui/places.js from the Wikidata-derived geomelon dataset (CC0).
import json, sys, math, re
src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding='utf-8'))
reg = {r['id']: (r.get('translations') or {}).get('ky') or r['name'] for r in d['regions']}
reg_ru = {r['id']: (r.get('translations') or {}).get('ru') or r['name'] for r in d['regions']}
CITY = {'city', 'big city', 'border city', 'city or town'}
SKIP = {'territory', 'administrative territorial entity'}
# District -> oblast (Kyrgyz names). Wikidata's region links are unreliable; the district in the label is not.
DISTRICTS = {
  'Чүй облусу': ['Аламүдүн', 'Сокулук', 'Москва', 'Жайыл', 'Панфилов', 'Ысык-Ата', 'Чүй', 'Кемин'],
  'Ысык-Көл облусу': ['Ысык-Көл', 'Түп', 'Ак-Суу', 'Жети-Өгүз', 'Тоң'],
  'Нарын облусу': ['Нарын', 'Ат-Башы', 'Ак-Талаа', 'Кочкор', 'Жумгал'],
  'Талас облусу': ['Талас', 'Бакай-Ата', 'Кара-Буура', 'Манас'],
  'Жалал-Абад облусу': ['Сузак', 'Базар-Коргон', 'Ноокен', 'Аксы', 'Ала-Бука', 'Чаткал', 'Тогуз-Торо', 'Токтогул'],
  'Ош облусу': ['Алай', 'Араван', 'Кара-Кулжа', 'Кара-Суу', 'Ноокат', 'Өзгөн', 'Чоң-Алай'],
  'Баткен облусу': ['Баткен', 'Лейлек', 'Кадамжай'],
}
DIST2OBL = {dname: obl for obl, ds in DISTRICTS.items() for dname in ds}
SUFFIX = re.compile(r'\s+(айылы|шаары|шаарчасы|кыштагы|поселкасы|айыл|шаар)$')
def clean(n):
    n = re.sub(r'\s*\(.*?\)\s*', ' ', n).strip()
    dist = None
    m = re.match(r'^(.*?),\s*(.+?)\s+району$', n)
    if m: n, dist = m.group(1).strip(), m.group(2).strip()
    n = SUFFIX.sub('', n).strip()
    n = re.sub(r'\s*-\s*', '-', n)
    if n == n.upper():  # "АК-ЖАР" -> "Ак-Жар"
        n = '-'.join(w[:1] + w[1:].lower() for w in n.split('-'))
    return n, dist
obl_id = {v: k for k, v in reg.items()}
rows = []
for x in d['cities']:
    types = set(x.get('settlementTypes') or [])
    city = bool(types & CITY)
    if (types & SKIP or 'first-level administrative division' in types) and not city: continue
    tr = x.get('translations') or {}
    raw = (tr.get('ky') or tr.get('ru') or '').strip()
    if not re.search('[А-Яа-яӨөҮүҢң]', raw): continue
    name, dist = clean(raw)
    ru = clean((tr.get('ru') or '').strip())[0]
    region = obl_id.get(DIST2OBL.get(dist)) if dist else None
    rows.append(dict(name=name, ru=ru, region=region, src_region=x.get('regionId'), lat=x.get('latitude'), lon=x.get('longitude'), city=city, pop=x.get('population') or 0, sure=bool(region)))
known = [r for r in rows if r['sure'] and r['lat'] is not None]
for r in rows:
    if not r['region'] and r['lat'] is not None and known:
        r['region'] = min(known, key=lambda k: (k['lat'] - r['lat']) ** 2 + ((k['lon'] - r['lon']) * math.cos(math.radians(r['lat']))) ** 2)['region']
rows = [r for r in rows if r['region']]
ORDER = 'абвгдеёжзийклмнңоөпрстуүфхцчшщъыьэюя'
key = lambda s: [ORDER.find(ch) if ch in ORDER else 100 + ord(ch) for ch in s.lower()]
# one entry per (name, region); names repeated across regions get the region in brackets
seen = {}
for r in rows: seen.setdefault((r['name'], r['region']), r)
uniq = list(seen.values())
count = {}
for r in uniq: count[r['name']] = count.get(r['name'], 0) + 1
short = lambda rid: reg[rid].replace(' облусу', '')
for r in uniq:
    r['label'] = r['name'] if count[r['name']] == 1 else f"{r['name']} ({short(r['region'])})"
# Places from the earlier hand-made list that the dataset lacks (towns and villages by region).
CURATED = json.load(open(sys.argv[3], encoding='utf-8'))
have = {r['name'] for r in uniq}
for obl, items in CURATED.items():
    for n in items:
        if n in have: continue
        rid = obl_id.get(obl)
        uniq.append(dict(name=n, ru='', region=rid, city=(obl == 'Шаарлар'), label=n))
        have.add(n)
cities = sorted({r['label'] for r in uniq if r['city']}, key=key)
groups = []
REG_ORDER = ['Чүй облусу', 'Ысык-Көл облусу', 'Нарын облусу', 'Талас облусу', 'Жалал-Абад облусу', 'Ош облусу', 'Баткен облусу']
rid_by_name = {v: k for k, v in reg.items()}
for rn in REG_ORDER:
    rid = rid_by_name.get(rn)
    if not rid: continue
    items = sorted({r['label'] for r in uniq if r['region'] == rid and not r['city']}, key=key)
    groups.append((rn, reg_ru[rid], items))
BISHKEK = ['Бишкек, Ош базары', 'Бишкек, Дордой базары', 'Бишкек, Аламүдүн базары', 'Бишкек, Ортосай базары',
  'Бишкек, Батыш автобекети', 'Бишкек, Чыгыш автобекети', 'Бишкек, Ала-Тоо аянты', 'Бишкек, Жал',
  'Бишкек, Асанбай', 'Бишкек, Восток-5', 'Бишкек, Аламедин-1', 'Бишкек, Кок-Жар', 'Бишкек, Тунгуч',
  'Бишкек, Ак-Өргө', 'Бишкек, Арча-Бешик', 'Бишкек, Калыс-Ордо', 'Бишкек, Учкун', 'Бишкек, Кара-Жыгач', 'Манас аэропорту']
if 'Бишкек' in cities: cities.remove('Бишкек')
cities = ['Бишкек'] + cities
js = ['// Places for the picker. Towns and villages: Wikidata via the @geomelon/kyrgyzstan dataset (CC0-1.0),',
      '// Kyrgyz names, grouped by region; names repeated in several regions carry the region in brackets.',
      '// Bishkek points are "Бишкек, <place>" so a search for "Бишкек" also finds trips between them (see inPlace).',
      'export const PLACES = [',
      f"  {{ key: 'bishkek', ky: 'Бишкектин ичинде', ru: 'Внутри Бишкека', items: {json.dumps(BISHKEK, ensure_ascii=False)} }},",
      f"  {{ key: 'cities', ky: 'Шаарлар', ru: 'Города', items: {json.dumps(cities, ensure_ascii=False)} }},"]
for i, (ky, ru, items) in enumerate(groups):
    js.append(f"  {{ key: 'r{i}', ky: {json.dumps(ky, ensure_ascii=False)}, ru: {json.dumps(ru, ensure_ascii=False)}, items: {json.dumps(items, ensure_ascii=False)} }},")
aliases = {r['label']: r['ru'] for r in uniq if r['ru'] and r['ru'] != r['name']}
js += ['];', '', '// Russian names, so a search in Russian finds the place too.', f"export const RU_NAMES = {json.dumps(aliases, ensure_ascii=False)};", '', 'export const ALL_PLACES = PLACES.flatMap((g) => g.items);', '',
       '// A trip place matches a filter if it is the same place or a point inside it ("Бишкек, Жал" is in "Бишкек").',
       "export const inPlace = (value, filter) => !filter || value === filter || String(value).startsWith(filter + ', ');", '',
       '// Search by Kyrgyz or Russian name; names that start with the query come first.',
       'export function searchPlaces(query, limit = 80) {',
       '  const v = String(query).trim().toLowerCase();',
       '  if (!v) return [];',
       '  const hits = [];',
       '  for (const group of PLACES) for (const label of group.items) {',
       '    const names = [label.toLowerCase(), (RU_NAMES[label] || "").toLowerCase()];',
       '    if (names.some((n) => n.includes(v))) hits.push({ label, group, starts: names.some((n) => n.startsWith(v)) });',
       '  }',
       '  return hits.sort((a, b) => Number(b.starts) - Number(a.starts)).slice(0, limit);',
       '}', '']
open(out, 'w', encoding='utf-8').write('\n'.join(js))
print('cities', len(cities), 'groups', [(g[0], len(g[2])) for g in groups], 'total', sum(len(g[2]) for g in groups) + len(cities) + len(BISHKEK))
