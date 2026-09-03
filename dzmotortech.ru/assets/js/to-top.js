/* Кнопка «наверх страницы»: появляется после прокрутки вниз и плавно
   возвращает пользователя к началу страницы по клику.

   Скрипт сам создаёт разметку и не зависит от остальных скриптов темы —
   если он не загрузится, страница продолжит работать как обычно, кнопка
   просто не появится. На странице каталога такая кнопка (.dzc-top) уже
   есть в вёрстке — там скрипт свою кнопку не добавляет, чтобы они не
   накладывались друг на друга. */
(function () {
  'use strict';

  var SHOW_AFTER = 400; // px — после какой прокрутки показывать кнопку

  function init() {
    if (document.querySelector('.dzc-top')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dz-to-top';
    btn.setAttribute('aria-label', 'Наверх страницы');
    btn.title = 'Наверх';
    btn.innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M18 15l-6-6-6 6"/>' +
      '</svg>';
    document.body.appendChild(btn);

    function toggle() {
      var visible = (window.scrollY || document.documentElement.scrollTop) > SHOW_AFTER;
      btn.classList.toggle('is-visible', visible);
    }

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
