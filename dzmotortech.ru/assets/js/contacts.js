/* Страница «Контакты»: имена выбранных файлов, подстановка из адреса
   и ответ после отправки формы.

   Разметка работает и без скрипта: поле выбора файлов остаётся обычным
   input, а сообщения об отправке скрыты атрибутом hidden. */
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

    var sent = param('sent');
    var ok = document.querySelector('[data-dzk-ok]');
    var bad = document.querySelector('[data-dzk-bad]');
    if (sent === '1' && ok) {
      ok.hidden = false;
      form.hidden = true;
    } else if (sent === '0' && bad) {
      bad.hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
