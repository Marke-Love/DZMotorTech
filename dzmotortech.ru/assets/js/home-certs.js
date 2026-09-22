/* Лента документов в блоке «Сертификаты» на главной.

   Прокрутка нативная — свайп, колесо и клавиатура работают сами по себе,
   стрелки лишь надстройка. Поэтому в разметке они спрятаны атрибутом hidden:
   скрипт показывает их только там, где лента не помещается. Без скрипта блок
   остаётся рабочим — просто листается пальцем и без зацикливания.

   Бесконечность сделана клонами: скрипт дублирует набор карточек до и после
   оригинала и ставит прокрутку на середину. Когда пользователь уходит от
   середины дальше чем на полнабора, позиция мгновенно сдвигается на ширину
   набора — под курсором ровно такие же карточки, поэтому подмена незаметна,
   а лента кажется бесконечной в обе стороны. */
(function () {
  'use strict';

  var SETTLE = 140; // мс тишины после прокрутки, чтобы не рвать плавную анимацию

  function init() {
    var strips = document.querySelectorAll('[data-dzh-certs]');

    Array.prototype.forEach.call(strips, function (strip) {
      var track = strip.querySelector('[data-dzh-track]');
      var nav = strip.querySelector('[data-dzh-nav]');
      var prev = strip.querySelector('[data-dzh-prev]');
      var next = strip.querySelector('[data-dzh-next]');
      if (!track || !nav || !prev || !next) return;

      var originals = Array.prototype.slice.call(track.children);
      if (!originals.length) return;

      var looping = false;
      var setWidth = 0;
      var settleTimer = null;

      function overflows() {
        return track.scrollWidth - track.clientWidth > 4;
      }

      /* Клоны не должны попадать в озвучку скринридера и в поиск по странице —
         это те же самые документы, что и в оригинальном наборе. */
      function cloneSet() {
        var fragment = document.createDocumentFragment();
        originals.forEach(function (card) {
          var copy = card.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          /* ...и не должны получать фокус с клавиатуры: ссылки внутри копий
             скрыты от скринридера, а Tab на них попадал бы «в пустоту». */
          copy.setAttribute('inert', '');
          copy.querySelectorAll('a, button, [tabindex]').forEach(function (el) {
            el.setAttribute('tabindex', '-1');
          });
          fragment.appendChild(copy);
        });
        return fragment;
      }

      function enableLoop() {
        if (looping) return;
        track.insertBefore(cloneSet(), track.firstChild);
        track.appendChild(cloneSet());
        looping = true;
        measure();
        jumpTo(setWidth);
      }

      function measure() {
        setWidth = looping ? track.scrollWidth / 3 : track.scrollWidth;
      }

      /* Мгновенный сдвиг: плавность на время подмены выключаем, иначе браузер
         покажет «перемотку» через всю ленту. */
      function jumpTo(position) {
        var behavior = track.style.scrollBehavior;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = position;
        track.style.scrollBehavior = behavior;
      }

      /* Пока лента гуляет вокруг середины, ничего не трогаем. А если ушла
         дальше полунабора — приводим позицию по модулю в средний набор: одним
         вычитанием не обойтись, за раз можно улететь сразу на несколько
         наборов (быстрый флик, колесо, переход по якорю). */
      function normalize() {
        if (!looping || !setWidth) return;
        var position = track.scrollLeft;
        if (position >= setWidth * 0.5 && position <= setWidth * 1.5) return;
        var wrapped = ((position - setWidth) % setWidth + setWidth) % setWidth + setWidth;
        if (Math.abs(wrapped - position) > 1) jumpTo(wrapped);
      }

      function update() {
        var scrollable = overflows();
        nav.hidden = !scrollable;
        if (scrollable && !looping) enableLoop();
        /* По кругу листать можно всегда, гасить кнопки незачем; без клонов
           (лента короче экрана) они и так скрыты. */
        prev.disabled = false;
        next.disabled = false;
      }

      function page(direction) {
        track.scrollBy({ left: direction * Math.round(track.clientWidth * 0.9), behavior: 'smooth' });
      }

      prev.addEventListener('click', function () { page(-1); });
      next.addEventListener('click', function () { page(1); });

      /* Подменяем участок только когда прокрутка успокоилась: сдвиг во время
         плавной анимации оборвал бы её на полпути. */
      track.addEventListener('scroll', function () {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(normalize, SETTLE);
      }, { passive: true });

      window.addEventListener('resize', function () {
        measure();
        update();
      }, { passive: true });

      /* Картинки ленивые: пока они не загрузились, ширина ленты ещё меняется. */
      window.addEventListener('load', function () {
        measure();
        update();
      });

      update();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
