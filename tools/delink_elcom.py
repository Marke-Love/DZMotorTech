#!/usr/bin/env python3
"""Убрать с карточек товара обращения к www.elcomspb.ru.

Карточки построены на чужом шаблоне и грузили оттуда CSS, иконки, счётчик
и запрос корзины. Стили и графика теперь лежат локально
(assets/vendor/product-card), счётчик и запрос корзины удаляются: первый
писал визиты в чужую статистику, второй вёл в чужой движок и не работал.

    python3 tools/delink_elcom.py --dry-run
    python3 tools/delink_elcom.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
LOCAL = "/assets/vendor/product-card"

CSS_BUNDLE = ("https://www.elcomspb.ru/bitrix/cache/css/arturgolubev.cssinliner/"
              "v551_s1/css_united/d802d537f501524e356c55d487963fbf.css")

SVG_DIR = "https://www.elcomspb.ru/local/templates/main_redesign/assets/svg/"
SPRITE = "https://www.elcomspb.ru/local/templates/main_redesign/images/required/icons/icons.svg"

COUNTER = re.compile(r'[ \t]*<noscript><img src="https://www\.elcomspb\.ru//counter\.rambler\.ru[^>]*></noscript>\n?')
CARD_CSS = re.compile(r'(/assets/vendor/product-card/product-card\.css)(\?v=\d+)?')

CART_FETCH = re.compile(r'\s*data-dialog-fetch="https://elcomspb\.ru/include/added-products-in-cart\.php"')


def css_version() -> str:
    """Версия по времени изменения product-card.css: после пересборки стилей
    браузеры не отдают закешированный старый файл."""
    path = os.path.join(ROOT, "assets", "vendor", "product-card", "product-card.css")
    return f"?v={int(os.path.getmtime(path))}" if os.path.exists(path) else ""


def rewrite(page: str) -> str:
    page = page.replace(CSS_BUNDLE, f"{LOCAL}/product-card.css")
    page = page.replace(SPRITE, f"{LOCAL}/svg/icons.svg")
    page = page.replace(SVG_DIR, f"{LOCAL}/svg/")
    page = COUNTER.sub("", page)
    page = CART_FETCH.sub("", page)
    page = CARD_CSS.sub(lambda m: m.group(1) + css_version(), page)
    return page


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    changed = 0
    leftovers: list[str] = []

    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html"):
            continue
        path = os.path.join(ROOT, name)
        with open(path, encoding="utf-8", errors="ignore") as fh:
            page = fh.read()
        if "elcomspb" not in page and "product-card.css" not in page:
            continue

        updated = rewrite(page)
        if updated == page:
            continue
        if "elcomspb" in updated:
            leftovers.append(name)
        changed += 1
        if not dry_run:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(updated)

    verb = "будет изменено" if dry_run else "изменено"
    print(f"{verb} карточек: {changed}")
    if leftovers:
        print("остались ссылки на elcomspb в:", ", ".join(leftovers[:5]))


if __name__ == "__main__":
    main()
