#!/usr/bin/env python3
"""Extract the product-catalogue tree (categories -> products) from the existing
static pages, so catalog.html can be rebuilt whenever products change.

Reads the "Продукция" / "Product" branch of the site navigation in index.html,
then each category listing page, and writes tools/catalog-data.<lang>.json.

Hand-written fields in an existing JSON (description, image, badge, order) are
preserved on re-run; only names, links and product lists are refreshed.
"""
from __future__ import annotations

import html
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')

LANGS = {
    "ru": {
        "index": "index.html",
        "base": "",
        "nav_marker": 'title="Продукция"',
        "nav_stop": ('title="Решения"', 'title="Новости"', 'title="Контакты"'),
    },
    "en": {
        "index": "en/index.html",
        "base": "en/",
        "nav_marker": 'title="Product"',
        "nav_stop": ('title="Solution"', 'title="News"', 'title="Contact"'),
    },
}

SECOND_LI = re.compile(r'<li class="nav_second_list[^"]*">\s*<a class="navigation" href="([^"]+)" title="([^"]*)"')
PRODUCT_LI = re.compile(
    r'<li[^>]*data-type="product"[^>]*data-id="(\d+)"[^>]*data-name="([^"]*)"(.*?)</li>',
    re.S,
)
PRODUCT_LINK = re.compile(r'class="product_link linktext" href="([^"]+)" title="([^"]*)"')
FEATURE_LINK = re.compile(r'class="feature_img" href="([^"]+)"')
SRCSET = re.compile(r'data-srcset="([^"]+)"')
CATEGORY_HREF = re.compile(r"c\d+/index\.html$")
CHARS_ROW = re.compile(
    r'<div class="chars__row">\s*<div class="chars__cell"><span>([^<]*)</span></div>\s*'
    r'<div class="chars__cell">(.*?)</div>',
    re.S,
)
POWER_KEYS = ("Номинальная мощность", "Мощность")
VOLTAGE_KEYS = ("Номинальное напряжение", "Напряжение")
PITCH_KEYS = ("Позиционирование",)
NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def read(path: str) -> str:
    with open(os.path.join(ROOT, path), encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def pick_image(srcset: str, width: str = "720") -> str:
    """Take the <width>w candidate from a lazysizes srcset, normalised to https."""
    best = ""
    for candidate in srcset.split(","):
        candidate = candidate.strip()
        if not candidate:
            continue
        url = candidate.split()[0]
        best = best or url
        if f"_w{width}.jpg" in url:
            best = url
            break
    if best.startswith("//"):
        best = "https:" + best
    return best


def resolve_url(lang: str, href: str, product_id: str) -> str:
    """Проверить, что файл товара существует, иначе найти его по id.

    На некоторых страницах категорий ссылка отстала от переименования файла
    (например, «Линейный актуатор-p6736101.html» против реального
    «Сервоэлектродвижок-p6736101.html»), и каталог унаследовал бы битый путь.
    """
    base = os.path.join(ROOT, LANGS[lang]["base"].rstrip("/")) if LANGS[lang]["base"] else ROOT
    if os.path.exists(os.path.join(base, href)):
        return href

    suffix = f"p{product_id}.html"
    for name in sorted(os.listdir(base)):
        if name.endswith(suffix):
            print(f"  ~ ссылка перенаправлена: {href} -> {name}")
            return name
    print(f"  ! файл товара не найден: {href}")
    return href


def nav_categories(lang: str) -> list[dict]:
    cfg = LANGS[lang]
    page = read(cfg["index"])
    start = page.find(cfg["nav_marker"])
    if start < 0:
        sys.exit(f"[{lang}] navigation marker not found in {cfg['index']}")
    branch = page[start:]
    for stop in cfg["nav_stop"]:
        cut = branch.find(stop)
        if cut > 0:
            branch = branch[:cut]
            break

    categories = []
    for match in SECOND_LI.finditer(branch):
        href, title = match.group(1), clean(match.group(2))
        # Only real product categories: their folders always end with c<digits>.
        # Industry links (pages/...) and blog sections are filtered out here.
        if not CATEGORY_HREF.search(href):
            continue
        cid = re.search(r"c(\d+)/index\.html$", href)
        categories.append({
            "id": cid.group(1),
            "title": title,
            "url": href,
            "dir": href[: -len("index.html")],
        })
    return categories


def category_products(lang: str, category: dict) -> list[dict]:
    cfg = LANGS[lang]
    path = cfg["base"] + category["url"]
    try:
        page = read(path)
    except FileNotFoundError:
        print(f"  ! missing listing page: {path}")
        return []

    products = []
    seen = set()
    for match in PRODUCT_LI.finditer(page):
        body = match.group(3)
        link = PRODUCT_LINK.search(body) or FEATURE_LINK.search(body)
        if not link:
            continue
        href = link.group(1).lstrip("./")  # listing pages link with ../
        name = clean(link.group(2)) if link.re is PRODUCT_LINK else clean(match.group(2))
        if not name:
            name = clean(match.group(2))
        if href in seen:
            continue
        seen.add(href)
        srcset = SRCSET.search(body)
        products.append({
            "id": match.group(1),
            "name": name,
            "url": resolve_url(lang, href, match.group(1)),
            "image": pick_image(srcset.group(1)) if srcset else "",
        })
    return products


def product_specs(lang: str, url: str) -> dict:
    """Pull the "Характеристики" table off a product page, if it has one.

    Only the redesigned RU product pages carry it; anything else returns {}.
    """
    try:
        page = read(LANGS[lang]["base"] + url)
    except (FileNotFoundError, NotADirectoryError):
        return {}
    if "section_chars" not in page:
        return {}

    rows = {}
    for key, value in CHARS_ROW.findall(page):
        key = clean(key).rstrip(":")
        value = clean(re.sub(r"<[^>]+>", " ", value))
        if key and value:
            rows[key] = value

    def first(keys):
        for wanted in keys:
            for key, value in rows.items():
                if key.startswith(wanted):
                    return value
        return ""

    return {
        "power": first(POWER_KEYS),
        "voltage": first(VOLTAGE_KEYS),
        "pitch": first(PITCH_KEYS),
    }


def power_range(products: list[dict], min_coverage: float = 0.6) -> str:
    """Aggregate per-product power figures into one "min–max кВт" label.

    Returns "" when too few products in the category carry a power figure —
    a range built from two pages out of eight would misrepresent the category.
    """
    documented = sum(1 for product in products if product.get("power"))
    if not products or documented / len(products) < min_coverage:
        return ""
    values = []
    unit = ""
    for product in products:
        power = product.get("power", "")
        if not power:
            continue
        if "кВт" in power:
            unit = "кВт"
        elif "Вт" in power and not unit:
            unit = "Вт"
        for number in NUMBER.findall(power):
            try:
                values.append(float(number.replace(",", ".")))
            except ValueError:
                pass
    if not values or not unit:
        return ""

    def fmt(value: float) -> str:
        text = f"{value:.2f}".rstrip("0").rstrip(".")
        return text.replace(".", ",")

    low, high = min(values), max(values)
    return f"{fmt(low)}–{fmt(high)} {unit}" if low != high else f"{fmt(low)} {unit}"


def build(lang: str) -> dict:
    out_path = os.path.join(ROOT, "tools", f"catalog-data.{lang}.json")
    previous = {}
    if os.path.exists(out_path):
        with open(out_path, encoding="utf-8") as fh:
            for entry in json.load(fh).get("categories", []):
                previous[entry["id"]] = entry

    categories = []
    for category in nav_categories(lang):
        products = category_products(lang, category)
        for product in products:
            product.update(product_specs(lang, product["url"]))
        old = previous.get(category["id"], {})
        image = old.get("image") or next((p["image"] for p in products if p["image"]), "")
        categories.append({
            "id": category["id"],
            "title": category["title"],
            "url": category["url"],
            "description": old.get("description", ""),
            "spec": old.get("spec") or power_range(products),
            "image": image,
            "products": products,
        })
        print(f"  [{lang}] {category['title'][:44]:46s} {len(products):2d} моделей")

    data = {"lang": lang, "categories": categories}
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
    print(f"  -> tools/catalog-data.{lang}.json")
    return data


if __name__ == "__main__":
    for language in sys.argv[1:] or ["ru", "en"]:
        build(language)
