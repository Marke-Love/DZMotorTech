(function () {
  'use strict';
  var KEY = 'cookie_consent';
  var consent = localStorage.getItem(KEY);

  if (consent === 'accepted' || consent === 'declined') return;

  var isEn = window.location.pathname.indexOf('/en/') === 0;
  var privacyUrl = isEn
    ? '/en/pages/privacy-policy-11909901.html'
    : '/pages/privacy-policy.html';

  var banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:999999',
    'background:#1a2b4a', 'color:#fff',
    'padding:14px 24px', 'display:flex', 'align-items:center',
    'justify-content:space-between', 'flex-wrap:wrap', 'gap:10px',
    'font-family:Montserrat,Arial,sans-serif', 'font-size:13px', 'line-height:1.5',
    'box-shadow:0 -2px 12px rgba(0,0,0,0.25)'
  ].join(';');

  var msg = isEn
    ? 'We use cookies and Yandex Metrica for traffic analysis. By clicking “Accept” you agree to our <a href="' + privacyUrl + '" style="color:#7db9f8;text-decoration:underline">Privacy Policy</a>.'
    : 'Мы используем файлы cookie и Яндекс.Метрику для анализа трафика. Нажимая «Принять», вы соглашаетесь с <a href="' + privacyUrl + '" style="color:#7db9f8;text-decoration:underline">Политикой конфиденциальности</a>.';

  var btnStyle = 'border:none;padding:8px 18px;border-radius:4px;cursor:pointer;font-size:12px;font-family:Montserrat,Arial,sans-serif;font-weight:600;white-space:nowrap';

  banner.innerHTML =
    '<span>' + msg + '</span>' +
    '<div style="display:flex;gap:8px;flex-shrink:0">' +
    '<button id="_cc_accept" style="' + btnStyle + ';background:#2563b0;color:#fff">' + (isEn ? 'Accept' : 'Принять') + '</button>' +
    '<button id="_cc_decline" style="' + btnStyle + ';background:transparent;color:#bbb;border:1px solid #666">' + (isEn ? 'Decline' : 'Отклонить') + '</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById('_cc_accept').onclick = function () {
    localStorage.setItem(KEY, 'accepted');
    banner.remove();
    if (typeof window._initMetrika === 'function') window._initMetrika();
  };

  document.getElementById('_cc_decline').onclick = function () {
    localStorage.setItem(KEY, 'declined');
    banner.remove();
  };
})();

// Language switcher pill (desktop + mobile)
(function () {
  var path = window.location.pathname;
  var isEn = path.indexOf('/en') === 0;

  /* Флаги нарисованы как SVG, а не взяты из эмодзи (🇷🇺/🇬🇧): на части
     Windows-систем шрифт не собирает пару emoji-букв в картинку флага и
     вместо флага показываются голые буквы "RU"/"GB". SVG рендерится
     одинаково везде. */
  var FLAG_RU =
    '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/>' +
    '<rect y="6.67" width="30" height="6.66" fill="#0039a6"/>' +
    '<rect y="13.33" width="30" height="6.67" fill="#d52b1e"/></svg>';
  var FLAG_GB =
    '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#012169"/>' +
    '<path d="M0,0 30,20M30,0 0,20" stroke="#fff" stroke-width="4"/>' +
    '<path d="M0,0 30,20M30,0 0,20" stroke="#c8102e" stroke-width="1.6"/>' +
    '<rect x="12" width="6" height="20" fill="#fff"/><rect y="7" width="30" height="6" fill="#fff"/>' +
    '<rect x="13" width="4" height="20" fill="#c8102e"/><rect y="8" width="30" height="4" fill="#c8102e"/></svg>';

  function pillHTML(active) {
    return '<a class="ls-pill-opt' + (!active ? ' ls-active' : '') + '" href="/"><span class="ls-flag">' + FLAG_RU + '</span> RU</a>' +
           '<div class="ls-pill-sep"></div>' +
           '<a class="ls-pill-opt' + (active ? ' ls-active' : '') + '" href="/en/"><span class="ls-flag">' + FLAG_GB + '</span> EN</a>';
  }

  function initSwitcher() {
    // Desktop header
    var el = document.querySelector('#header .header_language');
    if (el) el.innerHTML = pillHTML(isEn);

    // Mobile header
    var func = document.querySelector('.ueeshop_responsive_header .header .func');
    if (func && !func.querySelector('.ls-mobile-pill')) {
      var pill = document.createElement('div');
      pill.className = 'ls-mobile-pill';
      pill.innerHTML = pillHTML(isEn);
      func.insertBefore(pill, func.firstChild);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwitcher);
  } else {
    initSwitcher();
  }
})();

// Mark application page for scoped CSS
(function () {
  if (window.location.pathname.indexOf('%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D0%BD%D0%B5%D0%BD%D0%B8%D0%B5') !== -1 ||
      window.location.pathname.indexOf('применение') !== -1) {
    document.body.classList.add('page-application');
  }
})();

// Mark EN pages for scoped CSS
(function () {
  if (window.location.pathname.indexOf('/en') === 0) {
    document.body.classList.add('page-en');
  }
})();
