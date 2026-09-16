/* Страница «Контакты»: имена выбранных файлов, подстановка из адреса
   и отправка формы без перезагрузки.

   Разметка работает и без скрипта: поле выбора файлов остаётся обычным
   input, форма уходит обычным POST, а сообщения об отправке показываются по
   параметру ?sent= после возврата со страницы обработчика.

   Проверка «телефон или email», метки источника и цели Метрики — в общем
   скрипте заявок lead-modal.js (window.dzLead). Он подключён ниже этого
   файла, поэтому обращаемся к нему в момент отправки, а не при загрузке. */
(function () {
  'use strict';

  function param(name) {
    var match = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : '';
  }

  function init() {
    var form = document.querySelector('[data-dzk-form]');
    if (!form) return;

    /* Ссылки из писем приходят с уже известными именем и телефоном. */
    [['name', 'txt_name'], ['telephone', 'txt_tele']].forEach(function (pair) {
      var value = param(pair[0]);
      if (!value) return;
      var field = form.querySelector('[name="' + pair[1] + '"]');
      if (field) field.value = value;
    });

    var files = document.getElementById('cf_files');
    var label = document.getElementById('cf_files_name');
    if (files && label) {
      var empty = label.textContent;
      files.addEventListener('change', function () {
        var names = Array.prototype.map.call(files.files, function (file) { return file.name; });
        label.textContent = names.length ? names.join(', ') : empty;
      });
    }

    var ok = document.querySelector('[data-dzk-ok]');
    var bad = document.querySelector('[data-dzk-bad]');
    var button = form.querySelector('.dzk-submit');

    function showDone() {
      if (ok) ok.hidden = false;
      form.hidden = true;
      if (ok) ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function showFail() {
      if (bad) {
        bad.hidden = false;
        bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }

    var sent = param('sent');
    if (sent === '1') {
      showDone();
    } else if (sent === '0') {
      showFail();
    }

    /* Сюда событие доходит, только если общий скрипт уже проверил поля
       (он слушает отправку на фазе перехвата и останавливает неверную). */
    form.addEventListener('submit', function (event) {
      var lead = window.dzLead;
      if (!lead || !window.fetch || !window.FormData) return;   // обычная отправка страницей
      event.preventDefault();

      if (bad) bad.hidden = true;
      if (button) button.disabled = true;

      lead.submit(form).then(function (success) {
        if (button) button.disabled = false;
        if (success) {
          showDone();
        } else {
          showFail();
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
