/* Всплывающее окно заявки.

   Любая ссылка или кнопка с атрибутом data-lead-modal открывает окно вместо
   перехода на страницу контактов. Если скрипт не загрузился, ссылка работает
   как обычно и ведёт на contactus.html — поэтому в разметке у неё остаётся
   настоящий href.

   Разметку окна собираем здесь, а не кладём в каждую страницу: шапка общая
   для всей тысячи страниц сайта. Данные уходят в тот же api/submit-lead.php,
   что и форма на странице контактов. */
(function () {
  'use strict';

  var METRIKA_ID = 112397416;
  var ACTION = '/api/submit-lead.php';

  var isEn = window.location.pathname.indexOf('/en') === 0;

  var T = isEn ? {
    title: 'Send a request',
    lede: 'Tell us what you need — an engineer will pick the right motor, calculate the price and confirm lead time.',
    name: 'Your name', namePh: 'How should we address you',
    phone: 'Phone',
    email: 'E-mail',
    company: 'Company',
    message: 'Message',
    messagePh: 'Power, voltage, speed, mounting, Ex rating, deadline or the model you are replacing',
    file: 'Attach a file', fileBtn: 'Choose file', fileEmpty: 'No file chosen',
    consent: 'I agree to the <a href="/en/pages/privacy-policy-11909901.html" target="_blank" rel="noopener">privacy policy</a> and to the processing of my personal data',
    submit: 'Send request', sending: 'Sending…',
    close: 'Close',
    bad: 'The request could not be sent. Please check the required fields and try again, or call us.',
    okTitle: 'Thank you!', okText: 'Your request has been sent — we will get in touch shortly.'
  } : {
    title: 'Оставить заявку',
    lede: 'Расскажите, что нужно, — инженер подберёт исполнение, посчитает стоимость и назовёт срок поставки.',
    name: 'Ваше имя', namePh: 'Как к вам обращаться',
    phone: 'Телефон',
    email: 'E-mail',
    company: 'Название компании',
    message: 'Сообщение',
    messagePh: 'Мощность, напряжение, обороты, монтаж, взрывозащита, срок или модель, которую меняете',
    file: 'Прикрепить файл', fileBtn: 'Выберите файл', fileEmpty: 'Файл не выбран',
    consent: 'Я согласен(-а) с <a href="/pages/privacy-policy.html" target="_blank" rel="noopener">политикой конфиденциальности</a> и <a href="/pages/personal-data-policy.html" target="_blank" rel="noopener">политикой обработки персональных данных</a>',
    submit: 'Отправить заявку', sending: 'Отправляем…',
    close: 'Закрыть',
    bad: 'Не удалось отправить заявку. Проверьте обязательные поля и попробуйте снова или позвоните нам.',
    okTitle: 'Спасибо!', okText: 'Заявка отправлена — свяжемся с вами в ближайшее время.'
  };

  var back = null;       // подложка с окном, собирается при первом открытии
  var lastFocus = null;  // куда вернуть фокус после закрытия
  var sent = false;      // заявка отправлена — окно пересоберём при следующем открытии

  function markup() {
    var req = ' <span class="dzm__req">*</span>';
    return '' +
      '<div class="dzm" role="dialog" aria-modal="true" aria-label="' + T.title + '">' +
        '<button class="dzm__close" type="button" data-dzm-close aria-label="' + T.close + '">' +
          '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +

        '<div data-dzm-body>' +
          '<h2 class="dzm__title">' + T.title + '</h2>' +
          '<p class="dzm__lede">' + T.lede + '</p>' +

          '<form method="post" enctype="multipart/form-data" action="' + ACTION + '" data-dzm-form>' +
            '<div class="dzm__note dzm__note--bad" data-dzm-bad hidden role="status">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></svg>' +
              '<p>' + T.bad + '</p>' +
            '</div>' +

            '<input type="hidden" name="lang" value="' + (isEn ? 'en' : 'ru') + '">' +
            '<input type="text" name="website" value="" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">' +

            '<div class="dzm__grid">' +
              '<div class="dzm__field">' +
                '<label for="dzm_name">' + T.name + req + '</label>' +
                '<input class="dzm__input" type="text" id="dzm_name" name="txt_name" placeholder="' + T.namePh + '" autocomplete="name" required>' +
              '</div>' +
              '<div class="dzm__field">' +
                '<label for="dzm_tele">' + T.phone + req + '</label>' +
                '<input class="dzm__input" type="tel" id="dzm_tele" name="txt_tele" placeholder="+7 …" autocomplete="tel" required>' +
              '</div>' +
              '<div class="dzm__field">' +
                '<label for="dzm_email">' + T.email + req + '</label>' +
                '<input class="dzm__input" type="email" id="dzm_email" name="txt_email" placeholder="name@company.ru" autocomplete="email" required>' +
              '</div>' +
              '<div class="dzm__field">' +
                '<label for="dzm_company">' + T.company + '</label>' +
                '<input class="dzm__input" type="text" id="dzm_company" name="txt_company" autocomplete="organization">' +
              '</div>' +
              '<div class="dzm__field dzm__field--wide">' +
                '<label for="dzm_message">' + T.message + '</label>' +
                '<textarea class="dzm__input" id="dzm_message" name="message" rows="3" placeholder="' + T.messagePh + '"></textarea>' +
              '</div>' +
              '<div class="dzm__field dzm__field--wide">' +
                '<label for="dzm_files">' + T.file + '</label>' +
                '<label class="dzm__drop" for="dzm_files">' +
                  '<b>' + T.fileBtn + '</b>' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b8891" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5l-8.4 8.4a5 5 0 0 1-7-7l8.4-8.4a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>' +
                  '<span data-dzm-filename>' + T.fileEmpty + '</span>' +
                '</label>' +
                '<input class="dzm__file" type="file" id="dzm_files" name="attachments[]" multiple accept="image/*,.pdf,.doc,.docx">' +
              '</div>' +
            '</div>' +

            '<label class="dzm__consent">' +
              '<input type="checkbox" name="privacy_consent" required>' +
              '<span>' + T.consent + '</span>' +
            '</label>' +

            '<button class="dzm__submit" type="submit" data-dzm-submit>' +
              '<span data-dzm-label>' + T.submit + '</span>' +
              '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>' +
            '</button>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  function build() {
    back = document.createElement('div');
    back.className = 'dzm-back';
    back.hidden = true;
    back.innerHTML = markup();
    document.body.appendChild(back);

    back.addEventListener('click', function (event) {
      // Клик мимо окна или по крестику закрывает его.
      if (event.target === back || event.target.closest('[data-dzm-close]')) close();
    });

    var files = back.querySelector('#dzm_files');
    var fname = back.querySelector('[data-dzm-filename]');
    files.addEventListener('change', function () {
      var names = Array.prototype.map.call(files.files, function (f) { return f.name; });
      fname.textContent = names.length ? names.join(', ') : T.fileEmpty;
    });

    back.querySelector('[data-dzm-form]').addEventListener('submit', send);
  }

  function open(event) {
    if (event) event.preventDefault();
    if (back && sent) {            // после отправки собираем окно заново
      back.remove();
      back = null;
      sent = false;
    }
    if (!back) build();
    lastFocus = document.activeElement;

    back.hidden = false;
    document.body.classList.add('dzm-locked');
    // Перерисовка, чтобы появление проигралось как переход, а не скачком.
    void back.offsetWidth;
    back.classList.add('is-open');

    var first = back.querySelector('#dzm_name');
    if (first) first.focus({ preventScroll: true });
  }

  function close() {
    if (!back || back.hidden) return;
    back.classList.remove('is-open');
    document.body.classList.remove('dzm-locked');
    window.setTimeout(function () { back.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function send(event) {
    var form = event.target;
    if (!window.fetch || !window.FormData) return;   // старым браузерам — обычная отправка
    event.preventDefault();

    var button = form.querySelector('[data-dzm-submit]');
    var label = form.querySelector('[data-dzm-label]');
    var bad = form.querySelector('[data-dzm-bad]');

    bad.hidden = true;
    button.disabled = true;
    label.textContent = T.sending;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin'
    }).then(function (response) {
      /* Обработчик отвечает перенаправлением: ?sent=1 — принято, ?sent=0 — нет. */
      if (response.ok && response.url.indexOf('sent=1') !== -1) done();
      else fail();
    }).catch(fail);

    function fail() {
      button.disabled = false;
      label.textContent = T.submit;
      bad.hidden = false;
    }
  }

  function done() {
    back.querySelector('[data-dzm-body]').innerHTML = '' +
      '<div class="dzm__done">' +
        '<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/></svg>' +
        '<h3>' + T.okTitle + '</h3>' +
        '<p>' + T.okText + '</p>' +
        '<button type="button" data-dzm-close>' + T.close + '</button>' +
      '</div>';

    sent = true;
    if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', 'lead_modal');
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-lead-modal]');
    if (trigger) open(event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
}());
