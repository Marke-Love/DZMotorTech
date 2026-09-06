/* Страница «Области применения».

   Три задачи: подсветить в рельсе ту отрасль, которую сейчас читают;
   показать стопку объектов и коннектор «условия → серии», когда блок
   доходит до экрана; открыть кадр на весь экран. Список кадров лежит
   в JSON рядом с разметкой — подписи в стопке и в окне просмотра берутся
   из одного источника, пролистывание идёт сквозь все отрасли подряд. */
(function () {
  'use strict';

  /* --- рельс и появление блоков ------------------------------------------ */

  function initScene() {
    var root = document.querySelector('.dzu');
    var fields = Array.prototype.slice.call(document.querySelectorAll('[data-dzu-field]'));
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-dzu-rail]'));
    if (!root || !fields.length) return;

    /* Анимацию включаем только отсюда: если скрипт не отработал,
       карточки и коннектор остаются видимыми. */
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('dzu--anim');
    }

    if (!('IntersectionObserver' in window)) {
      fields.forEach(function (field) { field.classList.add('is-in'); });
      return;
    }


    function showAll() {
      fields.forEach(function (field) { field.classList.add('is-in'); });
    }

    /* Появление: блок засчитывается, когда в кадр вошла его четверть. */
    var seen = false;
    var reveal = new IntersectionObserver(function (entries) {
      seen = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.12 });

    fields.forEach(function (field) { reveal.observe(field); });

    /* То, что уже на экране, показываем сразу, не дожидаясь наблюдателя. */
    fields.forEach(function (field) {
      var rect = field.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) field.classList.add('is-in');
    });

    /* Страховка: в фоновой вкладке наблюдатель молчит, и если по какой-то
       причине он так и не отработает, страница осталась бы пустой. */
    window.setTimeout(function () { if (!seen) showAll(); }, 1500);

    if (!links.length) return;

    function mark(index) {
      links.forEach(function (link, i) {
        if (i === index) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    /* Активной считаем отрасль, чей блок пересекает верхнюю треть экрана:
       полоса узкая, поэтому в ней всегда ровно один блок. */
    var visible = {};
    var current = -1;
    var track = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.getAttribute('data-dzu-field')] = entry.isIntersecting;
      });
      for (var i = 0; i < fields.length; i++) {
        if (visible[String(i)] && i !== current) { current = i; mark(i); return; }
      }
    }, { rootMargin: '-18% 0px -68% 0px' });

    fields.forEach(function (field) { track.observe(field); });
    mark(0);
  }

  /* --- коннектор «условия → серии» ---------------------------------------- */

  /* Дуги должны выходить из центров карточек условий, а их число и ширина
     зависят от вёрстки. Поэтому пути пересчитываем по факту: берём центры
     карточек и переводим их в проценты ширины коннектора. Если карточки
     перенеслись на второй ряд, коннектор прячем — врать линиями нельзя. */
  function drawWires() {
    Array.prototype.slice.call(document.querySelectorAll('.dzu-map')).forEach(function (map) {
      var wire = map.querySelector('.dzu-map__wire');
      var svg = wire && wire.querySelector('svg');
      var items = Array.prototype.slice.call(map.querySelectorAll('.dzu-cond > li'));
      if (!svg || !items.length) return;

      wire.hidden = false;
      var box = wire.getBoundingClientRect();
      if (!box.width) return;

      var top = null;
      var oneRow = true;
      var xs = items.map(function (item) {
        var rect = item.getBoundingClientRect();
        if (top === null) top = rect.top;
        else if (Math.abs(rect.top - top) > 2) oneRow = false;
        return (rect.left + rect.width / 2 - box.left) / box.width * 100;
      });

      if (!oneRow) { wire.hidden = true; return; }

      svg.innerHTML = xs.map(function (x) {
        var v = x.toFixed(2);
        return '<path d="M' + v + ' 0 V12 Q' + v + ' 26 50 26 V40" pathLength="1"/>';
      }).join('');
    });
  }

  function watchWires() {
    drawWires();

    /* ResizeObserver ловит любое изменение ширины списка — и поворот экрана,
       и подгрузку веб-шрифтов, которая меняет высоту карточек. */
    if ('ResizeObserver' in window) {
      var timer = null;
      var observer = new ResizeObserver(function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(drawWires, 80);
      });
      Array.prototype.slice.call(document.querySelectorAll('.dzu-cond')).forEach(function (list) {
        observer.observe(list);
      });
      return;
    }

    var fallback = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(fallback);
      fallback = window.setTimeout(drawWires, 150);
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(drawWires);
    }
  }

  /* --- просмотр кадра на весь экран --------------------------------------- */

  function initLightbox() {
    var box = document.querySelector('[data-dzu-lb]');
    var data = document.querySelector('[data-dzu-data]');
    if (!box || !data) return;

    var shots;
    try {
      shots = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }
    if (!shots.length) return;

    var image = box.querySelector('[data-dzu-image]');
    var titleEl = box.querySelector('[data-dzu-lb-title]');
    var metaEl = box.querySelector('[data-dzu-lb-meta]');
    var countEl = box.querySelector('[data-dzu-count]');
    var closeButton = box.querySelector('[data-dzu-close]');
    var current = 0;
    var opener = null;

    function show(index) {
      var shot = shots[index];
      if (!shot) return;
      current = index;
      image.src = shot.src;
      image.alt = shot.name;
      titleEl.textContent = shot.name;
      metaEl.textContent = shot.field;
      countEl.textContent = (index + 1) + ' / ' + shots.length;
    }

    function step(delta) {
      show((current + delta + shots.length) % shots.length);
    }

    function open(index, trigger) {
      opener = trigger || null;
      show(index);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      image.removeAttribute('src');
      if (opener) opener.focus();
      opener = null;
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-dzu-open]')).forEach(function (button) {
      button.addEventListener('click', function () {
        open(parseInt(button.getAttribute('data-dzu-open'), 10), button);
      });
    });

    closeButton.addEventListener('click', close);
    box.querySelector('[data-dzu-prev]').addEventListener('click', function () { step(-1); });
    box.querySelector('[data-dzu-next]').addEventListener('click', function () { step(1); });

    /* Клик мимо кадра закрывает окно, по самому кадру — нет. */
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.classList.contains('dzu-lb__stage')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });
  }

  function init() {
    initScene();
    watchWires();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
