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
# the TAYAN mark goes in as data URIs so every page (and the separate admin artifact) carries it
import base64
for key, f in (('__TAYAN_LOGO_512__', 'tayan-512.webp'), ('__TAYAN_LOGO_160__', 'tayan-160.webp')):
    js = js.replace(key, 'data:image/webp;base64,' + base64.b64encode((APP / 'media' / f).read_bytes()).decode())
for name in ('index', 'admin'):
    src = (APP / f'{name}.src.html').read_text(encoding='utf-8')
    assert '<!--APP_CSS-->' in src and '<!--APP_JS-->' in src, name
    out = src.replace('<!--APP_CSS-->', f'<style>\n{css}</style>').replace('<!--APP_JS-->', f'<script>\n{js}</script>')
    (APP / f'{name}.html').write_text(out, encoding='utf-8')
    print(f'{name}.html', len(out))

# The operator panel as its own artifact: the host wraps the page in its own <html>/<head>/<body>,
# so the outer tags go; the link back opens the app artifact.
import re
adm = (APP / 'admin.html').read_text(encoding='utf-8')
head = adm[adm.index('<title>'):adm.index('</head>')]
body = adm[adm.index('<body class="admin">') + len('<body class="admin">'):adm.index('</body>')]
head = head.replace('<script>window.JOLDOSH_ADMIN = true;</script>',
                    '<script>window.JOLDOSH_ADMIN = true; window.JOLDOSH_APP_URL = "https://claude.ai/artifact/2TtPMLGtp8aw42gsEMJbGe";</script>')
out_dir = APP.parent / 'admin'; out_dir.mkdir(exist_ok=True)
(out_dir / 'index.html').write_text(head + body, encoding='utf-8')
print('admin/index.html', len(head + body))
