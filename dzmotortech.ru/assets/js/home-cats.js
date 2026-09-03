/* Блок «Категории продукции» на главной: слева список категорий, справа —
   панель с фото и моделями. Панель меняется при наведении на категорию и при
   переводе на неё фокуса с клавиатуры.

   Разметка рассчитана на работу без скрипта: панели лежат в HTML открытым
   списком, класс is-enhanced (его ставит этот файл) прячет неактивные. Так
   содержимое остаётся доступным, если скрипт не загрузился.

   Названия категорий — обычные ссылки на разделы каталога. На тач-экранах
   наведения нет, поэтому первый тап по неактивной категории только открывает
   её панель, а переход по ссылке происходит вторым тапом — как в выпадающих
   меню. На десктопе категория под курсором уже активна, так что первый же
   клик ведёт в раздел. */
(function () {
  'use strict';

  var HOVER_DELAY = 60; // мс — чтобы панель не мигала, когда курсор идёт по списку

  function init() {
    var blocks = document.querySelectorAll('[data-dzh-cats]');

    Array.prototype.forEach.call(blocks, function (block) {
      var links = Array.prototype.slice.call(block.querySelectorAll('[data-dzh-cat]'));
      var panels = Array.prototype.slice.call(block.querySelectorAll('[data-dzh-panel]'));
      if (!links.length || !panels.length) return;

      var hoverTimer = null;
      var current = null;

      function activate(id) {
        if (id === current) return;
        current = id;

        links.forEach(function (link) {
          var on = link.getAttribute('data-dzh-cat') === id;
          link.classList.toggle('is-active', on);
          link.setAttribute('aria-current', on ? 'true' : 'false');
        });

        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-dzh-panel') !== id;
        });
      }

      links.forEach(function (link) {
        var id = link.getAttribute('data-dzh-cat');

        link.addEventListener('pointerenter', function () {
          window.clearTimeout(hoverTimer);
          hoverTimer = window.setTimeout(function () { activate(id); }, HOVER_DELAY);
        });

        link.addEventListener('pointerleave', function () {
          window.clearTimeout(hoverTimer);
        });

        link.addEventListener('focus', function () { activate(id); });

        link.addEventListener('click', function (event) {
          if (current !== id) {
            event.preventDefault();
            activate(id);
          }
        });
      });

      block.classList.add('is-enhanced');
      activate(links[0].getAttribute('data-dzh-cat'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
