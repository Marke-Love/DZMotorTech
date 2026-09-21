/* Заявки на сайте: источник перехода, цели Метрики, отправка форм и
   всплывающее окно заявки.

   Скрипт подключён на всех страницах, поэтому всё общее для форм заявки живёт
   здесь и доступно другим скриптам как window.dzLead:
     dzLead.submit(form)  — отправить форму фоном, вернуть Promise<boolean>;
     dzLead.check(form)   — проверить «телефон или email», показать подсказку;
     dzLead.goal(name)    — отправить цель в Метрику, если счётчик загружен.

   1. Источник. При заходе на сайт UTM-метки и yclid из адреса запоминаются в
      sessionStorage (живёт до закрытия вкладки) и уходят с заявкой, даже если
      человек отправил её с другой страницы. Метки — это параметры рекламной
      ссылки, а не данные о человеке; и передаются они только вместе с
      заявкой, которую посетитель отправляет сам.

   2. Цели Метрики: lead_form_sent — после подтверждённой отправки,
      nameplate_uploaded — если к заявке приложен файл, phone_click,
      email_click, messenger_click — по клику на ссылки. Метрика грузится
      только после согласия на cookie; без неё вызовы просто пропускаются.

   3. Окно заявки. Любая ссылка или кнопка с data-lead-modal открывает окно
      вместо перехода на страницу контактов; без скрипта ссылка ведёт на
      /contacts/, поэтому в разметке у неё остаётся настоящий href. */
(function () {
  'use strict';

  var METRIKA_ID = 112397416;
  var ACTION = '/api/submit-lead.php';
  var SOURCE_KEY = 'dz_lead_source';
  var SOURCE_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'];

  var isEn = window.location.pathname.indexOf('/en') === 0;

  /* ======================================================================
     1. Источник заявки
     ====================================================================== */

  function readSource() {
    try {
      return JSON.parse(window.sessionStorage.getItem(SOURCE_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function writeSource(value) {
    try {
      window.sessionStorage.setItem(SOURCE_KEY, JSON.stringify(value));
    } catch (e) { /* приватный режим или запрет хранилища — источник просто не сохранится */ }
  }

  function captureSource() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }

    var fromUrl = {};
    var tagged = false;
    SOURCE_PARAMS.forEach(function (key) {
      var value = params.get(key);
      if (value) {
        fromUrl[key] = value.slice(0, 255);
        tagged = true;
      }
    });

    if (tagged) {
      // Новый переход по рекламе перекрывает прежний: заявку приписываем
      // последней кампании, по которой человек пришёл.
      fromUrl.landing_page = window.location.pathname;
      writeSource(fromUrl);
    } else if (!readSource()) {
      writeSource({ landing_page: window.location.pathname });
    }
  }

  function setHidden(form, name, value) {
    var input = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  function applySource(form) {
    var source = readSource() || {};
    SOURCE_PARAMS.forEach(function (key) {
      setHidden(form, key, source[key] || '');
    });
    setHidden(form, 'landing_page', source.landing_page || window.location.pathname);
    setHidden(form, 'form_page', window.location.pathname);
  }

  captureSource();

  /* ======================================================================
     2. Цели Метрики
     ====================================================================== */

  function goal(name) {
    if (typeof window.ym !== 'function') return;
    try {
      window.ym(METRIKA_ID, 'reachGoal', name);
    } catch (e) { /* счётчик не должен ломать отправку заявки */ }
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    var href = link.getAttribute('href') || '';

    if (/^tel:/i.test(href)) {
      goal('phone_click');
    } else if (/^mailto:/i.test(href)) {
      goal('email_click');
    } else if (/(wa\.me\/|api\.whatsapp\.com|^whatsapp:|t\.me\/|telegram\.me\/|^tg:|max\.ru\/)/i.test(href)) {
      goal('messenger_click');
    }
  }, true);

  /* ======================================================================
     3. Проверка способа связи
     ====================================================================== */

  var MSG = isEn ? {
    either: 'Enter a phone number or an e-mail',
    phone: 'Check the phone number',
    email: 'Check the e-mail address',
    contact: 'Enter a phone number or an e-mail'
  } : {
    either: 'Укажите телефон или email',
    phone: 'Проверьте номер телефона',
    email: 'Проверьте адрес email',
    contact: 'Укажите телефон или email'
  };

  function digits(value) {
    return (value.match(/\d/g) || []).length;
  }

  function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* Обязательность «телефон ИЛИ email» стандартным required не описать,
     поэтому проверяем вручную и показываем подсказку браузера у поля. */
  function checkContact(form) {
    var combined = form.querySelector('[name="txt_contact"]');
    if (combined) {
      var v = combined.value.trim();
      combined.setCustomValidity('');
      if (!v) {
        combined.setCustomValidity(MSG.contact);
      } else if (v.indexOf('@') !== -1 ? !looksLikeEmail(v) : digits(v) < 5) {
        combined.setCustomValidity(v.indexOf('@') !== -1 ? MSG.email : MSG.phone);
      }
      if (combined.validationMessage) {
        combined.reportValidity();
        return false;
      }
      return true;
    }

    var tel = form.querySelector('[name="txt_tele"]');
    var mail = form.querySelector('[name="txt_email"]');
    if (!tel || !mail) return true;

    tel.setCustomValidity('');
    mail.setCustomValidity('');
    var telValue = tel.value.trim();
    var mailValue = mail.value.trim();

    if (!telValue && !mailValue) {
      tel.setCustomValidity(MSG.either);
      tel.reportValidity();
      return false;
    }
    if (telValue && digits(telValue) < 5) {
      tel.setCustomValidity(MSG.phone);
      tel.reportValidity();
      return false;
    }
    if (mailValue && !looksLikeEmail(mailValue)) {
      mail.setCustomValidity(MSG.email);
      mail.reportValidity();
      return false;
    }
    return true;
  }

  // Подсказка снимается, как только человек начинает править поле.
  document.addEventListener('input', function (event) {
    var name = event.target && event.target.name;
    if (name !== 'txt_tele' && name !== 'txt_email' && name !== 'txt_contact') return;
    var form = event.target.form;
    if (!form) return;
    ['txt_tele', 'txt_email', 'txt_contact'].forEach(function (n) {
      var field = form.querySelector('[name="' + n + '"]');
      if (field) field.setCustomValidity('');
    });
  });

  function isLeadForm(form) {
    return form && form.tagName === 'FORM' && /submit-lead\.php/.test(form.getAttribute('action') || '');
  }

  /* Для любых форм заявки, в том числе без собственного скрипта: проверка
     способа связи и метки источника. Слушатель стоит на фазе перехвата, чтобы
     сработать раньше обработчиков самих форм и остановить отправку. */
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!isLeadForm(form)) return;

    ['txt_tele', 'txt_email', 'txt_contact'].forEach(function (n) {
      var field = form.querySelector('[name="' + n + '"]');
      if (field) field.setCustomValidity('');
    });

    // Сначала обычные обязательные поля (у форм с novalidate браузер сам их
    // не проверит), затем «телефон или email» — подсказки идут сверху вниз.
    if (!form.reportValidity() || !checkContact(form)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    applySource(form);
  }, true);

  /* ======================================================================
     4. Отправка
     ====================================================================== */

  function hasFiles(form) {
    return Array.prototype.some.call(form.querySelectorAll('input[type="file"]'), function (input) {
      return input.files && input.files.length > 0;
    });
  }

  /* Обработчик отвечает перенаправлением: ?sent=1 — принято, ?sent=0 — нет.
     Цели отправляются только после подтверждения, а не по нажатию кнопки. */
  function submitLead(form) {
    applySource(form);
    var withFiles = hasFiles(form);

    if (!window.fetch || !window.FormData) {
      return Promise.resolve(false);
    }

    return fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin'
    }).then(function (response) {
      var ok = response.ok && response.url.indexOf('sent=1') !== -1;
      if (ok) {
        goal('lead_form_sent');
        if (withFiles) goal('nameplate_uploaded');
      }
      return ok;
    }).catch(function () {
      return false;
    });
  }

  window.dzLead = {
    submit: submitLead,
    check: checkContact,
    applySource: applySource,
    goal: goal
  };

  /* ======================================================================
     5. Всплывающее окно заявки
     ====================================================================== */

  var T = isEn ? {
    title: 'Send a request',
    lede: 'Tell us what you need — an engineer will pick the right motor, calculate the price and confirm lead time.',
    name: 'Your name', namePh: 'How should we address you',
    phone: 'Phone',
    email: 'E-mail',
    either: 'A phone number or an e-mail is enough — whichever is convenient.',
    company: 'Company',
    message: 'Message',
    messagePh: 'Power, voltage, speed, mounting, Ex rating, deadline or the model you are replacing',
    file: 'Nameplate photo, datasheet or specification', fileBtn: 'Choose file', fileEmpty: 'No file chosen',
    consent: 'I agree to the <a href="/en/legal/privacy-policy.html" target="_blank" rel="noopener">privacy policy</a> and to the processing of my personal data',
    submit: 'Send request', sending: 'Sending…',
    close: 'Close',
    bad: 'The request could not be sent. Please check the fields and try again, or call us.',
    okTitle: 'Thank you! Your request has been received.',
    okText: 'We will review the information and get back to you during business hours.'
  } : {
    title: 'Оставить заявку',
    lede: 'Расскажите, что нужно, — инженер подберёт исполнение, посчитает стоимость и назовёт срок поставки.',
    name: 'Ваше имя', namePh: 'Как к вам обращаться',
    phone: 'Телефон',
    email: 'E-mail',
    either: 'Достаточно телефона или email — как вам удобнее.',
    company: 'Название компании',
    message: 'Сообщение',
    messagePh: 'Мощность, напряжение, обороты, монтаж, взрывозащита, срок или модель, которую меняете',
    file: 'Фото шильдика, паспорт или ТЗ', fileBtn: 'Выберите файл', fileEmpty: 'Файл не выбран',
    consent: 'Я согласен(-а) с <a href="/legal/privacy-policy.html" target="_blank" rel="noopener">политикой конфиденциальности</a> и <a href="/legal/personal-data-policy.html" target="_blank" rel="noopener">политикой обработки персональных данных</a>',
    submit: 'Отправить заявку', sending: 'Отправляем…',
    close: 'Закрыть',
    bad: 'Не удалось отправить заявку. Проверьте поля и попробуйте снова или позвоните нам.',
    okTitle: 'Спасибо! Заявка получена.',
    okText: 'Мы проверим информацию и свяжемся с вами в рабочее время.'
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

          '<form method="post" enctype="multipart/form-data" action="' + ACTION + '" data-dzm-form novalidate>' +
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
                '<label for="dzm_company">' + T.company + '</label>' +
                '<input class="dzm__input" type="text" id="dzm_company" name="txt_company" autocomplete="organization">' +
              '</div>' +
              '<div class="dzm__field">' +
                '<label for="dzm_tele">' + T.phone + '</label>' +
                '<input class="dzm__input" type="tel" id="dzm_tele" name="txt_tele" placeholder="+7 …" autocomplete="tel">' +
              '</div>' +
              '<div class="dzm__field">' +
                '<label for="dzm_email">' + T.email + '</label>' +
                '<input class="dzm__input" type="email" id="dzm_email" name="txt_email" placeholder="name@company.ru" autocomplete="email">' +
              '</div>' +
              '<p class="dzm__hint dzm__field--wide">' + T.either + '</p>' +
              '<div class="dzm__field dzm__field--wide">' +
                '<label for="dzm_files">' + T.file + '</label>' +
                '<label class="dzm__drop" for="dzm_files">' +
                  '<b>' + T.fileBtn + '</b>' +
                  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b8891" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5l-8.4 8.4a5 5 0 0 1-7-7l8.4-8.4a3.3 3.3 0 0 1 4.7 4.7l-8.4 8.4a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"/></svg>' +
                  '<span data-dzm-filename>' + T.fileEmpty + '</span>' +
                '</label>' +
                '<input class="dzm__file" type="file" id="dzm_files" name="attachments[]" multiple accept="image/*,.pdf,.doc,.docx">' +
              '</div>' +
              '<div class="dzm__field dzm__field--wide">' +
                '<label for="dzm_message">' + T.message + '</label>' +
                '<textarea class="dzm__input" id="dzm_message" name="message" rows="3" placeholder="' + T.messagePh + '"></textarea>' +
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
    event.preventDefault();

    // Поля уже проверены общим обработчиком выше (фаза перехвата): сюда
    // событие доходит только с корректно заполненной формой.
    var button = form.querySelector('[data-dzm-submit]');
    var label = form.querySelector('[data-dzm-label]');
    var bad = form.querySelector('[data-dzm-bad]');

    bad.hidden = true;
    button.disabled = true;
    label.textContent = T.sending;

    submitLead(form).then(function (ok) {
      if (ok) {
        done();
        return;
      }
      button.disabled = false;
      label.textContent = T.submit;
      bad.hidden = false;
    });
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
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-lead-modal]');
    if (trigger) open(event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
}());
