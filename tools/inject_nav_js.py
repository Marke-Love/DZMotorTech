#!/usr/bin/env python3
"""Подключить assets/js/nav.js на всех страницах с шапкой.

Скрипт добавляет один тег перед </body> и обновляет у него версию по времени
изменения файла — иначе браузеры с закешированной страницей возьмут старую
версию. Повторные запуски только освежают версию.

    python3 tools/inject_nav_js.py --dry-run
    python3 tools/inject_nav_js.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
SCRIPT_REL = os.path.join("assets", "js", "nav.js")
SKIP_DIRS = {".git", "node_modules", "admin", "tools", "leads_uploads"}

TAG = re.compile(r'\s*<script src="/assets/js/nav\.js(?:\?v=\d+)?" defer></script>')


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    stamp = int(os.path.getmtime(os.path.join(ROOT, SCRIPT_REL)))
    tag = f'<script src="/assets/js/nav.js?v={stamp}" defer></script>'
    added = refreshed = 0

    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            with open(path, encoding="utf-8", errors="ignore") as fh:
                page = fh.read()

            # Только страницы с меню шапки и закрывающим </body>.
            if 'class="nav_bar"' not in page or "</body>" not in page:
                continue

            if TAG.search(page):
                updated = TAG.sub("\n" + tag, page, count=1)
                if updated != page:
                    refreshed += 1
            else:
                updated = page.replace("</body>", tag + "\n</body>", 1)
                added += 1

            if updated != page and not dry_run:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(updated)

    verb = "будет" if dry_run else "готово:"
    print(f"{verb} подключено на {added} страницах, версия обновлена на {refreshed}")


if __name__ == "__main__":
    main()
