#!/usr/bin/env python3
"""Привести фотографии категорий к одному виду для страницы каталога.

Снимки в карточках сняты в разных условиях: часть на белом фоне, часть на
сером градиенте, размеры и поля у всех разные. Скрипт заливает фон одним
цветом, обрезает по границам изделия и вписывает его в общий холст, чтобы в
каталоге все фотографии выглядели из одного комплекта.

Результат складывается в assets/images/catalog/ и коммитится, поэтому
для обычной пересборки каталога скрипт не нужен — только когда меняются
сами фотографии.

Нужен Pillow:
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python tools/prepare_images.py
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
import urllib.request
from collections import deque

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("нужен Pillow: python3 -m pip install Pillow")

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dzmotortech.ru')
OUT_DIR = os.path.join(ROOT, "assets", "images", "catalog")

BACKGROUND = (255, 255, 255)
CANVAS = (900, 675)          # 4:3 — под ширину блока с запасом на ретину
CANVAS_SMALL = (450, 338)    # для плиток микропанели
SUBJECT_FILL = 0.9           # доля холста, которую занимает изделие

# Допуски подобраны так, чтобы заливка шла по плавному градиенту фона, но не
# перетекала в светлые детали изделия (например, в металлорукав на YDTG).
STEP_TOLERANCE = 8           # насколько сосед может отличаться от текущей точки
SEED_TOLERANCE = 45          # общий разбег от цвета угла

# Для некоторых категорий фотография первого товара получилась мелкой или
# нехарактерной — здесь можно указать другую.
IMAGE_OVERRIDES = {
    # Первым в категории идёт драйвер — для обложки берём сам серводвигатель.
    "245137": "https://images.51microshop.com/18628/product/20250909/__1757402628319_0.png",
}


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(request, timeout=30).read()


def background_mask(image: Image.Image) -> Image.Image:
    """Заливка от краёв: помечает фон, следуя за плавным градиентом."""
    width, height = image.size
    pixels = image.load()
    mask = Image.new("L", (width, height), 0)
    mask_pixels = mask.load()

    seeds = [(x, 0) for x in range(width)] + [(x, height - 1) for x in range(width)]
    seeds += [(0, y) for y in range(height)] + [(width - 1, y) for y in range(height)]

    seed_colors = [pixels[x, y] for x, y in seeds[: 2 * width]]
    seed_avg = tuple(sum(c[i] for c in seed_colors) // len(seed_colors) for i in range(3))

    queue = deque()
    for x, y in seeds:
        if mask_pixels[x, y] == 0:
            mask_pixels[x, y] = 255
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        here = pixels[x, y]
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < width and 0 <= ny < height) or mask_pixels[nx, ny]:
                continue
            there = pixels[nx, ny]
            step = max(abs(there[i] - here[i]) for i in range(3))
            drift = max(abs(there[i] - seed_avg[i]) for i in range(3))
            if step <= STEP_TOLERANCE and drift <= SEED_TOLERANCE:
                mask_pixels[nx, ny] = 255
                queue.append((nx, ny))

    return mask


def normalise(raw: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(raw))
    if image.mode == "RGBA":
        flat = Image.new("RGB", image.size, BACKGROUND)
        flat.paste(image, mask=image.split()[3])
        image = flat
    else:
        image = image.convert("RGB")

    mask = background_mask(image)
    soft = mask.filter(ImageFilter.GaussianBlur(1.2))
    plate = Image.new("RGB", image.size, BACKGROUND)
    cleaned = Image.composite(plate, image, soft)

    # Границы изделия — по непокрашенной части маски.
    subject = mask.point(lambda v: 0 if v > 128 else 255)
    box = subject.getbbox()
    if box:
        cleaned = cleaned.crop(box)

    return cleaned


def fit(image: Image.Image, canvas: tuple[int, int]) -> Image.Image:
    target_w = int(canvas[0] * SUBJECT_FILL)
    target_h = int(canvas[1] * SUBJECT_FILL)
    scale = min(target_w / image.width, target_h / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    scaled = image.resize(size, Image.LANCZOS)

    plate = Image.new("RGB", canvas, BACKGROUND)
    plate.paste(scaled, ((canvas[0] - size[0]) // 2, (canvas[1] - size[1]) // 2))
    return plate


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(ROOT, "tools", "catalog-data.ru.json"), encoding="utf-8") as fh:
        categories = json.load(fh)["categories"]

    for category in categories:
        source = IMAGE_OVERRIDES.get(category["id"]) or re.sub(r"_w\d+\.jpg$", "", category["image"])
        try:
            raw = download(source)
        except Exception as error:  # noqa: BLE001 — сеть, показываем и идём дальше
            print(f"  ! {category['title'][:32]}: {error}")
            continue

        cleaned = normalise(raw)
        big = fit(cleaned, CANVAS)
        small = fit(cleaned, CANVAS_SMALL)

        big_path = os.path.join(OUT_DIR, f"c{category['id']}.jpg")
        small_path = os.path.join(OUT_DIR, f"c{category['id']}-sm.jpg")
        big.save(big_path, "JPEG", quality=88, optimize=True, progressive=True)
        small.save(small_path, "JPEG", quality=86, optimize=True, progressive=True)

        print(f"  {category['title'][:34]:36s} {os.path.getsize(big_path)//1024:3d} КБ + "
              f"{os.path.getsize(small_path)//1024:2d} КБ")


if __name__ == "__main__":
    main()
