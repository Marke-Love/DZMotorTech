/* Посадочные страницы: формы заявки и кнопка «Отправить фото шильдика».

   Проверка полей, метки источника и цели Метрики — в общем скрипте заявок
   lead-modal.js (window.dzLead). Он подключён раньше, но к нему всё равно
   обращаемся в момент действия, а не при загрузке.

   Без скрипта формы уходят обычной отправкой: обработчик возвращает на эту
   же страницу с ?sent=1 или ?sent=0, и тогда показывается окно или ошибка. */
(function () {
  'use strict';

  function param(name) {
    var match = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /* Всплывающее окно «Заявка получена». Закрывается кнопкой, кликом по фону и Esc. */
  function openPopup(source) {
    var previous = document.querySelector('.ln-pop');
    if (previous) previous.parentNode.removeChild(previous);

    var isRu = (document.documentElement.lang || 'ru').toLowerCase().indexOf('ru') === 0;
    var title = source.querySelector('.ln-done__title');
    var pop = document.createElement('div');
    pop.className = 'ln-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    if (title) pop.setAttribute('aria-label', title.textContent);

    var card = document.createElement('div');
    card.className = 'ln-pop__card ln-done';
    card.innerHTML = source.innerHTML;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'ln-btn ln-btn--dark ln-pop__close';
    close.textContent = isRu ? 'Закрыть' : 'Close';
    card.appendChild(close);
    pop.appendChild(card);

    var lastFocus = document.activeElement;
    function shut() {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('ln-pop-open');
      if (pop.parentNode) pop.parentNode.removeChild(pop);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function onKey(event) {
      if (event.key === 'Escape' || event.key === 'Esc') shut();
      if (event.key === 'Tab') { event.preventDefault(); close.focus(); }   // в окне одна кнопка
    }
    close.addEventListener('click', shut);
    pop.addEventListener('click', function (event) { if (event.target === pop) shut(); });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(pop);
    document.documentElement.classList.add('ln-pop-open');
    close.focus();
  }

  function setupForm(form) {
    var wrap = form.parentNode;
    var done = wrap.querySelector('[data-ln-done]');
    var bad = form.querySelector('[data-ln-bad]');
    var button = form.querySelector('[type="submit"]');
    var label = form.querySelector('[data-ln-label]');
    var labelText = label ? label.textContent : '';

    /* Имя выбранного файла вместо подсказки о форматах. */
    var file = form.querySelector('input[type="file"]');
    var drop = file ? form.querySelector('label[for="' + file.id + '"]') : null;
    var nameOut = drop ? drop.querySelector('[data-ln-filename]') : null;
    if (file && nameOut) {
      var empty = nameOut.textContent;
      file.addEventListener('change', function () {
        var names = Array.prototype.map.call(file.files, function (f) { return f.name; });
        nameOut.textContent = names.length ? names.join(', ') : empty;
        drop.classList.toggle('is-filled', names.length > 0);
      });
    }

    /* Успешная отправка: всплывающее окно поверх страницы, форма очищается
       и остаётся доступной. Текст окна берём из блока [data-ln-done] формы. */
    function showDone() {
      form.reset();
      if (file) {
        try { file.dispatchEvent(new Event('change')); } catch (e) { /* старые браузеры */ }
      }
      if (done) openPopup(done);
    }

    function showBad() {
      if (bad) bad.hidden = false;
    }

    /* Сюда событие доходит, только если общий скрипт уже проверил поля. */
    form.addEventListener('submit', function (event) {
      var lead = window.dzLead;
      if (!lead || !window.fetch || !window.FormData) return;   // обычная отправка страницей
      event.preventDefault();

      if (bad) bad.hidden = true;
      if (button) button.disabled = true;
      if (label) label.textContent = 'Отправляем…';

      lead.submit(form).then(function (ok) {
        if (button) button.disabled = false;
        if (label) label.textContent = labelText;
        if (ok) {
          showDone();
        } else {
          showBad();
        }
      });
    });

    return { form: form, file: file, showDone: showDone, showBad: showBad };
  }

  function init() {
    var forms = Array.prototype.map.call(document.querySelectorAll('[data-ln-form]'), setupForm);
    if (!forms.length) return;
    var main = forms[0];

    /* Возврат после отправки без скрипта. */
    var sent = param('sent');
    if (sent === '1') main.showDone();
    if (sent === '0') main.showBad();

    /* «Отправить фото шильдика»: сразу открываем выбор файла в первой форме.
       Выбор файла должен вызываться прямо в обработчике клика, иначе браузер
       его заблокирует, поэтому прокрутка к форме идёт параллельно. */
    Array.prototype.forEach.call(document.querySelectorAll('[data-ln-upload]'), function (button) {
      button.addEventListener('click', function () {
        if (main.form.hidden) {
          main.form.parentNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return;
        }
        main.form.scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (main.file) main.file.click();
      });
    });
  }


  /* Наклон карточек за курсором с бликом (элементы с data-ln-tilt).
     Только мышь и только без системной настройки «уменьшить движение». */
  function initTilt() {
    if (!window.matchMedia || !window.requestAnimationFrame) return;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var MAX = 7;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ln-tilt]'), function (card) {
      var frame = 0, px = 0.5, py = 0.5;
      function apply() {
        frame = 0;
        card.style.setProperty('--ry', ((px - 0.5) * 2 * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - py) * 2 * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      }
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        card.classList.add('is-tilting');
        if (!frame) frame = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', function () {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('DOMContentLoaded', initTilt);
  } else {
    init();
    initTilt();
  }
}());
