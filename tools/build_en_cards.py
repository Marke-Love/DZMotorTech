#!/usr/bin/env python3
"""Перевести английские страницы товаров на новый шаблон карточки.

Русские карточки уже переделаны (шаблон product-card), английские остались на
старой вёрстке платформы. Содержимое для новой карточки берётся с самой
английской страницы — там уже есть название, галерея и таблица характеристик
на английском, — поэтому переводить ничего не нужно и русско-английское
сопоставление товаров не требуется.

Шапка, подвал и <head> сохраняются от исходной страницы: навигация,
переключатель языков и счётчики остаются прежними.

    python3 tools/build_en_cards.py --dry-run
    python3 tools/build_en_cards.py
"""
from __future__ import annotations

import glob
import html
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
CARD_CSS = "/assets/vendor/product-card/product-card.css"
SVG = "/assets/vendor/product-card/svg"

SHELL_SPLIT_HEAD = '<section class="section">'
SHELL_SPLIT_FOOT = '<footer class="footer" id="footer">'

SPEC_ROW = re.compile(r'<td[^>]*>(.*?)</td>\s*\\?n?\s*<td[^>]*>(.*?)</td>', re.S)
GALLERY = re.compile(r'data-srcset="(//images\.51microshop\.com/18187/product/[^"]+)"')
BREADCRUMB_ITEM = re.compile(
    r'<a[^>]*itemprop="item"[^>]*href="([^"]+)"[^>]*>\s*<span[^>]*itemprop="name"[^>]*>(.*?)</span>', re.S)

# Строки-заголовки таблицы, которые не являются характеристикой.
SKIP_LABELS = {"item", "specification", "parameter", "parameters"}

# Области применения по направлениям: собраны из русских карточек этого же
# направления (самые частые) и переведены. Ключ — id английской категории.
CATEGORY_AREAS = {
    "237492": ["CNC machine tools", "Lithium battery production", "Metallurgy", "Aerospace", "Smart factories"],
    "245038": ["Medical equipment", "Industrial automation", "Precision rotary tables",
               "Precision assembly", "Semiconductor manufacturing"],
    "237564": ["Conveyors", "Pumps and fans", "Compressors", "Production lines", "Rolling mills"],
    "235747": ["Metallurgy", "Mining equipment", "Cranes and hoists", "Chemical industry", "Power generation"],
    "235749": ["Mining equipment", "Chemical industry", "Metallurgy", "Oil production", "Oil refining"],
    "235748": ["Production lines", "Mining equipment", "Chemical industry", "Conveyors", "Pumps and fans"],
    "235750": ["Petrochemicals", "Mining industry", "Metallurgy", "Cement industry", "Power generation"],
    "235751": ["Metallurgy", "Cranes and hoists", "Mining industry", "Shipbuilding", "Oil production"],
}

# Страницы, пришедшие в репозиторий пустыми: содержимое собираем из русской
# карточки того же двигателя (перевод её таблицы характеристик), иначе ссылка
# из меню ведёт на белый экран.
SEED_CARDS = {
    "Z710-DC-Motor-p6442257.html": {
        "title": "Z710 Series DC Motor",
        "category": ("DC-motor-c235747/index.html", "DC Motor"),
        "frames": ["//images.51microshop.com/18628/product/20250730/_Z710_1753838585029_0.jpg"],
        "specs": [
            ("Product Positioning",
             "Standardised heavy-duty DC motor for power generation, metallurgy, mining "
             "and marine equipment"),
            ("Mounting Standard", "Complies with GB 997 and IEC 34-7"),
            ("Mounting Type",
             "Base version IM1001 (single shaft extension); optional IM1002 (double shaft extension)"),
            ("Replacement",
             "Standard dimensions — a drop-in replacement for large DC motors from global "
             "manufacturers, with no design changes"),
            ("Structural Advantages",
             "Reinforced frame and optimised bearing system; drive from both shaft ends and "
             "multi-unit assembly"),
            ("Operating Stability",
             "High-precision rotor balancing, reduced vibration and noise, long service life "
             "and low maintenance costs"),
        ],
    },
}

STATS = [
    ("Founded in", "1958"),
    ("65+", "years of industrial motor production"),
    ("10+", "projects delivered across 5 continents"),
    ("2000+", "units a day with an in-house metallurgical base"),
]


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    value = value.replace("\\n", " ").replace('\\"', '"').replace("\\/", "/")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def nav_categories() -> tuple[dict[str, str], dict[str, str]]:
    """Сопоставить страницу товара с направлением каталога по меню en/index.html.

    Ссылки в меню разложены по восьми направлениям, поэтому принадлежность
    товара берём оттуда — она надёжнее хлебных крошек, которые иногда ведут
    в подкатегорию.
    """
    index_path = os.path.join(ROOT, "en", "index.html")
    if not os.path.exists(index_path):
        return {}
    page = open(index_path, encoding="utf-8", errors="ignore").read()

    start = page.find('title="Product"')
    branch = page[start:] if start > 0 else page
    for stop in ('title="Solution"', 'title="News"', 'title="Contact"'):
        cut = branch.find(stop)
        if cut > 0:
            branch = branch[:cut]
            break

    pages: dict[str, str] = {}
    parents: dict[str, str] = {}
    current = None
    for match in re.finditer(r'<li class="nav_(second|third)_list[^"]*">\s*<a class="navigation" href="([^"]+)"', branch):
        level, href = match.group(1), match.group(2)
        found = re.search(r"c(\d+)/index\.html$", href)
        if level == "second":
            current = found.group(1) if found else None
        elif current:
            if found:
                # Третий уровень бывает подкатегорией — запоминаем её родителя.
                parents[found.group(1)] = current
            else:
                pages[os.path.basename(href)] = current
    return pages, parents


CATEGORY_BY_PAGE, PARENT_CATEGORY = nav_categories()


def product_pages() -> list[str]:
    pages = []
    for path in sorted(glob.glob(os.path.join(ROOT, "en", "*.html"))):
        name = os.path.basename(path)
        if "p6" not in name or name.startswith("_"):
            continue
        if os.path.getsize(path) == 0:
            print(f"  ! пустой файл, пропущен: en/{name}")
            continue
        pages.append(path)
    return pages


def extract(page: str, source: str = "") -> dict:
    title = ""
    match = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    if match:
        title = clean(match.group(1))
    if not title:
        match = re.search(r"<title>(.*?)</title>", page, re.S)
        title = clean(match.group(1)) if match else "Product"

    # Галерея: снимки товара идут в нескольких размерах, берём по одному на кадр.
    frames: list[str] = []
    for srcset in GALLERY.findall(page):
        best = ""
        for candidate in srcset.split(","):
            candidate = candidate.strip().split(" ")[0]
            if not candidate:
                continue
            best = best or candidate
            if "_w900" in candidate:
                best = candidate
                break
        base = re.sub(r"_w\d+\.jpg$", "", best)
        if base and base not in frames:
            frames.append(best)

    # Характеристики: таблица продублирована в разметке, берём уникальные строки.
    specs: list[tuple[str, str]] = []
    seen = set()
    for raw_label, raw_value in SPEC_ROW.findall(page):
        label, value = clean(raw_label), clean(raw_value)
        if not label or not value or len(label) > 60:
            continue
        if label.lower() in SKIP_LABELS or value.lower() in SKIP_LABELS:
            continue
        if label.lower() in seen:
            continue
        seen.add(label.lower())
        specs.append((label, value))

    crumbs = [(href, clean(name)) for href, name in BREADCRUMB_ITEM.findall(page)]
    # Первая крошка — «Home», нужна следующая: раздел каталога.
    category = next(((h, n) for h, n in reversed(crumbs) if n.lower() != "home"), None)

    scenarios = next((v for k, v in specs if k.lower().startswith("applicable")), "")
    areas = [a.strip() for a in re.split(r"[,;/]| and ", scenarios) if 2 < len(a.strip()) < 42][:8]
    if not areas:
        category_id = CATEGORY_BY_PAGE.get(os.path.basename(source or ""))
        if not category_id and category:
            found = re.search(r"c(\d+)/index\.html$", category[0])
            category_id = found.group(1) if found else None
        # Товар может лежать в подкатегории — поднимаемся к направлению каталога.
        category_id = PARENT_CATEGORY.get(category_id or "", category_id)
        areas = CATEGORY_AREAS.get(category_id or "", [])

    return {"title": title, "frames": frames[:6], "specs": specs, "category": category, "areas": areas}


def render_gallery(data: dict) -> str:
    if not data["frames"]:
        return '<div class="product-slider-container"></div>'
    slides = "".join(
        f'<div class="swiper-slide"><img loading="lazy" src="{esc(frame)}" alt="{esc(data["title"])}" '
        f'style="width:100%;height:100%;object-fit:contain;"></div>'
        for frame in data["frames"]
    )
    return f"""<div class="product-slider-container" style="width:373px;max-width:373px;flex-shrink:0;">
              <div class="swiper dz-main-swiper"
                   style="width:373px;height:373px;border-radius:12px;overflow:hidden;background:#f7f8fa;">
                <div class="swiper-wrapper">{slides}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
              </div>
            </div>"""


TAB_ICONS = {
    "chars": '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>',
    "areas": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
    "projects": '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>',
}


def render_tabs(data: dict) -> str:
    """Якорные вкладки над карточкой — только на те секции, которые есть."""
    tabs = [("projects", "Our production")]
    if data["specs"]:
        tabs.insert(0, ("chars", "Characteristics"))
    if data["areas"]:
        tabs.insert(len(tabs) - 1, ("areas", "Applicable scenarios"))

    items = "".join(
        f"""<a href="#section-{key}" class="tabs__btn" style="text-decoration:none;">
              <svg class="tabs__btn-img" width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                {TAB_ICONS[key]}
              </svg>
              <span class="tabs__btn-text">{esc(label)}</span>
            </a>"""
        for key, label in tabs
    )
    return f'<div class="tabs">{items}</div>'


def render_main(data: dict) -> str:
    title = esc(data["title"])
    category_link = ""
    if data["category"]:
        href, name = data["category"]
        category_link = (f'<a class="dzc-card__back" href="{esc(href)}" '
                         f'style="color:#00aeef;text-decoration:none;">← {esc(name)}</a>')

    key_specs = [(k, v) for k, v in data["specs"] if not k.lower().startswith("applicable")][:6]
    about_rows = "".join(
        f"""<div class="product_item__about-param">
                  <span class="product_item__about-label">{esc(label)}</span>
                  <span class="product_item__about-value product_item__about-value--underlined">{esc(value)}</span>
                </div>"""
        for label, value in key_specs
    )

    chars_rows = "".join(
        f"""<div class="chars__row">
              <div class="chars__cell"><span>{esc(label)}:</span></div>
              <div class="chars__cell">{esc(value)}</div>
            </div>"""
        for label, value in data["specs"]
    )

    areas_items = "".join(
        f"""<a style="display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid rgba(255,255,255,0.12);
              border-radius:16px;color:#fff;text-decoration:none;background:rgba(255,255,255,0.03);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00aeef" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>
              </svg>
              <span style="font-size:13px;line-height:1.4;">{esc(area)}</span>
            </a>"""
        for area in data["areas"]
    )

    areas_section = ""
    if data["areas"]:
        areas_section = f"""
    <section id="section-areas" style="margin-top:48px;background:#0d1f2d;border-radius:24px;padding:32px 24px;">
      <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">
        Applicable scenarios
      </span>
      <div class="areas-grid" style="margin-top:20px;">{areas_items}</div>
    </section>"""

    stats = "".join(
        f"""<div style="display:flex;flex-direction:column;gap:6px;">
              <strong style="font-size:28px;color:#fff;">{esc(number)}</strong>
              <span style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.4;">{esc(caption)}</span>
            </div>"""
        for number, caption in STATS
    )

    chars_section = f"""
  <section id="section-chars" class="section__standard section_chars">
    <div class="section__standard-header"><h2 class="title">Characteristics</h2></div>
    <div class="chars">{chars_rows}</div>
  </section>""" if data["specs"] else ""

    about_block = f"""<div class="product_item__about">
            <div class="product_item__about-header"><h2>Key parameters</h2></div>
            <div class="product_item__about-params">{about_rows}</div>
          </div>""" if key_specs else ""

    return f"""
<main class="page_detail container" style="width:100%;max-width:1580px;margin:0 auto;padding:0 25px;box-sizing:border-box;">
  <section class="detail_top">
    <div class="product_nav">
      <div class="product_nav__content">
        {f'<img class="product_nav__img" src="{esc(data["frames"][0])}" alt="{title}" />' if data["frames"] else ''}
        <div class="product_nav__desc">
          <span class="product_nav__desc-title">{title}</span>
        </div>
        <div class="product_nav__actions">
          <a class="btn_primary" href="#request"
             style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;">
            <span class="product__buy-title">Request a quote</span>
          </a>
        </div>
      </div>
    </div>
    {render_tabs(data)}
  </section>

  <section class="product_item">
    <div class="product_item__content">
      <div class="product_item__content-start sticky">
        {render_gallery(data)}
      </div>
      <div class="product_item__content-center">
        <div class="product_item__content-buy">
          <div class="product_item__title-block desktop">
            <h1 class="product_item__title">{title}</h1>
          </div>
          {category_link}
          {about_block}
        </div>
      </div>
      <div class="product_item__content-order sticky">
        <div class="card_buy">
          <a class="btn_primary" href="#request"
             style="display:inline-flex;align-items:center;justify-content:center;width:100%;text-decoration:none;">
            <span class="product__buy-title">Request a quote</span>
          </a>
        </div>
        <div class="product_item__content-order--props">
          <div class="card_prop">
            <div class="card_prop__header green">
              <img src="{SVG}/circle-check.svg" alt="Check mark">
              <span class="card_prop__header-title">Availability:</span>
            </div>
            <div class="card_prop__row">
              <span>Production:</span>
              <span class="card_prop__row-right">Dazhong Motor plant, China</span>
            </div>
            <div class="card_prop__row">
              <span>Lead time:</span>
              <span class="card_prop__row-right">On request</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

{chars_section}
{areas_section}

  <section id="section-projects" style="margin-top:48px;background:#0d1f2d;border-radius:24px;overflow:hidden;">
    <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:0;align-items:stretch;">
      <div style="padding:32px 24px;">
        <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.3);">
          Our production
        </span>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin-top:22px;">{stats}</div>
      </div>
      <img src="/assets/images/projects-map.jpg" alt="Project geography"
           style="width:100%;height:100%;object-fit:cover;display:block;">
    </div>
  </section>

  <section id="request" style="margin-top:48px;margin-bottom:48px;">
    <h2 style="margin:0 0 6px;font-size:26px;">Send a request</h2>
    <p style="margin:0 0 22px;color:#55646f;font-size:15px;">
      Our manager will get back to you within one business day.
    </p>
    <form method="get" action="pages/contactus.html">
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:820px;">
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="font-size:13px;color:#55646f;">Full name</label>
          <input name="name" type="text" style="height:44px;border:1px solid #c6ccd0;border-radius:10px;padding:0 14px;">
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="font-size:13px;color:#55646f;">Company</label>
          <input name="company" type="text" style="height:44px;border:1px solid #c6ccd0;border-radius:10px;padding:0 14px;">
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="font-size:13px;color:#55646f;">Phone</label>
          <input name="phone" type="tel" style="height:44px;border:1px solid #c6ccd0;border-radius:10px;padding:0 14px;">
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="font-size:13px;color:#55646f;">Email</label>
          <input name="email" type="email" style="height:44px;border:1px solid #c6ccd0;border-radius:10px;padding:0 14px;">
        </div>
      </div>
      <label style="display:flex;gap:10px;align-items:flex-start;margin-top:16px;max-width:820px;font-size:13px;color:#55646f;">
        <input name="consent" type="checkbox" style="margin-top:3px;">
        <span>I agree to the processing of my personal data in line with the
          <a href="pages/privacy-policy-11909901.html" style="color:#00aeef;text-decoration:none;">Privacy Policy</a> and the
          <a href="pages/personal-data-policy.html" style="color:#00aeef;text-decoration:none;">Personal Data Policy</a>.
        </span>
      </label>
      <button type="submit" class="btn_primary"
              style="margin-top:18px;width:auto;min-width:240px;padding:0 28px;">Send request</button>
    </form>
  </section>
</main>
"""


SCRIPTS = """
<script>
document.addEventListener('DOMContentLoaded', function () {
    if (window.Swiper && document.querySelector('.dz-main-swiper')) {
        new Swiper('.dz-main-swiper', {
            spaceBetween: 0,
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    }
});
</script>
"""


def patch_head(head: str) -> str:
    if CARD_CSS not in head:
        head = head.replace("</head>", f'<link rel="stylesheet" href="{CARD_CSS}">\n</head>', 1)
    if "Montserrat" not in head:
        head = head.replace(
            "</head>",
            "<style>body{background-color:#f2f3f2}body,body *{font-family:'Montserrat',sans-serif!important}</style>\n</head>",
            1,
        )
    head = head.replace('data-template="product"', 'data-template="product-card"')
    return head


def seed_head(donor_head: str, name: str, title: str) -> str:
    """Голову для пустой страницы берём у соседней карточки и переписываем адреса."""
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", donor_head, count=1, flags=re.S)
    url = f"https://dzmotortech.ru/en/{name}"
    head = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + esc(title) + m.group(2), head, count=1)
    head = re.sub(r'\s*<link rel="amphtml"[^>]*/?>', "", head, count=1)
    return head


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    built = skipped = 0
    donor_head = donor_foot = ""

    for path in product_pages():
        page = open(path, encoding="utf-8", errors="ignore").read()
        head_end = page.find(SHELL_SPLIT_HEAD)
        foot_start = page.find(SHELL_SPLIT_FOOT)
        if head_end < 0 or foot_start < 0:
            print(f"  ! не найдены границы шаблона: {os.path.basename(path)}")
            skipped += 1
            continue

        data = extract(page, path)
        if not data["specs"] and not data["frames"]:
            print(f"  ! нет ни характеристик, ни фотографий, пропущено: {os.path.basename(path)}")
            skipped += 1
            continue
        if not data["specs"]:
            print(f"  ~ без таблицы характеристик: {os.path.basename(path)}")

        head = patch_head(page[:head_end])
        foot = page[foot_start:].replace("</body>", SCRIPTS + "</body>", 1)
        result = head + render_main(data) + foot
        if not donor_head:
            donor_head, donor_foot = head, foot

        if not dry_run:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(result)
        built += 1

    # Пустые страницы: собираем из подготовленных данных на шаблоне соседней карточки.
    for name, seed in SEED_CARDS.items():
        target = os.path.join(ROOT, "en", name)
        if not os.path.exists(target) or os.path.getsize(target) > 0:
            continue
        if not donor_head:
            print(f"  ! не из чего собрать шаблон для {name}")
            continue
        data = {"title": seed["title"], "frames": seed["frames"], "specs": seed["specs"],
                "category": seed["category"], "areas": CATEGORY_AREAS.get("235747", [])}
        result = seed_head(donor_head, name, seed["title"]) + render_main(data) + donor_foot
        if not dry_run:
            with open(target, "w", encoding="utf-8") as fh:
                fh.write(result)
        built += 1
        print(f"  + собрана пустая страница: en/{name}")

    verb = "будет собрано" if dry_run else "собрано"
    print(f"{verb} карточек: {built}, пропущено: {skipped}")


if __name__ == "__main__":
    main()
