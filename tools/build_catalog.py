#!/usr/bin/env python3
"""Собрать страницу каталога catalog.html (и en/catalog.html) из данных,
извлечённых tools/extract_catalog.py.

Шапка, подвал и <head> берутся из all-products.html, поэтому навигация,
переключатель языков и счётчики остаются ровно такими же, как на остальном
сайте. Тексты внутри маркеров <!-- CONTENT:...:start --> сохраняются при
пересборке: их правят из админки, генератор их не затирает.

    python3 tools/build_catalog.py           # обе версии
    python3 tools/build_catalog.py ru        # только русская
"""
from __future__ import annotations

import html
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')

SHELL_SPLIT_HEAD = '<section class="section">'
SHELL_SPLIT_FOOT = '<footer class="footer" id="footer">'

NUMBER = re.compile(r"\d+(?:[.,]\d+)?")

TEXT = {
    "ru": {
        "source": "all-products.html",
        "out": "catalog.html",
        "home": "index.html",
        "contacts": "pages/contactus.html",
        "all_products": "all-products.html",
        "canonical": "https://dzmotortech.ru/catalog.html",
        "title": "Каталог продукции — электродвигатели и приводы Dazhong Motor",
        "description": (
            "Каталог электродвигателей Dazhong Motor: сервоприводы, преобразователи частоты, "
            "высоковольтные, низковольтные, взрывозащищённые и специальные двигатели. "
            "Характеристики и серии по каждому направлению."
        ),
        "breadcrumb_home": "Главная",
        "breadcrumb_current": "Каталог продукции",
        "hero_eyebrow": "Каталог продукции",
        "hero_title": "Электродвигатели и приводы<br>для тяжёлой <em>промышленности</em>",
        "hero_lede": (
            "Восемь направлений — от миниатюрных сервоприводов до высоковольтных "
            "взрывозащищённых машин. Внутри каждого направления собраны все серии "
            "с мощностью и напряжением, чтобы дойти до нужной модели за один экран."
        ),
        "hero_primary": "К категориям",
        "hero_secondary": "Все товары списком",
        "plate": [
            ("Направлений", "{categories}"),
            ("Моделей", "{models}"),
            ("Мощность", "{power}"),
            ("Напряжение", "{voltage}"),
        ],
        "why_eyebrow": "Почему Dazhong Motor",
        "why_title": "Завод, а не перепродажа со склада",
        "why_lede": (
            "«Дажун» входит в тройку китайских производителей электродвигателей по объёму "
            "производства и держит 45% местного рынка машин первого класса энергоэффективности."
        ),
        "why": [
            (
                "Сертификация под рынок сбыта",
                "ISO 9001, ISO 14001, ISO 45001, CE, UL и ATEX — оборудование проходит "
                "в Европу, Северную Америку, Юго-Восточную Азию и на Ближний Восток.",
            ),
            (
                "Взрывозащита как отдельная линейка",
                "Исполнения Ex с полной сертификацией для нефтехимии, фармацевтики и "
                "горнодобычи, а не опция к общепромышленной серии.",
            ),
            (
                "Энергоэффективность от IE3",
                "Вся продукция соответствует стандарту IE3 или превосходит его; "
                "в линейке есть исполнения IE4 и IE5.",
            ),
            (
                "Привод считается системой",
                "Двигатель, преобразователь частоты и ПО подбираются вместе, чтобы "
                "параметры привода были согласованы под конкретную установку.",
            ),
        ],
        "cats_eyebrow": "Направления",
        "cats_title": "Выберите тип оборудования",
        "models_forms": ("модель", "модели", "моделей"),
        "search_label": "Поиск по каталогу",
        "search_placeholder": "Серия, тип, мощность…",
        "search_clear": "Очистить поиск",
        "counter": "Показано моделей: ",
        "empty_title": "Ничего не нашлось",
        "empty_text": "По запросу «{query}» нет ни одной модели. Попробуйте название серии — например, YBX3 или EV510.",
        "cat_all": "Все товары направления",
        "show_more": "Показать ещё",
        "show_less": "Свернуть",
        "closing_title": "Не нашли нужное исполнение?",
        "closing_text": (
            "Подберём двигатель под параметры установки: мощность, напряжение, класс "
            "взрывозащиты, режим работы и способ охлаждения."
        ),
        "closing_button": "Связаться с нами",
        "power_prefix": "",
        "voltage_prefix": "до ",
        "voltage_unit_kv": "кВ",
        "voltage_unit_v": "В",
        "arrow_label": "Открыть страницу модели",
        "to_top": "Наверх",
    },
    "en": {
        "source": "en/all-products.html",
        "out": "en/catalog.html",
        "home": "index.html",
        "contacts": "pages/contactus.html",
        "all_products": "all-products.html",
        "canonical": "https://dzmotortech.ru/en/catalog.html",
        "title": "Product catalogue — Dazhong Motor electric motors and drives",
        "description": (
            "Dazhong Motor product catalogue: servo motors, variable frequency drives, "
            "high-voltage, low-voltage, explosion-proof and special motors, with series "
            "listed under each product line."
        ),
        "breadcrumb_home": "Home",
        "breadcrumb_current": "Product catalogue",
        "hero_eyebrow": "Product catalogue",
        "hero_title": "Electric motors and drives<br>for heavy <em>industry</em>",
        "hero_lede": (
            "Eight product lines, from miniature servo motors to high-voltage "
            "explosion-proof machines. Each line lists every series it contains, "
            "so the right model is one screen away."
        ),
        "hero_primary": "Browse product lines",
        "hero_secondary": "All products as a list",
        "plate": [
            ("Product lines", "{categories}"),
            ("Models", "{models}"),
            ("Power", "{power}"),
            ("Voltage", "{voltage}"),
        ],
        "why_eyebrow": "Why Dazhong Motor",
        "why_title": "A factory, not a reseller",
        "why_lede": (
            "Dazhong is among the top three Chinese motor manufacturers by output and holds "
            "45% of the domestic market for first-class energy-efficient machines."
        ),
        "why": [
            (
                "Certified for the target market",
                "ISO 9001, ISO 14001, ISO 45001, CE, UL and ATEX — cleared for Europe, "
                "North America, South-East Asia and the Middle East.",
            ),
            (
                "Explosion protection as its own line",
                "Fully certified Ex versions for petrochemicals, pharmaceuticals and mining, "
                "not an add-on to a general-purpose series.",
            ),
            (
                "IE3 efficiency and above",
                "Every product meets or exceeds IE3; the range includes IE4 and IE5 versions.",
            ),
            (
                "The drive treated as one system",
                "Motor, frequency converter and software are specified together, so the drive "
                "parameters match the installation.",
            ),
        ],
        "cats_eyebrow": "Product lines",
        "cats_title": "Pick an equipment type",
        "models_forms": ("model", "models", "models"),
        "search_label": "Search the catalogue",
        "search_placeholder": "Series, type, power…",
        "search_clear": "Clear search",
        "counter": "Models shown: ",
        "empty_title": "Nothing matched",
        "empty_text": "No model matches “{query}”. Try a series name — YBX3 or EV510, for example.",
        "cat_all": "All products in this line",
        "show_more": "Show more",
        "show_less": "Collapse",
        "closing_title": "Need a version that is not listed?",
        "closing_text": (
            "We size the motor to the installation: power, voltage, explosion-protection "
            "class, duty cycle and cooling method."
        ),
        "closing_button": "Get in touch",
        "power_prefix": "",
        "voltage_prefix": "up to ",
        "voltage_unit_kv": "kV",
        "voltage_unit_v": "V",
        "arrow_label": "Open model page",
        "to_top": "Back to top",
    },
}

ICONS = [
    # сертификация — печать с галочкой
    '<path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    # взрывозащита — вспышка в контуре
    '<path d="M12 3l-6 9h5l-1 9 6-9h-5l1-9z"/>',
    # энергоэффективность — шкала
    '<path d="M4 19h16"/><path d="M7 19v-6"/><path d="M12 19V8"/><path d="M17 19v-9"/>',
    # система привода — три связанных узла
    '<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/>'
    '<path d="M8.1 10.9l7.8-3.6"/><path d="M8.1 13.1l7.8 3.6"/>',
]


def asset(path: str) -> str:
    """Версия по времени изменения файла: после правки CSS/JS браузеры
    не отдают закешированную старую версию."""
    full = os.path.join(ROOT, path.lstrip("/"))
    stamp = int(os.path.getmtime(full)) if os.path.exists(full) else 0
    return f"{path}?v={stamp}"


def read(path: str) -> str:
    with open(os.path.join(ROOT, path), encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def fmt_number(value: float) -> str:
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return text.replace(".", ",")


def group_thousands(text: str) -> str:
    """10000 -> 10 000, чтобы длинные значения читались с одного взгляда."""
    return re.sub(r"(?<=\d)(?=(\d{3})+(?!\d))", " ", text)


def models_count(count: int, words: dict) -> str:
    """«1 модель», «3 модели», «5 моделей» — русский счётный оборот.

    Для английского вторая и третья формы совпадают, поэтому та же функция
    отрабатывает обе версии сайта.
    """
    one, few, many = words["models_forms"]
    if few == many:
        # Языки без славянского счётного оборота: единственное только для единицы.
        return f"{count} {one if count == 1 else many}"

    tail_100 = count % 100
    tail_10 = count % 10
    if 11 <= tail_100 <= 14:
        form = many
    elif tail_10 == 1:
        form = one
    elif 2 <= tail_10 <= 4:
        form = few
    else:
        form = many
    return f"{count} {form}"


def tidy_spec(value: str) -> str:
    """Привести характеристику к виду для списка: без пояснительных хвостов
    после «;» и с пробелом в разрядах — «6000 В» читается как «6 000 В»."""
    value = value.split(";")[0].strip().rstrip(",")
    return group_thousands(value)


def totals(categories: list[dict], lang: str) -> dict:
    """Сводка для шильдика в первом экране — считается из тех же данных,
    что и списки моделей, поэтому не расходится с содержимым страницы."""
    words = TEXT[lang]
    powers_kw: list[float] = []
    volts: list[float] = []

    for category in categories:
        for product in category["products"]:
            power = product.get("power", "")
            if power:
                scale = 0.001 if ("Вт" in power and "кВт" not in power) or (
                    "W" in power and "kW" not in power) else 1.0
                for number in NUMBER.findall(power):
                    try:
                        powers_kw.append(float(number.replace(",", ".")) * scale)
                    except ValueError:
                        pass

            voltage = product.get("voltage", "")
            if voltage:
                default_kilo = "кВ" in voltage or "kV" in voltage
                for chunk in re.split(r"[/,;]", voltage):
                    kilo = ("кВ" in chunk or "kV" in chunk) or (
                        default_kilo and not re.search(r"\d\s*(В|V)\b", chunk))
                    for number in NUMBER.findall(chunk):
                        try:
                            volts.append(float(number.replace(",", ".")) * (1000 if kilo else 1))
                        except ValueError:
                            pass

    def power_text(value_kw: float) -> str:
        """Ниже киловатта — в ваттах: «0 кВт» в шильдике выглядит как ошибка."""
        if value_kw < 1:
            unit = "Вт" if lang == "ru" else "W"
            return f"{group_thousands(fmt_number(value_kw * 1000))} {unit}"
        unit = "кВт" if lang == "ru" else "kW"
        return f"{group_thousands(fmt_number(value_kw))} {unit}"

    power_label = ""
    if powers_kw:
        low, high = min(powers_kw), max(powers_kw)
        power_label = f"{power_text(low)} – {power_text(high)}" if low != high else power_text(low)

    voltage_label = ""
    if volts:
        top = max(volts)
        if top >= 1000:
            voltage_label = f"{words['voltage_prefix']}{fmt_number(top / 1000)} {words['voltage_unit_kv']}"
        else:
            voltage_label = f"{words['voltage_prefix']}{group_thousands(fmt_number(top))} {words['voltage_unit_v']}"

    return {
        "categories": str(len(categories)),
        "models": str(sum(len(c["products"]) for c in categories)),
        "power": power_label or "—",
        "voltage": voltage_label or "—",
    }


def keep_editable(lang: str, key: str, default: str) -> str:
    """Сохранить текст, отредактированный в админке между CONTENT-маркерами."""
    path = os.path.join(ROOT, TEXT[lang]["out"])
    if not os.path.exists(path):
        return default
    page = read(TEXT[lang]["out"])
    match = re.search(
        re.escape(f"<!-- CONTENT:{key}:start -->") + r"(.*?)" + re.escape(f"<!-- CONTENT:{key}:end -->"),
        page,
        re.S,
    )
    return match.group(1).strip() if match else default


def editable(lang: str, key: str, default: str) -> str:
    return (
        f"<!-- CONTENT:{key}:start -->\n{keep_editable(lang, key, default)}\n"
        f"<!-- CONTENT:{key}:end -->"
    )


def prefix(lang: str, url: str) -> str:
    """Ссылки внутри en/ ведут на файлы в той же папке — префикс не нужен."""
    return url


def render_hero(lang: str, words: dict, summary: dict) -> str:
    # Ячейки без данных (у английских карточек нет таблицы характеристик) не выводим.
    cells = "".join(
        f'<div class="dzc-plate__cell">{esc(label)}'
        f'<span class="dzc-plate__value">{esc(value.format(**summary))}</span></div>'
        for label, value in words["plate"]
        if value.format(**summary) != "—"
    )
    hero_text = (
        f'<h1 class="dzc__display dzc-hero__title">{words["hero_title"]}</h1>\n'
        f'<p class="dzc__lede dzc-hero__lede">{esc(words["hero_lede"])}</p>'
    )
    return f"""
  <section class="dzc-hero">
    <div class="dzc-hero__media"></div>
    <div class="dzc-hero__scrim"></div>
    <div class="dzc-hero__inner">
      <div class="dzc__shell">
        <div class="dzc-hero__grid">
          {editable(lang, f"catalog_hero_{lang}", hero_text)}
          <div class="dzc-hero__actions">
            <a class="dzc-btn dzc-btn--primary" href="#dzc-categories">{esc(words["hero_primary"])}</a>
            <a class="dzc-btn dzc-btn--ghost" href="{words["all_products"]}">{esc(words["hero_secondary"])}</a>
          </div>
          <div class="dzc-plate dzc-hero__plate">{cells}</div>
        </div>
      </div>
    </div>
  </section>"""


def render_why(words: dict) -> str:
    items = "".join(
        f"""
        <article class="dzc-why__item">
          <svg class="dzc-why__icon" width="26" height="26" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">{icon}</svg>
          <h3 class="dzc-why__title">{esc(title)}</h3>
          <p class="dzc-why__text">{esc(text)}</p>
        </article>"""
        for icon, (title, text) in zip(ICONS, words["why"])
    )
    return f"""
  <section class="dzc-section" id="dzc-why">
    <div class="dzc__shell">
      <div class="dzc-section__head">
        <h2 class="dzc__display dzc-section__title">{esc(words["why_title"])}</h2>
        <p class="dzc__lede">{esc(words["why_lede"])}</p>
      </div>
      <div class="dzc-why">{items}
      </div>
    </div>
  </section>"""


def render_tiles(words: dict, categories: list[dict]) -> str:
    tiles = "".join(
        f"""
        <a class="dzc-tile" href="#{esc(section_id(category))}" data-dzc-tile>
          <span class="dzc-tile__media" style="background-image:url('{esc(local_image(category, small=True))}')"></span>
          <span class="dzc-tile__body">
            <span class="dzc-tile__title">{esc(category["title"])}</span>
            <span class="dzc-meta dzc-tile__meta">{esc(models_count(len(category["products"]), words))}"""
        + (f" · {esc(tidy_spec(category['spec']))}" if category["spec"] else "")
        + """</span>
          </span>
        </a>"""
        for category in categories
    )
    return f"""
  <section class="dzc-section" id="dzc-categories">
    <div class="dzc__shell">
      <div class="dzc-section__head">
        <h2 class="dzc__display dzc-section__title">{esc(words["cats_title"])}</h2>
      </div>
      <div class="dzc-tiles">{tiles}
      </div>
    </div>
  </section>"""


def render_bar(words: dict, categories: list[dict], summary: dict) -> str:
    chips = "".join(
        f'<li><a class="dzc-chip" href="#{esc(section_id(category))}" data-dzc-chip>'
        f'{esc(category["title"])}</a></li>'
        for category in categories
    )
    return f"""
  <div class="dzc-bar">
    <div class="dzc__shell">
      <div class="dzc-bar__inner">
        <div class="dzc-chips-wrap"><ul class="dzc-chips" data-dzc-chips>{chips}</ul></div>
        <div class="dzc-search">
          <svg class="dzc-search__icon" width="17" height="17" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>
          </svg>
          <input class="dzc-search__input" type="search" data-dzc-search
                 placeholder="{esc(words["search_placeholder"])}"
                 aria-label="{esc(words["search_label"])}">
          <button class="dzc-search__clear" type="button" data-dzc-search-clear
                  aria-label="{esc(words["search_clear"])}">&times;</button>
        </div>
        <p class="dzc-bar__count" data-dzc-count-line aria-live="polite" hidden>
          {esc(words["counter"])}<span data-dzc-count>0</span>
        </p>
      </div>
    </div>
  </div>"""


VISIBLE_ITEMS = 5  # столько моделей показываем сразу, остальное — под «Показать ещё»

# Английские категории — те же товарные направления, но с другими id, поэтому
# подготовленные фотографии переиспользуем по соответствию, а не готовим дважды.
IMAGE_ALIASES = {
    "237492": "242906",  # Servo Motor
    "245038": "245137",  # Miniature Servo Motor
    "237564": "242907",  # Variable Frequency Drives
    "235749": "242903",  # High Voltage Motor
    "235748": "242902",  # Low Voltage Motor
    "235750": "242904",  # Permanent Magnet motor
    "235747": "242901",  # DC Motor
    "235751": "242905",  # Special Motor
}


def local_image(category: dict, small: bool = False) -> str:
    """Подготовленная копия фотографии категории.

    Файлы делает tools/prepare_images.py: один фон, одна рамка, один размер.
    Если копии ещё нет, откатываемся на исходник с CDN.
    """
    suffix = "-sm" if small else ""
    image_id = IMAGE_ALIASES.get(category["id"], category["id"])
    name = f"c{image_id}{suffix}.jpg"
    if os.path.exists(os.path.join(ROOT, "assets", "images", "catalog", name)):
        return f"/assets/images/catalog/{name}"
    return category["image"]


def section_id(category: dict) -> str:
    return f"c{category['id']}"


def render_categories(lang: str, words: dict, categories: list[dict]) -> str:
    blocks = []
    for position, category in enumerate(categories, start=1):
        items = []
        for product in category["products"]:
            spec_bits = [tidy_spec(bit) for bit in (product.get("power"), product.get("voltage")) if bit]
            spec = " · ".join(spec_bits)
            haystack = " ".join(
                filter(None, [product["name"], product.get("power", ""), product.get("voltage", ""), category["title"]])
            ).lower().replace("ё", "е")
            items.append(
                f"""
            <li class="dzc-item" data-dzc-item="{esc(haystack)}">
              <a class="dzc-item__link" href="{esc(prefix(lang, product["url"]))}">
                <span>
                  <span class="dzc-item__name">{esc(product["name"])}</span>"""
                + (f'\n                  <span class="dzc-meta dzc-item__spec">{esc(spec)}</span>' if spec else "")
                + f"""
                </span>
                <span class="dzc-item__arrow" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 17L17 7"/><path d="M8 7h9v9"/>
                  </svg>
                </span>
              </a>
            </li>"""
            )

        flip = " dzc-cat--flip" if position % 2 == 0 else ""

        # Список показываем коротким: первые VISIBLE_ITEMS моделей, остальные
        # раскрываются кнопкой. В разметке они есть всегда, поэтому поиск
        # находит и скрытые позиции.
        hidden_count = max(0, len(category["products"]) - VISIBLE_ITEMS)
        more_button = ""
        if hidden_count:
            more_button = (
                f'<button class="dzc-more" type="button" data-dzc-more '
                f'data-dzc-more-label="{esc(words["show_more"])} {hidden_count}" '
                f'data-dzc-less-label="{esc(words["show_less"])}" aria-expanded="false">'
                f'{esc(words["show_more"])} {hidden_count}</button>'
            )

        meta = models_count(len(category["products"]), words)
        if category["spec"]:
            meta += f' · {tidy_spec(category["spec"])}'

        blocks.append(f"""
  <section class="dzc-cat{flip}" id="{section_id(category)}" data-dzc-section data-dzc-visible="{VISIBLE_ITEMS}">
    <div class="dzc__shell">
      <div class="dzc-cat__grid">
        <div class="dzc-cat__media">
          <div class="dzc-cat__frame" style="background-image:url('{esc(local_image(category))}')"></div>
        </div>
        <div class="dzc-cat__body">
          <div class="dzc-cat__head">
            <p class="dzc-meta dzc-cat__meta">{esc(meta)}</p>
            <h2 class="dzc__display dzc-cat__title">{esc(category["title"])}</h2>
            <p class="dzc__lede">{esc(category["description"])}</p>
          </div>
          <ul class="dzc-cat__list">{"".join(items)}
          </ul>
          <div class="dzc-cat__foot">
            {more_button}
            <a class="dzc-cat__all" href="{esc(prefix(lang, category["url"]))}">
              {esc(words["cat_all"])}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>""")

    return "".join(blocks)


def render_closing(lang: str, words: dict) -> str:
    text = (
        f'<h2 class="dzc__display dzc-closing__title">{esc(words["closing_title"])}</h2>\n'
        f'<p class="dzc-closing__text">{esc(words["closing_text"])}</p>'
    )
    return f"""
  <div class="dzc-empty" data-dzc-empty>
    <div class="dzc__shell">
      <p class="dzc-empty__title">{esc(words["empty_title"])}</p>
      <p class="dzc__lede">{words["empty_text"].format(query='<span data-dzc-empty-query></span>')}</p>
    </div>
  </div>

  <section class="dzc-closing">
    <div class="dzc__shell">
      <div class="dzc-closing__box">
        <div>{editable(lang, f"catalog_closing_{lang}", text)}</div>
        <a class="dzc-btn dzc-btn--primary" href="{words["contacts"]}">{esc(words["closing_button"])}</a>
      </div>
    </div>
  </section>"""


def render_top_button(words: dict) -> str:
    return f"""
  <button class="dzc-top" type="button" data-dzc-top aria-label="{esc(words["to_top"])}"
          title="{esc(words["to_top"])}">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 15l-6-6-6 6"/>
    </svg>
  </button>"""


def render_breadcrumb(words: dict) -> str:
    return f"""
  <div class="dzc__shell" style="padding-top:18px;padding-bottom:2px;">
    <ol class="breadcrumb hidden-xs" itemscope itemtype="http://schema.org/BreadcrumbList"
        style="background:none;padding-left:0;margin-bottom:0;">
      <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a itemprop="item" href="{words["home"]}"><span itemprop="name">{esc(words["breadcrumb_home"])}</span></a>
        <meta itemprop="position" content="1"/>
      </li>
      <li class="active" itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span itemprop="name">{esc(words["breadcrumb_current"])}</span>
        <meta itemprop="position" content="2"/>
      </li>
    </ol>
  </div>"""


HERO_IMAGE = "/images.51microshop.com/18628/snippet/1753691315115_0.jpg_w1512.jpg"


def patch_head(head: str, words: dict) -> str:
    head = re.sub(r"<title>.*?</title>", f"<title>{esc(words['title'])}</title>", head, count=1, flags=re.S)
    head = re.sub(
        r'(<meta name="description" content=")[^"]*(")',
        lambda m: m.group(1) + esc(words["description"]) + m.group(2),
        head,
        count=1,
    )
    head = re.sub(
        r'(<link rel="canonical" href=")[^"]*(")',
        lambda m: m.group(1) + words["canonical"] + m.group(2),
        head,
        count=1,
    )
    head = re.sub(r'(<meta property="og:title" content=")[^"]*(")',
                  lambda m: m.group(1) + esc(words["title"]) + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                  lambda m: m.group(1) + esc(words["description"]) + m.group(2), head, count=1)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                  lambda m: m.group(1) + words["canonical"] + m.group(2), head, count=1)
    # Предзагрузки от шаблона all-products тянут баннеры, которых в каталоге нет.
    head = re.sub(r'\s*<link rel="preload"[^>]*as="image"[^>]*/?>', "", head)
    head = head.replace(
        "</head>",
        '<link rel="preload" fetchpriority="high" as="image" href="/assets/images/catalog-hero.jpg" '
        'media="(min-width:781px)">\n'
        '<link rel="preload" fetchpriority="high" as="image" href="/assets/images/catalog-hero-900.jpg" '
        'media="(max-width:780px)">\n</head>',
        1,
    )

    # amp-версии у каталога нет
    head = re.sub(r'\s*<link rel="amphtml"[^>]*/?>', "", head, count=1)
    head = head.replace('data-template="allproducts"', 'data-template="catalog"')
    head = head.replace(
        "</head>",
        f'<link rel="stylesheet" href="{asset("/assets/css/catalog.css")}">\n</head>',
        1,
    )
    return head


def build(lang: str) -> None:
    words = TEXT[lang]
    with open(os.path.join(ROOT, "tools", f"catalog-data.{lang}.json"), encoding="utf-8") as fh:
        categories = json.load(fh)["categories"]

    shell = read(words["source"])
    head_end = shell.find(SHELL_SPLIT_HEAD)
    foot_start = shell.find(SHELL_SPLIT_FOOT)
    if head_end < 0 or foot_start < 0:
        sys.exit(f"[{lang}] не найдены границы шаблона в {words['source']}")

    head = patch_head(shell[:head_end], words)
    foot = shell[foot_start:].replace(
        "</body>",
        f'<script src="{asset("/assets/js/catalog.js")}" defer></script>\n</body>',
        1,
    )

    summary = totals(categories, lang)
    body = "\n".join([
        f'<main class="dzc" data-dzc-catalog data-dzc-total="{summary["models"]}">',
        render_breadcrumb(words),
        render_hero(lang, words, summary),
        render_why(words),
        render_tiles(words, categories),
        render_bar(words, categories, summary),
        render_categories(lang, words, categories),
        render_closing(lang, words),
        render_top_button(words),
        "</main>",
        "",
    ])

    with open(os.path.join(ROOT, words["out"]), "w", encoding="utf-8") as fh:
        fh.write(head + body + foot)

    print(f"  [{lang}] {words['out']}: {len(categories)} направлений, {summary['models']} моделей, "
          f"{summary['power']}, {summary['voltage']}")


if __name__ == "__main__":
    for language in sys.argv[1:] or ["ru", "en"]:
        build(language)
