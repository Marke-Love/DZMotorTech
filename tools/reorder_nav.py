#!/usr/bin/env python3
"""Поставить пункт «Продукция» первым в меню шапки.

Через CSS (order) сделать это не выходит: в списке между пунктами есть
переносы строк, и при перестановке один из них получает свою долю
распределяемого пространства — зазор перед соседним пунктом удваивается.
Поэтому переносим сам <li> в начало списка; порядок в разметке даёт ровные
отступы на всех страницах.

    python3 tools/reorder_nav.py --dry-run
    python3 tools/reorder_nav.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
SKIP_DIRS = {".git", "node_modules", "admin", "tools", "leads_uploads"}

UL_OPEN = re.compile(r'<ul class="nav_first[^"]*"[^>]*>')
TITLES = ('data-nav="Продукция"', 'data-nav="Product"')


def block_end(html: str, start: int, tag: str) -> int:
    """Найти закрывающий тег с учётом вложенности. Возвращает индекс за ним."""
    depth = 0
    pos = start
    opener = re.compile(rf"<{tag}\b", re.I)
    closer = re.compile(rf"</{tag}>", re.I)
    while pos < len(html):
        nxt_open = opener.search(html, pos)
        nxt_close = closer.search(html, pos)
        if not nxt_close:
            return -1
        if nxt_open and nxt_open.start() < nxt_close.start():
            depth += 1
            pos = nxt_open.end()
            continue
        depth -= 1
        pos = nxt_close.end()
        if depth == 0:
            return pos
    return -1


def top_level_items(html: str, ul_start: int, ul_end: int) -> list[tuple[int, int]]:
    items = []
    pos = ul_start
    while True:
        match = re.compile(r"<li\b", re.I).search(html, pos)
        if not match or match.start() >= ul_end:
            break
        end = block_end(html, match.start(), "li")
        if end < 0 or end > ul_end:
            break
        items.append((match.start(), end))
        pos = end
    return items


def reorder(page: str) -> tuple[str, bool]:
    open_match = UL_OPEN.search(page)
    if not open_match:
        return page, False

    ul_end = block_end(page, open_match.start(), "ul")
    if ul_end < 0:
        return page, False

    items = top_level_items(page, open_match.end(), ul_end)
    if not items:
        return page, False

    target = None
    for start, end in items:
        chunk = page[start:end]
        first_link = re.search(r'<a class="navigation"[^>]*>', chunk)
        if first_link and any(t in first_link.group(0) for t in TITLES):
            target = (start, end)
            break

    if not target or target[0] == items[0][0]:
        return page, False  # уже первый или не найден

    start, end = target
    block = page[start:end]
    page = page[:start] + page[end:]
    insert_at = open_match.end()
    return page[:insert_at] + "\n" + block.strip() + "\n" + page[insert_at:], True


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    changed = 0

    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(base, name)
            with open(path, encoding="utf-8", errors="ignore") as fh:
                page = fh.read()
            if not any(t in page for t in TITLES):
                continue

            updated, moved = reorder(page)
            if not moved:
                continue
            changed += 1
            if not dry_run:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(updated)

    verb = "будет изменено" if dry_run else "изменено"
    print(f"{verb} страниц: {changed}")


if __name__ == "__main__":
    main()
