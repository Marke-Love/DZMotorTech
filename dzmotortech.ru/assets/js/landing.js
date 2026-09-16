/* Посадочные страницы: формы заявки и кнопка «Отправить фото шильдика».

   Проверка полей, метки источника и цели Метрики — в общем скрипте заявок
   lead-modal.js (window.dzLead). Он подключён раньше, но к нему всё равно
   обращаемся в момент действия, а не при загрузке.

   Без скрипта формы уходят обычной отправкой: обработчик возвращает на эту
   же страницу с ?sent=1 или ?sent=0, и тогда сообщение показывается ниже. */
(function () {
  'use strict';

  function param(name) {
    var match = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return match ? decodeURIComponent(match[1]) : '';
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

    function showDone() {
      form.hidden = true;
      if (done) {
        done.hidden = false;
        done.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
