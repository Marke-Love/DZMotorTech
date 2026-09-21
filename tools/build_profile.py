#!/usr/bin/env python3
"""Пересобрать страницу «Профиль компании» на новом оформлении.

Тексты берутся из самой страницы — заголовки и абзацы переносятся дословно,
скрипт лишь раскладывает их по новой структуре: первый экран, аккордеон с
фотографиями, развёрнутые разделы, география и блок с призывом.

Исходник (старую версию) скрипт ищет в git, поэтому запускать можно повторно:

    python3 tools/build_profile.py --dry-run
    python3 tools/build_profile.py
"""
from __future__ import annotations

import html
import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
PAGE = os.path.join("pages", "Профиль-компании-11932326.html")
SOURCE_COMMIT = "HEAD"

SHELL_SPLIT_HEAD = '<section class="section">'
SHELL_SPLIT_FOOT = '<footer class="footer" id="footer">'

# Короткие подписи для аккордеона: заголовок раздела и одна фраза из него же.
PANELS = [
    ("intro", "Поставка и интеграция",
     "Дистрибуция двигателей и разработка инженерных решений: мотор, преобразователь частоты и ПО как единый комплекс."),
    ("team", "Опыт и команда",
     "Коллектив с 10-летним опытом — от выбора оборудования до настройки алгоритмов управления."),
    ("motors_range", "Диапазоны мощности",
     "Асинхронные двигатели 450–1000 кВт, питание 380–690 В, 50/60 Гц. Иные диапазоны — под задачу."),
    ("integration", "Интегрированный подход",
     "Двигатель и ПЧ согласуются по электрическим и функциональным параметрам, ПО задаёт режимы работы."),
    ("vfd_brands", "Преобразователи частоты",
     "ABB, Danfoss, Siemens, Veichi (VEDA) — с фильтрами гармоник и без, по требованию проекта."),
    ("software", "Программное обеспечение",
     "Собственные алгоритмы управления ПЧ: режимы, параметры и последовательности под конкретный сценарий."),
    ("projects", "Проекты и география",
     "Более 10 реализованных проектов в Европе, Азии, на Ближнем Востоке, в России и Африке."),
    ("offer", "Что мы предлагаем",
     "Законченная система привода: подбор двигателя и ПЧ, их согласование и программа управления."),
]

FACTS = [
    ("10 лет", "практического опыта команды"),
    ("10+", "проектов в разных странах"),
    ("450–1000 кВт", "мощности в реализованных проектах"),
    ("380–690 В", "сеть 50/60 Гц"),
]



def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def original_page() -> str:
    """Старую версию берём из git — так пересборка не зависит от того,
    что сейчас лежит в рабочем каталоге."""
    result = subprocess.run(
        ["git", "show", f"{SOURCE_COMMIT}:dzmotortech.ru/{PAGE}"],
        cwd=os.path.dirname(ROOT), capture_output=True, text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout
    with open(os.path.join(ROOT, PAGE), encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def sections(page: str) -> list[tuple[str, list[str], list[str]]]:
    """Разделы исходной страницы: заголовок, абзацы и пункты списка."""
    start = page.find(SHELL_SPLIT_HEAD)
    end = page.find(SHELL_SPLIT_FOOT)
    body = page[start:end]

    chunks = re.split(r"<h2[^>]*>(.*?)</h2>", body, flags=re.S)[1:]
    result = []
    for i in range(0, len(chunks) - 1, 2):
        title = clean(chunks[i])
        rest = chunks[i + 1]
        # Абзацы: текст платформы завёрнут в <p class="bodytext"> с вложенными div.
        paragraphs = []
        for raw in re.findall(r'<p class="bodytext">(.*?)</p>', rest, re.S):
            for piece in re.split(r"</div>\s*<div", raw):
                text = clean(piece)
                if len(text) > 40:
                    paragraphs.append(text)
        bullets = [clean(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", rest, re.S)]
        bullets = [b for b in bullets if 10 < len(b) < 400]
        if title and (paragraphs or bullets):
            result.append((title, paragraphs, bullets))
    return result


def render(page: str) -> str:
    data = sections(page)

    facts = "".join(f"<li><b>{esc(v)}</b><span>{esc(c)}</span></li>" for v, c in FACTS)

    panels = "".join(
        f"""
          <article class="dzc-p-acc__item{' is-active' if i == 0 else ''}" data-dzc-acc-item
                   data-dzc-acc-target="profile-{i + 1}"
                   role="button" tabindex="0" aria-expanded="{'true' if i == 0 else 'false'}"
                   aria-controls="profile-{i + 1}">
            <img src="/assets/images/profile/{slug}.jpg" alt="{esc(title)}" loading="lazy">
            <p class="dzc-p-acc__label">{esc(title)}</p>
            <div class="dzc-p-acc__body">
              <span class="dzc-p-acc__index">{i + 1:02d} / {len(PANELS):02d}</span>
              <h3 class="dzc-p-acc__title">{esc(title)}</h3>
              <p class="dzc-p-acc__text">{esc(text)}</p>
              <span class="dzc-p-acc__more">
                Подробнее
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>
                </svg>
              </span>
            </div>
          </article>"""
        for i, (slug, title, text) in enumerate(PANELS)
    )

    blocks = []
    for i, (title, paragraphs, bullets) in enumerate(data, start=1):
        text = "".join(f'<p class="dzc-p-block__text">{esc(p)}</p>' for p in paragraphs)
        if bullets:
            text += '<ul class="dzc-p-block__list">' + "".join(f"<li>{esc(b)}</li>" for b in bullets) + "</ul>"
        slug = PANELS[min(i - 1, len(PANELS) - 1)][0]
        flip = " dzc-p-block--flip" if i % 2 == 0 else ""
        if slug == "projects":
            flip = " dzc-p-block--wide"
        blocks.append(f"""
        <div class="dzc-p-block{flip}" id="profile-{i}">
          <div class="dzc-p-block__body">
            <h3 class="dzc-p-block__title">{esc(title)}</h3>
            {text}
          </div>
          <div class="dzc-p-block__media">
            <img src="/assets/images/profile/{slug}.jpg" alt="{esc(title)}" loading="lazy">
          </div>
        </div>""")

    return f"""
<main class="dzc-p">
  <div class="dzc-p__shell" style="padding-top:16px;">
    <ol class="breadcrumb hidden-xs" itemscope itemtype="http://schema.org/BreadcrumbList"
        style="background:none;padding-left:0;margin-bottom:0;">
      <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a itemprop="item" href="../index.html"><span itemprop="name">Главная</span></a>
        <meta itemprop="position" content="1"/>
      </li>
      <li class="active" itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span itemprop="name">Профиль компании</span><meta itemprop="position" content="2"/>
      </li>
    </ol>
  </div>

  <section class="dzc-p-hero">
    <div class="dzc-p-hero__media"></div>
    <div class="dzc-p-hero__scrim"></div>
    <div class="dzc-p__shell">
      <div class="dzc-p-hero__inner">
        <h1 class="dzc-p__display dzc-p-hero__title">Электродвигатели<br>и инженерные решения</h1>
        <p class="dzc-p-hero__lede">
          Мы сочетаем дистрибуцию электродвигателей и разработку инженерных решений: собираем
          законченный комплекс из мотора, преобразователя частоты и программного обеспечения —
          и отвечаем за то, чтобы они работали как единая система.
        </p>
        <ul class="dzc-p-facts">{facts}</ul>
      </div>
    </div>
  </section>

  <section class="dzc-p-section">
    <div class="dzc-p__shell">
      <div class="dzc-p-section__head">
        <h2 class="dzc-p__display dzc-p-section__title">Чем мы занимаемся</h2>
        <p class="dzc-p-section__lede">Наведите на кадр — раздел раскроется.</p>
      </div>
      <div class="dzc-p-acc" data-dzc-acc>{panels}
      </div>
    </div>
  </section>

  <section class="dzc-p-section" style="padding-top:0;">
    <div class="dzc-p__shell">
      <div class="dzc-p-section__head">
        <h2 class="dzc-p__display dzc-p-section__title">Подробно о компании</h2>
      </div>{''.join(blocks)}
    </div>
  </section>

  <div class="dzc-p__shell">
    <section class="dzc-p-cta">
      <div>
        <h2 class="dzc-p-cta__title">Нужен привод под конкретную задачу?</h2>
        <p class="dzc-p-cta__text">
          Подберём двигатель и преобразователь частоты, согласуем их между собой и напишем
          программу управления под ваши режимы работы.
        </p>
      </div>
      <a class="dzc-p-btn" href="contactus.html">Связаться с нами</a>
    </section>
  </div>
</main>
"""


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    source = original_page()

    head_end = source.find(SHELL_SPLIT_HEAD)
    foot_start = source.find(SHELL_SPLIT_FOOT)
    if head_end < 0 or foot_start < 0:
        sys.exit("не найдены границы шаблона страницы")

    css_stamp = int(os.path.getmtime(os.path.join(ROOT, "assets", "css", "profile.css")))
    js_stamp = int(os.path.getmtime(os.path.join(ROOT, "assets", "js", "profile.js")))

    head = source[:head_end]
    if "assets/css/profile.css" not in head:
        head = head.replace("</head>", f'<link rel="stylesheet" href="/assets/css/profile.css?v={css_stamp}">\n</head>', 1)
    else:
        head = re.sub(r"(/assets/css/profile\.css)(\?v=\d+)?", lambda m: f"{m.group(1)}?v={css_stamp}", head)

    foot = source[foot_start:]
    tag = f'<script src="/assets/js/profile.js?v={js_stamp}" defer></script>'
    if "assets/js/profile.js" in foot:
        foot = re.sub(r'<script src="/assets/js/profile\.js(?:\?v=\d+)?" defer></script>', tag, foot)
    else:
        foot = foot.replace("</body>", tag + "\n</body>", 1)

    result = head + render(source) + foot
    parsed = sections(source)

    if not dry_run:
        with open(os.path.join(ROOT, PAGE), "w", encoding="utf-8") as fh:
            fh.write(result)

    verb = "будет собрано" if dry_run else "собрано"
    print(f"{verb}: разделов {len(parsed)}, панелей {len(PANELS)}, размер {len(result) // 1024} КБ")
    for title, paragraphs, bullets in parsed:
        print(f"   {title[:52]:54s} абзацев {len(paragraphs)}, пунктов {len(bullets)}")


if __name__ == "__main__":
    main()
