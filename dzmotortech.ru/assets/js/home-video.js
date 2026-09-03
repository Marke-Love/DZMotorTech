/* Видео в блоке «О нас» на главной. Пока ролик не запущен, системная панель
   управления браузера закрывает нижнюю часть обложки, поэтому до первого
   запуска панель убираем и показываем свою круглую кнопку play. После старта
   управление отдаём обычному плееру.

   Разметка рассчитана на работу без скрипта: у video в HTML стоит controls,
   а кнопка спрятана атрибутом hidden. Скрипт меняет это местами, поэтому
   если он не загрузится, видео останется управляемым штатными средствами. */
(function () {
  'use strict';

  function init() {
    var players = document.querySelectorAll('[data-dzh-player]');

    Array.prototype.forEach.call(players, function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-dzh-play]');
      if (!video || !button) return;

      video.controls = false;
      button.hidden = false;

      button.addEventListener('click', function () {
        video.controls = true;
        player.classList.add('is-playing');
        var started = video.play();
        /* Автозапуск со звуком может быть заблокирован политикой браузера —
           тогда пользователь нажмёт play уже на штатной панели. */
        if (started && typeof started.catch === 'function') {
          started.catch(function () {});
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
