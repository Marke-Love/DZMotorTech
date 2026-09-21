#!/usr/bin/env python3
"""Переключить пункт меню «Продукция» / «Product» со старой сетки товаров
на новую страницу каталога во всех статических страницах сайта.

Меняется только href внутри ссылок навигации (десктопной и мобильной);
относительный префикс пути сохраняется, поэтому страницы во вложенных
папках продолжают ссылаться корректно. Сам all-products.html остаётся
доступным — на него ведёт кнопка «Все товары списком» в каталоге.

    python3 tools/relink_nav.py --dry-run   # показать, что изменится
    python3 tools/relink_nav.py             # применить
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
SKIP_DIRS = {".git", "node_modules", "admin", "leads_uploads", "tools"}

NAV_LINK = re.compile(
    r'(<a class="(?:navigation|phone_navigation)" href="((?:\.\./)*))all-products\.html'
    r'(" data-nav="(?:Продукция|Product)")'
)


def walk_html():
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if name.endswith(".html"):
                yield os.path.join(base, name)


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    changed = 0
    replacements = 0

    for path in walk_html():
        with open(path, encoding="utf-8", errors="ignore") as fh:
            page = fh.read()

        updated, hits = NAV_LINK.subn(r"\1catalog.html\3", page)
        if not hits:
            continue

        changed += 1
        replacements += hits
        if not dry_run:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(updated)

    verb = "будет изменено" if dry_run else "изменено"
    print(f"{verb} файлов: {changed}, ссылок: {replacements}")


if __name__ == "__main__":
    main()
