#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает sitemap.xml по файлам сайта.

Запуск из корня репозитория:  python3 tools/build_sitemap.py

В карту попадают страницы, которые ссылаются canonical сами на себя.
Страницы пагинации (их canonical ведёт на первую страницу списка), метки,
служебные папки и файл подтверждения Яндекса пропускаются.
"""
import datetime
import pathlib
import re
import sys
from urllib.parse import quote, unquote

ROOT = pathlib.Path(__file__).resolve().parent.parent / 'dzmotortech.ru'
SITE = 'https://dzmotortech.ru'
SKIP_DIRS = {'admin', 'api', 'inc', 'leads_uploads', 'assets', 'media', 'common', 'tags', 'feed'}
CANON = re.compile(r'<link rel="canonical" href="https://dzmotortech\.ru(/[^"]*)"')


def page_url(rel: str) -> str:
    """news/index.html -> /news/ ;  catalog/all.html -> /catalog/all.html"""
    if rel == 'index.html':
        return '/'
    if rel.endswith('/index.html'):
        return '/' + rel[: -len('index.html')]
    return '/' + rel


def main() -> int:
    urls = []
    skipped = {'пагинация': 0, 'без canonical': 0}
    for path in sorted(ROOT.rglob('*.html')):
        rel = str(path.relative_to(ROOT))
        parts = rel.split('/')
        if parts[0] in SKIP_DIRS or (parts[0] == 'en' and len(parts) > 1 and parts[1] in SKIP_DIRS):
            continue
        if path.name.startswith('yandex_'):
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        own = page_url(rel)
        m = CANON.search(text)
        if not m:
            skipped['без canonical'] += 1
            continue
        if unquote(m.group(1)) != own:      # страницы пагинации ведут на первую
            skipped['пагинация'] += 1
            continue
        lastmod = datetime.date.fromtimestamp(path.stat().st_mtime).isoformat()
        urls.append((own, lastmod))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, lastmod in sorted(urls):
        lines.append('  <url>')
        lines.append('    <loc>' + SITE + quote(loc, safe='/-_.~') + '</loc>')
        lines.append('    <lastmod>' + lastmod + '</lastmod>')
        lines.append('  </url>')
    lines.append('</urlset>')

    out = ROOT / 'sitemap.xml'
    out.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'страниц в карте: {len(urls)}, файл: {out} ({out.stat().st_size // 1024} КБ)')
    print('пропущено:', skipped)
    return 0


if __name__ == '__main__':
    sys.exit(main())
