/* Навигация в шапке: скользящая подсветка под курсором и мягкое появление
   выпадающих списков вместо мгновенного display:block.

   Скрипт сам помечает меню классом dz-nav-js, и все новые стили действуют
   только при этом классе. Если скрипт не загрузится, меню продолжит работать
   на штатном поведении платформы — ссылки и списки останутся доступны. */
(function () {
  'use strict';

  var CLOSE_DELAY = 140;   // мс — чтобы список не мигал при переходе курсора
  var SHIFT = 14;          // px — сдвиг появляющейся панели по ходу движения

  function init() {
    var bar = document.querySelector('#header .nav_bar');
    var list = bar && bar.querySelector('.nav_first');
    if (!list) return;

    var items = Array.prototype.filter.call(list.children, function (li) {
      return li.querySelector(':scope > a.navigation');
    });
    if (!items.length) return;

    bar.classList.add('dz-nav-js');

    /* --- скользящая подсветка ------------------------------------------ */

    var highlight = document.createElement('span');
    highlight.className = 'dz-nav-hl';
    highlight.setAttribute('aria-hidden', 'true');
    list.appendChild(highlight);

    function moveHighlight(li) {
      if (!li) return hideHighlight();
      var box = li.getBoundingClientRect();
      var host = list.getBoundingClientRect();
      highlight.style.width = box.width + 'px';
      highlight.style.transform = 'translate(' + (box.left - host.left) + 'px, -50%)';
      highlight.classList.add('is-visible');
    }

    function hideHighlight() {
      highlight.classList.remove('is-visible');
    }

    /* --- выпадающие списки ---------------------------------------------- */

    var openItem = null;
    var closeTimer = null;

    function panelOf(li) {
      return li.querySelector(':scope > .nav_children_wrap');
    }

    function open(li) {
      window.clearTimeout(closeTimer);
      if (li === openItem) return;

      var panel = panelOf(li);
      if (!panel) return close();

      // Направление появления — по тому, откуда пришёл курсор.
      var from = openItem ? items.indexOf(openItem) : -1;
      var to = items.indexOf(li);
      var shift = from === -1 ? 0 : (to > from ? SHIFT : -SHIFT);

      close(true);
      panel.style.setProperty('--dz-dx', shift + 'px');
      // Перерисовка, чтобы стартовое смещение успело примениться.
      void panel.offsetWidth;
      li.classList.add('dz-open');
      panel.style.setProperty('--dz-dx', '0px');
      openItem = li;
    }

    function close(immediate) {
      if (!openItem) return;
      openItem.classList.remove('dz-open');
      openItem = null;
      if (immediate) return;
      hideHighlight();
    }

    function scheduleClose() {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(function () {
        close();
        hideHighlight();
      }, CLOSE_DELAY);
    }

    items.forEach(function (li) {
      li.addEventListener('pointerenter', function () {
        window.clearTimeout(closeTimer);
        moveHighlight(li);
        if (panelOf(li) && getComputedStyle(panelOf(li)).display !== 'none') {
          open(li);
        } else {
          close(true);
        }
      });

      li.addEventListener('focusin', function () {
        moveHighlight(li);
        if (panelOf(li)) open(li);
      });
    });

    bar.addEventListener('pointerleave', scheduleClose);

    bar.addEventListener('focusout', function (event) {
      if (!bar.contains(event.relatedTarget)) {
        close();
        hideHighlight();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        close();
        hideHighlight();
      }
    });

    window.addEventListener('resize', function () {
      close(true);
      hideHighlight();
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
