/* Блок «Замена импортных двигателей»: появление при первом показе.
   Базовое состояние в CSS — видимое; класс is-armed прячет элементы только
   после того, как скрипт действительно отработал, поэтому при выключенном
   или упавшем JS блок остаётся на месте. */
(function () {
  'use strict';

  var block = document.querySelector('[data-dzh-swap]');
  if (!block) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  block.classList.add('is-armed');

  function play() {
    block.classList.remove('is-armed');
    block.classList.add('is-in');
  }

  // Если блок уже в кадре при загрузке — показываем сразу.
  var rect = block.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) { play(); return; }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      play();
      io.disconnect();
    });
  }, { threshold: 0.15 });

  io.observe(block);

  // Страховка: если наблюдатель не сработал (например вкладка была скрыта),
  // показываем блок через две секунды.
  setTimeout(function () {
    if (block.classList.contains('is-armed')) play();
  }, 2000);
})();
