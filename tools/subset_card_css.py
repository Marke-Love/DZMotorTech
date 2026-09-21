#!/usr/bin/env python3
"""Собрать локальный product-card.css из полного бандла elcomspb.

Карточки товара построены на чужом шаблоне и грузили его CSS напрямую с
www.elcomspb.ru. Скрипт оставляет из бандла только те правила, чьи классы и
идентификаторы реально встречаются в HTML карточек, — обычно это единицы
процентов от исходного файла. Порядок правил сохраняется, поэтому каскад и
специфичность не меняются.

    python3 tools/subset_card_css.py
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
VENDOR = os.path.join(ROOT, "assets", "vendor", "product-card")
# Полный бандл-исходник держим вне веб-корня: наружу он не раздаётся,
# но остаётся под рукой для пересборки.
SOURCE = os.path.join(ROOT, "tools", "vendor-src", "elcom-full.css")
TARGET = os.path.join(VENDOR, "product-card.css")

# Правила, которые оставляем всегда: базовая типографика, переменные, шрифты,
# анимации — они дешёвые и от них зависят остальные.
# Имя at-правила: «@media(max-width:900px)» пишется и без пробела,
# поэтому берём его регуляркой, а не split() по пробелу.
AT_NAME = re.compile(r"^@([A-Za-z-]+)")

COMMENT = re.compile(r"/\*.*?\*/", re.S)

ALWAYS = re.compile(r"^(:root|html|body|\*|::?[a-z-]+|:where\(|@font-face|@keyframes)")

TOKEN = re.compile(r"[.#]([A-Za-z0-9_-]+)")

# :is()/:where()/:not()/:has() — внутри них класс не обязан присутствовать,
# поэтому требовать его наличия нельзя: содержимое вырезаем перед разбором.
FUNCTIONAL = re.compile(r":(?:is|where|not|has|matches|-\w+-any)\([^()]*(?:\([^()]*\)[^()]*)*\)")


def product_pages() -> list[str]:
    """Карточки товара — страницы на шаблоне product-card.

    Ищем и по локальной таблице стилей, и по старой ссылке на elcomspb,
    чтобы скрипт работал и до, и после отвязки.
    """
    pages = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith(".html") or name.startswith("_"):
            continue
        path = os.path.join(ROOT, name)
        with open(path, encoding="utf-8", errors="ignore") as fh:
            page = fh.read()
        if "product-card.css" in page or "elcomspb" in page:
            pages.append(path)
    return pages


def runtime_tokens() -> set[str]:
    """Классы, которые проставляются скриптами и в разметке не встречаются."""
    path = os.path.join(ROOT, "tools", "dom-classes.txt")
    if not os.path.exists(path):
        return set()
    tokens: set[str] = set()
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.split("#")[0]
            tokens.update(line.split())
    return tokens


def used_tokens(pages: list[str]) -> set[str]:
    """Классы и id со всех карточек — включая те, что появляются только по JS."""
    tokens: set[str] = runtime_tokens()
    class_attr = re.compile(r'class="([^"]*)"')
    id_attr = re.compile(r'id="([^"]*)"')
    # Классы, которыми скрипты шаблона управляют состоянием, в разметке
    # могут не встречаться ни разу — забираем их из inline-скриптов тоже.
    js_class = re.compile(r"""classList\.(?:add|remove|toggle|contains)\(\s*['"]([^'"]+)""")

    for path in pages:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            page = fh.read()
        for match in class_attr.finditer(page):
            tokens.update(match.group(1).split())
        for match in id_attr.finditer(page):
            tokens.update(match.group(1).split())
        for match in js_class.finditer(page):
            tokens.update(match.group(1).split())
    return tokens


def split_blocks(css: str) -> list[tuple[str, str, str]]:
    """Разобрать CSS верхнего уровня на (прелюдия, тело, вид).

    Полноценный парсер не нужен: достаточно следить за строками, комментариями
    и балансом фигурных скобок.
    """
    blocks: list[tuple[str, str, str]] = []
    i, n = 0, len(css)
    prelude_start = 0
    depth = 0
    body_start = 0
    quote = ""

    while i < n:
        ch = css[i]

        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = ""
            i += 1
            continue

        if ch in "\"'":
            quote = ch
            i += 1
            continue

        if ch == "/" and i + 1 < n and css[i + 1] == "*":
            end = css.find("*/", i + 2)
            i = (end + 2) if end > 0 else n
            continue

        if ch == "{":
            if depth == 0:
                body_start = i + 1
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                # В бандле перед правилами стоят комментарии с путями к
                # исходным файлам; без их вырезания «/* …/catalog.element/… */»
                # читается как часть селектора и правило теряется.
                prelude = COMMENT.sub(" ", css[prelude_start:body_start - 1]).strip()
                body = css[body_start:i]
                kind = "at" if prelude.startswith("@") else "rule"
                blocks.append((prelude, body, kind))
                prelude_start = i + 1
        elif ch == ";" and depth == 0:
            statement = COMMENT.sub(" ", css[prelude_start:i]).strip()
            if statement:
                blocks.append((statement, "", "statement"))
            prelude_start = i + 1

        i += 1

    return blocks


def selector_kept(selector: str, tokens: set[str]) -> bool:
    selector = selector.strip()
    if not selector:
        return False
    if ALWAYS.match(selector):
        return True
    names = TOKEN.findall(FUNCTIONAL.sub("", selector))
    if not names:
        # Селектор без классов и id (по тегу или атрибуту) — оставляем.
        return True
    return all(name in tokens for name in names)


def filter_css(css: str, tokens: set[str], depth: int = 0) -> str:
    out: list[str] = []

    for prelude, body, kind in split_blocks(css):
        if kind == "statement":
            # @charset / @import — @import вернул бы внешнюю зависимость.
            if not prelude.startswith("@import"):
                out.append(prelude + ";")
            continue

        if kind == "at":
            match = AT_NAME.match(prelude)
            at_name = "@" + match.group(1).lower() if match else prelude.lower()
            if at_name in ("@media", "@supports", "@layer", "@container"):
                inner = filter_css(body, tokens, depth + 1)
                if inner.strip():
                    out.append(f"{prelude}{{{inner}}}")
            elif at_name == "@font-face":
                # Шрифты, лежащие на чужом домене, выбрасываем: Manrope всё равно
                # перекрыт правилом body *{font-family:'Montserrat'!important},
                # а иконочный шрифт lightgallery на карточках не используется.
                # Остаются только @font-face с data:-источниками (иконки swiper).
                external = [
                    url for url in re.findall(r'url\(["\']?([^)"\']+)', body)
                    if not url.startswith("data:")
                ]
                if not external:
                    out.append(f"{prelude}{{{body}}}")
            elif at_name in ("@keyframes", "@-webkit-keyframes", "@page"):
                out.append(f"{prelude}{{{body}}}")
            # прочие at-правила (@import, @charset) отбрасываем
            continue

        selectors = [s for s in prelude.split(",") if selector_kept(s, tokens)]
        if selectors:
            out.append(",".join(s.strip() for s in selectors) + "{" + body.strip() + "}")

    return "\n".join(out)


def main() -> None:
    if not os.path.exists(SOURCE):
        sys.exit(f"нет исходного бандла: {SOURCE}")

    pages = product_pages()
    tokens = used_tokens(pages)
    css = open(SOURCE, encoding="utf-8", errors="ignore").read()
    result = filter_css(css, tokens)

    with open(TARGET, "w", encoding="utf-8") as fh:
        fh.write("/* Подмножество шаблонного CSS карточек товара.\n"
                 "   Собирается tools/subset_card_css.py из assets/vendor/product-card/elcom-full.css.\n"
                 "   Правила и их порядок не меняются — удалены только неиспользуемые селекторы. */\n")
        fh.write(result)

    print(f"страниц: {len(pages)}, классов и id: {len(tokens)}")
    print(f"было: {len(css)/1024:.0f} КБ  ->  стало: {os.path.getsize(TARGET)/1024:.0f} КБ")


if __name__ == "__main__":
    main()
