#!/usr/bin/env python3
"""Builds the published demo pages from their sources.

app/index.src.html + app/admin.src.html are templates; app/app.css and app/app.js are the code.
The artifact host only runs inline code, so each page gets the CSS and JS written into it:
    python3 tools/build_demo.py   ->  app/index.html, app/admin.html
"""
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / 'app'
css = (APP / 'app.css').read_text(encoding='utf-8')
js = (APP / 'app.js').read_text(encoding='utf-8')
for name in ('index', 'admin'):
    src = (APP / f'{name}.src.html').read_text(encoding='utf-8')
    assert '<!--APP_CSS-->' in src and '<!--APP_JS-->' in src, name
    out = src.replace('<!--APP_CSS-->', f'<style>\n{css}</style>').replace('<!--APP_JS-->', f'<script>\n{js}</script>')
    (APP / f'{name}.html').write_text(out, encoding='utf-8')
    print(f'{name}.html', len(out))
