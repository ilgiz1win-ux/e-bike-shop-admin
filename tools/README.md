# tools

## gen_places.py — список сёл и городов Кыргызстана

Генерирует `web/src/ui/places.js` (и тот же блок вставляется в демо `app/index.html`).

Источник: Wikidata через npm-пакет `@geomelon/kyrgyzstan` (лицензия CC0-1.0).
Кыргызские названия очищаются от приписок («айылы», «шаары», «…району»),
область определяется по району из названия; места, которых нет в наборе,
добавляются из `places_curated.json`.

```bash
mkdir -p /tmp/geo && cd /tmp/geo && npm pack @geomelon/kyrgyzstan && tar xzf *.tgz
python3 -I tools/gen_places.py /tmp/geo/package/data.json web/src/ui/places.js tools/places_curated.json
```

Базары: пока вручную (Бишкек). Полный список — из OpenStreetMap (`amenity=marketplace`),
когда сервер Overpass доступен.
