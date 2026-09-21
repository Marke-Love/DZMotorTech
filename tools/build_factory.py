#!/usr/bin/env python3
"""Пересобрать страницу «Презентация завода» (Подразделения компании).

Семь цехов, у каждого своё видео. Вместо семи плееров на странице — один:
цех выбирается в списке слева, ролик подгружается только по нажатию.
Тексты цехов переносятся из исходной страницы дословно, постеры нарезаны
из самих видео (tools/, ffmpeg).

    python3 tools/build_factory.py --dry-run
    python3 tools/build_factory.py
"""
from __future__ import annotations

import html
import json
import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
PAGE = os.path.join("pages", "Подразделения-компании-11932328.html")
SOURCE_COMMIT = "HEAD"

SHELL_SPLIT_HEAD = '<section class="section">'
SHELL_SPLIT_FOOT = '<footer class="footer" id="footer">'

# Цех → ролик, постер и короткие цифры из его же описания.
SHOPS = [
    ("Цех намотки проводов", "winding", "wire-embedding-workshop",
     ["16 млн $ инвестиций", "20 автоматических линий", "1200 единиц в сутки"]),
    ("Цех нанесения покрытия", "coating", "immersion-paint-workshop",
     ["4 млн $ инвестиций", "26 единиц оборудования"]),
    ("Цех точного механического обработки", "machining", "precision-machining-workshop",
     ["31 500 м² площади", "200 единиц оборудования"]),
    ("Склад хранения кремнистой стали", "storage", "storage-capacity",
     ["Запас сырья на 6+ месяцев"]),
    ("Цех сборки", "assembly", "assembly-line",
     ["24 сборочные линии", "3000 единиц в сутки", "1 млн единиц в год"]),
    ("Цех динамического балансирования", "balancing", "dynamic-balance-test-workshop",
     ["Векторный анализ вибрации"]),
    ("Цех кремнистой стали", "silicon", "silicon-steel-sheet-workshop",
     ["60 штамповочных машин", "12 крупных прессов"]),
]

FACTS = [
    ("1958", "год основания завода"),
    ("330 млн $", "зарегистрированный капитал"),
    ("2 млн м²", "площадь производства"),
    ("2000", "сотрудников, 68% — технические"),
]

CLOSING_HEADING = "Надежный производитель электродвигателей"


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def original_page() -> str:
    result = subprocess.run(
        ["git", "show", f"{SOURCE_COMMIT}:dzmotortech.ru/{PAGE}"],
        cwd=os.path.dirname(ROOT), capture_output=True, text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout
    with open(os.path.join(ROOT, PAGE), encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def page_text(page: str) -> str:
    start = page.find(SHELL_SPLIT_HEAD)
    end = page.find(SHELL_SPLIT_FOOT)
    body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", page[start:end], flags=re.S)
    return clean(body)


def split_paragraphs(text: str) -> list[str]:
    """Сплошной текст раздела режем на абзацы по границам предложений,
    чтобы не выводить простыню в один блок."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    paragraphs, current = [], ""
    for sentence in sentences:
        current = (current + " " + sentence).strip()
        if len(current) > 260:
            paragraphs.append(current)
            current = ""
    if current:
        paragraphs.append(current)
    return paragraphs


def sections(page: str) -> dict[str, str]:
    text = page_text(page)
    titles = [title for title, *_ in SHOPS] + [CLOSING_HEADING]
    result = {}
    for i, title in enumerate(titles):
        start = text.find(title)
        if start < 0:
            continue
        start += len(title)
        end = text.find(titles[i + 1]) if i + 1 < len(titles) else len(text)
        result[title] = text[start:end].strip()
    return result


def render(page: str) -> str:
    data = sections(page)

    facts = "".join(f"<li><b>{esc(v)}</b><span>{esc(c)}</span></li>" for v, c in FACTS)

    buttons = []
    for i, (title, slug, video, chips) in enumerate(SHOPS, start=1):
        payload = {
            "title": title,
            "poster": f"/assets/images/factory/{slug}.jpg",
            "video": f"/video/{video}.mp4",
            "text": split_paragraphs(data.get(title, "")),
            "chips": chips,
        }
        buttons.append(f"""
          <li>
            <button class="dzf-tour__btn" type="button" role="tab" aria-selected="false"
                    data-dzf-shop='{html.escape(json.dumps(payload, ensure_ascii=False), quote=True)}'>
              <span class="dzf-tour__num">{i:02d}</span>
              <span class="dzf-tour__name">{esc(title)}</span>
              <span class="dzf-tour__meta">{esc(chips[0])}</span>
            </button>
          </li>""")

    closing = data.get(CLOSING_HEADING, "")
    closing_paragraphs = "".join(
        f'<p class="dzf-about__text">{esc(p)}</p>' for p in split_paragraphs(closing)
    )

    return f"""
<main class="dzf">
  <div class="dzf__shell" style="padding-top:16px;">
    <ol class="breadcrumb hidden-xs" itemscope itemtype="http://schema.org/BreadcrumbList"
        style="background:none;padding-left:0;margin-bottom:0;">
      <li itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <a itemprop="item" href="../index.html"><span itemprop="name">Главная</span></a>
        <meta itemprop="position" content="1"/>
      </li>
      <li class="active" itemprop="itemListElement" itemscope itemtype="http://schema.org/ListItem">
        <span itemprop="name">Презентация завода</span><meta itemprop="position" content="2"/>
      </li>
    </ol>
  </div>

  <section class="dzf-hero">
    <div class="dzf-hero__media"></div>
    <div class="dzf-hero__scrim"></div>
    <div class="dzf__shell">
      <div class="dzf-hero__inner">
        <h1 class="dzf__display dzf-hero__title">Подразделения компании</h1>
        <p class="dzf-hero__lede">
          Семь цехов полного цикла — от штамповки кремнистой стали и намотки обмоток
          до сборки и динамической балансировки. Каждый цех можно посмотреть на видео.
        </p>
        <ul class="dzf-facts">{facts}</ul>
      </div>
    </div>
  </section>

  <section class="dzf-section">
    <div class="dzf__shell">
      <div class="dzf-section__head">
        <h2 class="dzf__display dzf-section__title">Экскурсия по цехам</h2>
        <p class="dzf-section__lede">Выберите цех — ролик и описание откроются справа.</p>
      </div>

      <div class="dzf-tour" data-dzf-tour>
        <ul class="dzf-tour__list" role="tablist">{''.join(buttons)}
        </ul>

        <div>
          <div class="dzf-player" data-dzf-player>
            <img class="dzf-player__poster" data-dzf-poster src="/assets/images/factory/winding.jpg" alt="">
            <video class="dzf-player__video" data-dzf-video controls preload="none" playsinline></video>
            <button class="dzf-player__play" type="button" data-dzf-play aria-label="Смотреть видео цеха">
              <span>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </span>
            </button>
          </div>

          <div class="dzf-shop">
            <h3 class="dzf-shop__title" data-dzf-title></h3>
            <div data-dzf-text></div>
            <ul class="dzf-shop__chips" data-dzf-chips></ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="dzf-section" style="padding-top:0;">
    <div class="dzf__shell">
      <div class="dzf-about">
        <div class="dzf-about__media"></div>
        <div class="dzf-about__scrim"></div>
        <div class="dzf-about__inner">
          <h2 class="dzf-about__title">{esc(CLOSING_HEADING)}</h2>
          {closing_paragraphs}
        </div>
      </div>
    </div>
  </section>

  <div class="dzf__shell">
    <section class="dzf-cta">
      <div>
        <h2 class="dzf-cta__title">Нужен двигатель под ваши условия?</h2>
        <p class="dzf-cta__text">
          Подберём исполнение под задачу и условия эксплуатации — от общепромышленных
          серий до взрывозащищённых и специальных машин.
        </p>
      </div>
      <a class="dzf-btn" href="contactus.html">Связаться с нами</a>
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

    css_stamp = int(os.path.getmtime(os.path.join(ROOT, "assets", "css", "factory.css")))
    js_stamp = int(os.path.getmtime(os.path.join(ROOT, "assets", "js", "factory.js")))

    head = source[:head_end]
    if "assets/css/factory.css" not in head:
        head = head.replace("</head>", f'<link rel="stylesheet" href="/assets/css/factory.css?v={css_stamp}">\n</head>', 1)
    else:
        head = re.sub(r"(/assets/css/factory\.css)(\?v=\d+)?", lambda m: f"{m.group(1)}?v={css_stamp}", head)

    foot = source[foot_start:]
    tag = f'<script src="/assets/js/factory.js?v={js_stamp}" defer></script>'
    if "assets/js/factory.js" in foot:
        foot = re.sub(r'<script src="/assets/js/factory\.js(?:\?v=\d+)?" defer></script>', tag, foot)
    else:
        foot = foot.replace("</body>", tag + "\n</body>", 1)

    result = head + render(source) + foot
    parsed = sections(source)

    if not dry_run:
        with open(os.path.join(ROOT, PAGE), "w", encoding="utf-8") as fh:
            fh.write(result)

    verb = "будет собрано" if dry_run else "собрано"
    print(f"{verb}: цехов {len(SHOPS)}, размер {len(result) // 1024} КБ")
    for title, *_ in SHOPS:
        text = parsed.get(title, "")
        print(f"   {title[:38]:40s} {len(text):5d} симв., абзацев {len(split_paragraphs(text))}")
    print(f"   {CLOSING_HEADING[:38]:40s} {len(parsed.get(CLOSING_HEADING, '')):5d} симв.")


if __name__ == "__main__":
    main()
