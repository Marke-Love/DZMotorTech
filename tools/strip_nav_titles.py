#!/usr/bin/env python3
"""Убрать всплывающие подсказки у пунктов меню.

Браузер показывает серый тултип из атрибута title, а он у ссылок меню просто
дублирует их же текст. Атрибут переименовывается в data-nav: подсказка
пропадает, а признак остаётся — на него опираются стили кнопки «Продукция»,
скрытие «Новостей» и скрипт навигации.

    python3 tools/strip_nav_titles.py --dry-run
    python3 tools/strip_nav_titles.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
SKIP_DIRS = {".git", "node_modules", "admin", "tools", "leads_uploads"}

# Только ссылки меню: десктопная строка и мобильный список.
NAV_LINK = re.compile(r'(<a class="(?:navigation|phone_navigation)"[^>]*?)\stitle="([^"]*)"')


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    changed = replaced = 0

    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            with open(path, encoding="utf-8", errors="ignore") as fh:
                page = fh.read()

            updated, hits = NAV_LINK.subn(r'\1 data-nav="\2"', page)
            if not hits:
                continue

            changed += 1
            replaced += hits
            if not dry_run:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(updated)

    verb = "будет изменено" if dry_run else "изменено"
    print(f"{verb} страниц: {changed}, подсказок убрано: {replaced}")


if __name__ == "__main__":
    main()
