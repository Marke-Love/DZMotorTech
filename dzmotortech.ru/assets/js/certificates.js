/* Страница «Сертификационные документы»: фильтр по типу документа и просмотр
   скана в полноэкранном окне со стрелками. Данные о документах лежат в JSON
   рядом с разметкой — так подписи в карточках и в окне просмотра не расходятся. */
(function () {
  'use strict';

  function init() {
    var grid = document.querySelector('[data-dzs-grid]');
    var box = document.querySelector('[data-dzs-lb]');
    var data = document.querySelector('[data-dzs-data]');
    if (!grid || !box || !data) return;

    var certs;
    try {
      certs = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.dzs-card'));

    /* На английской странице в разметке задан data-dzs-number-label="No.",
       на русской атрибута нет — тогда используется «№» по умолчанию. */
    var numberLabel = box.getAttribute('data-dzs-number-label') || '№';

    /* ---------- фильтр ---------- */

    var filters = Array.prototype.slice.call(document.querySelectorAll('[data-dzs-filter]'));
    var group = 'all';

    function applyFilter(next) {
      group = next;
      filters.forEach(function (button) {
        button.setAttribute('aria-pressed',
          button.getAttribute('data-dzs-filter') === group ? 'true' : 'false');
      });
      cards.forEach(function (card) {
        card.hidden = group !== 'all' && card.getAttribute('data-dzs-group') !== group;
      });
    }

    filters.forEach(function (button) {
      button.addEventListener('click', function () {
        applyFilter(button.getAttribute('data-dzs-filter'));
      });
    });

    /* ---------- полноэкранный просмотр ---------- */

    var image = box.querySelector('[data-dzs-image]');
    var titleEl = box.querySelector('[data-dzs-lb-title]');
    var metaEl = box.querySelector('[data-dzs-lb-meta]');
    var countEl = box.querySelector('[data-dzs-count]');
    var closeButton = box.querySelector('[data-dzs-close]');
    var current = 0;
    var opener = null;

    /* Листаем только внутри выбранного фильтра: иначе стрелка увела бы
       на документ, которого сейчас нет в сетке. */
    function visibleIndexes() {
      var list = [];
      certs.forEach(function (cert, index) {
        if (group === 'all' || cert.group === group) list.push(index);
      });
      return list;
    }

    function show(index) {
      var cert = certs[index];
      if (!cert) return;
      current = index;
      image.src = cert.src;
      image.alt = cert.title;
      titleEl.textContent = cert.title;
      /* Не у всех документов есть орган выдачи и номер (сканы наград
         и патентов), поэтому строку собираем только из того, что есть. */
      var metaParts = [cert.badge, cert.issuer, cert.number ? numberLabel + ' ' + cert.number : null]
        .filter(Boolean);
      metaEl.textContent = metaParts.join(' · ');
      var list = visibleIndexes();
      countEl.textContent = (list.indexOf(index) + 1) + ' / ' + list.length;
    }

    function step(delta) {
      var list = visibleIndexes();
      if (list.length < 2) return;
      var position = list.indexOf(current);
      show(list[(position + delta + list.length) % list.length]);
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

    Array.prototype.slice.call(grid.querySelectorAll('[data-dzs-open]')).forEach(function (button) {
      button.addEventListener('click', function () {
        open(parseInt(button.getAttribute('data-dzs-open'), 10), button);
      });
    });

    closeButton.addEventListener('click', close);
    box.querySelector('[data-dzs-prev]').addEventListener('click', function () { step(-1); });
    box.querySelector('[data-dzs-next]').addEventListener('click', function () { step(1); });

    /* Клик мимо снимка закрывает окно, по самому снимку — нет. */
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.classList.contains('dzs-lb__stage')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });

    applyFilter('all');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
