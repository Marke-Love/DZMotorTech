/* Быстрая заявка с карточки товара.

   Кнопка «Запросить предложение» осталась от платформенного магазина: она
   вызывала окно #dialog-added-products-in-cart, а в выгрузке это окно пустое,
   поэтому нажатие ничего не делало. Здесь кнопка перехватывается и открывает
   свою форму — ту же, что на контактах, но короткую и с уже подставленной
   моделью, чтобы менеджер видел, каким двигателем интересовались.

   Форма отправляется на тот же обработчик, что и на контактах. Он отвечает
   перенаправлением на страницу контактов с ?sent=1 или ?sent=0 — по адресу
   ответа и определяем результат, оставляя человека на карточке товара. */
(function () {
  'use strict';

  var ACTION = '/api/submit-lead.php';

  var TEXT = {
    ru: {
      art: 'Артикул',
      lede: 'Оставьте контакты — вернёмся с предложением по этой модели.',
      name: 'ФИО', namePh: 'Как к вам обращаться',
      phone: 'Телефон', phonePh: '+7 …',
      email: 'Email', emailPh: 'name@company.ru',
      note: 'Комментарий', notePh: 'Режим работы, мощность, условия площадки',
      consent: 'Я согласен(-а) с <a href="/pages/privacy-policy.html" target="_blank" rel="noopener">политикой конфиденциальности</a> и <a href="/pages/personal-data-policy.html" target="_blank" rel="noopener">политикой обработки персональных данных</a>',
      submit: 'Отправить заявку',
      sending: 'Отправляем…',
      close: 'Закрыть',
      error: 'Не удалось отправить заявку. Проверьте поля и попробуйте снова.',
      doneTitle: 'Заявка отправлена',
      doneText: 'Спасибо! Свяжемся с вами в ближайшее время.',
      about: 'Интересует'
    },
    en: {
      art: 'Article',
      lede: 'Leave your contacts — we will come back with a quote for this model.',
      name: 'Full name', namePh: 'How should we address you',
      phone: 'Phone', phonePh: '+1 …',
      email: 'Email', emailPh: 'name@company.com',
      note: 'Comment', notePh: 'Duty cycle, power, site conditions',
      consent: 'I agree to the <a href="/en/pages/privacy-policy-11909901.html" target="_blank" rel="noopener">Privacy Policy</a> and the <a href="/en/pages/personal-data-policy.html" target="_blank" rel="noopener">Personal Data Processing Policy</a>',
      submit: 'Send request',
      sending: 'Sending…',
      close: 'Close',
      error: 'We could not send your request. Please check the fields and try again.',
      doneTitle: 'Request sent',
      doneText: 'Thank you! We will contact you shortly.',
      about: 'Product of interest'
    }
  };

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    if (html != null) node.innerHTML = html;
    return node;
  }

  function init() {
    var button = document.querySelector('button[data-dialog="#dialog-added-products-in-cart"]');
    if (!button) return;

    var lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
    var t = TEXT[lang];
    var titleNode = document.querySelector('h1.product_item__title');
    var artNode = document.querySelector('[data-art]');
    var title = titleNode ? titleNode.textContent.trim() : document.title.trim();
    var art = artNode ? (artNode.getAttribute('data-art') || '').trim() : '';

    var box = el('div', { class: 'dzl', hidden: '', role: 'dialog', 'aria-modal': 'true',
                          'aria-label': title });
    box.innerHTML =
      '<div class="dzl__card">' +
        '<button class="dzl__close" type="button" data-dzl-close aria-label="' + t.close + '">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        (art ? '<p class="dzl__art">' + t.art + ' ' + art + '</p>' : '') +
        '<h3 class="dzl__title"></h3>' +
        '<form novalidate="false" method="post" enctype="multipart/form-data" data-dzl-form>' +
          '<p class="dzl__lede">' + t.lede + '</p>' +
          '<input type="hidden" name="lang" value="' + lang + '">' +
          '<input type="text" name="website" value="" tabindex="-1" autocomplete="off" aria-hidden="true" ' +
                 'style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">' +
          '<div class="dzl__field">' +
            '<label for="dzl_name">' + t.name + '</label>' +
            '<input type="text" id="dzl_name" name="txt_name" placeholder="' + t.namePh + '" required>' +
          '</div>' +
          '<div class="dzl__row">' +
            '<div class="dzl__field">' +
              '<label for="dzl_tel">' + t.phone + '</label>' +
              '<input type="tel" id="dzl_tel" name="txt_tele" placeholder="' + t.phonePh + '" required>' +
            '</div>' +
            '<div class="dzl__field">' +
              '<label for="dzl_mail">' + t.email + '</label>' +
              '<input type="email" id="dzl_mail" name="txt_email" placeholder="' + t.emailPh + '" required>' +
            '</div>' +
          '</div>' +
          '<div class="dzl__field">' +
            '<label for="dzl_note">' + t.note + '</label>' +
            '<textarea id="dzl_note" name="message" placeholder="' + t.notePh + '"></textarea>' +
          '</div>' +
          '<label class="dzl__consent">' +
            '<input type="checkbox" name="privacy_consent" required>' +
            '<span>' + t.consent + '</span>' +
          '</label>' +
          '<p class="dzl__error" data-dzl-error hidden>' + t.error + '</p>' +
          '<button class="dzl__submit" type="submit">' + t.submit + '</button>' +
        '</form>' +
        '<div class="dzl__done" data-dzl-done hidden>' +
          '<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/></svg>' +
          '<h3>' + t.doneTitle + '</h3><p>' + t.doneText + '</p>' +
        '</div>' +
      '</div>';

    /* Название модели ставим текстом, а не разметкой: оно приходит со страницы. */
    box.querySelector('.dzl__title').textContent = title;

    var form = box.querySelector('[data-dzl-form]');
    var note = box.querySelector('#dzl_note');
    var error = box.querySelector('[data-dzl-error]');
    var done = box.querySelector('[data-dzl-done]');
    var submit = box.querySelector('.dzl__submit');
    form.setAttribute('action', ACTION);

    /* Модель уходит вместе с заявкой — иначе по ней не понять, о чём речь. */
    var about = t.about + ': ' + title + (art ? ' (' + t.art.toLowerCase() + ' ' + art + ')' : '');
    form.addEventListener('submit', function (event) {
      if (!form.reportValidity || form.reportValidity()) {
        note.value = note.value.trim() ? about + '\n\n' + note.value.trim() : about;
      }
      if (!window.fetch || !window.FormData) return; // без fetch уходим обычной отправкой
      event.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      submit.textContent = t.sending;

      window.fetch(ACTION, {
        method: 'POST',
        body: new FormData(form),
        credentials: 'same-origin'
      }).then(function (response) {
        var url = response.url || '';
        if (url.indexOf('sent=0') !== -1 || (!response.ok && url.indexOf('sent=1') === -1)) {
          throw new Error('rejected');
        }
        form.hidden = true;
        done.hidden = false;
      }).catch(function () {
        error.hidden = false;
        submit.disabled = false;
        submit.textContent = t.submit;
        note.value = note.value === about ? '' : note.value.replace(about + '\n\n', '');
      });
    });

    document.body.appendChild(box);

    var opener = null;

    function open() {
      opener = document.activeElement;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      var first = form.querySelector('input:not([type=hidden]):not([tabindex="-1"])');
      if (first && !form.hidden) first.focus();
      else box.querySelector('[data-dzl-close]').focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      if (opener && opener.focus) opener.focus();
      opener = null;
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      open();
    });

    box.querySelector('[data-dzl-close]').addEventListener('click', close);
    box.addEventListener('click', function (event) { if (event.target === box) close(); });
    document.addEventListener('keydown', function (event) {
      if (!box.hidden && event.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
