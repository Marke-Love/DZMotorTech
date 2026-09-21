#!/usr/bin/env python3
"""Проставить версию у ссылки на additive.css во всех страницах.

Платформа подключает свой css.css с версией, а additive.css — без неё, поэтому
правки в нём не доходят до посетителей с закешированной копией. Скрипт
дописывает ?v=<время изменения файла>; запускать после каждой правки стилей.

    python3 tools/stamp_additive.py --dry-run
    python3 tools/stamp_additive.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
CSS_REL = os.path.join("asssets.51microshop.com", "assets", "css", "additive.css")
SKIP_DIRS = {".git", "node_modules", "admin", "tools", "leads_uploads"}

LINK = re.compile(r'(assets/css/additive\.css)(\?v=\d+)?')


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    stamp = int(os.path.getmtime(os.path.join(ROOT, CSS_REL)))
    changed = 0

    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            with open(path, encoding="utf-8", errors="ignore") as fh:
                page = fh.read()
            if "assets/css/additive.css" not in page:
                continue

            updated = LINK.sub(lambda m: f"{m.group(1)}?v={stamp}", page)
            if updated == page:
                continue
            changed += 1
            if not dry_run:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(updated)

    verb = "будет обновлено" if dry_run else "обновлено"
    print(f"{verb} страниц: {changed} (версия {stamp})")


if __name__ == "__main__":
    main()
