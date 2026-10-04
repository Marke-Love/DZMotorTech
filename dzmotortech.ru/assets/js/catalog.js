/* Каталог продукции: живой поиск по моделям и подсветка активной категории.
   Ванильный JS, без зависимостей — jQuery на странице есть, но здесь не нужен. */
(function () {
  'use strict';

  var root = document.querySelector('[data-dzc-catalog]');
  if (!root) return;

  var sections = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-section]'));
  var tiles = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-tile]'));
  var chips = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-chip]'));
  var input = root.querySelector('[data-dzc-search]');
  var clearButton = root.querySelector('[data-dzc-search-clear]');
  var empty = root.querySelector('[data-dzc-empty]');
  var tilesSection = root.querySelector('#dzc-categories');
  var emptyQuery = root.querySelector('[data-dzc-empty-query]');
  var counter = root.querySelector('[data-dzc-count]');
  var counterLine = root.querySelector('[data-dzc-count-line]');
  var totalModels = Number(root.getAttribute('data-dzc-total')) || 0;

  /* --- поиск ------------------------------------------------------------ */

  function normalise(value) {
    return (value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }

  /* --- подбор по параметрам ---------------------------------------------

     У каждого товара в data-f-* лежат параметры из описания серии:
     p — мощность «от до» в кВт, u — напряжение «от до» в вольтах,
     ip — степени защиты, ex — виды взрывозащиты (any — есть любая),
     ie — классы энергоэффективности. Пустое значение — в описании не указано:
     такая модель при выборе этого параметра скрывается. */

  var filterBox = root.querySelector('[data-dzc-filter]');
  var filterToggle = root.querySelector('[data-dzc-ftoggle]');
  var filterCount = root.querySelector('[data-dzc-fcount]');
  var powerInput = root.querySelector('[data-f-power]');
  var emptySearch = root.querySelector('[data-dzc-empty-search]');
  var emptyFilter = root.querySelector('[data-dzc-empty-filter]');
  var state = { power: null, cat: '', volt: '', ex: '', ip: '', ie: '' };

  function nums(item, name) {
    var raw = item.getAttribute('data-f-' + name) || '';
    return raw ? raw.split(' ') : [];
  }

  function matchFilters(item) {
    if (state.power !== null) {
      var p = nums(item, 'p').map(Number);
      if (!p.length || state.power < p[0] || state.power > p[p.length - 1]) return false;
    }
    if (state.volt) {
      var u = nums(item, 'u').map(Number);
      if (!u.length) return false;
      var lo = u[0], hi = u[u.length - 1];
      if (state.volt === 'lv' ? lo > 1140 : state.volt === 'hv' ? hi <= 10000 : (lo > +state.volt || hi < +state.volt)) return false;
    }
    if (state.ex && nums(item, 'ex').indexOf(state.ex) === -1) return false;
    if (state.ip) {
      var need = state.ip;
      var okIp = nums(item, 'ip').some(function (v) { return v[0] >= need[0] && v[1] >= need[1]; });
      if (!okIp) return false;
    }
    if (state.ie) {
      var okIe = nums(item, 'ie').some(function (v) { return +v >= +state.ie; });
      if (!okIe) return false;
    }
    return true;
  }

  function activeFilters() {
    return (state.power !== null ? 1 : 0) + ['cat', 'volt', 'ex', 'ip', 'ie'].filter(function (k) { return state[k]; }).length;
  }

  var lastQuery = '';

  function applySearch(rawQuery) {
    lastQuery = rawQuery;
    var query = normalise(rawQuery);
    var terms = query ? query.split(' ') : [];
    var filtering = activeFilters() > 0;
    var visibleModels = 0;
    var visibleSections = 0;

    sections.forEach(function (section) {
      var items = section.querySelectorAll('[data-dzc-item]');
      var shown = 0;

      var outOfType = state.cat && section.id !== state.cat;
      Array.prototype.forEach.call(items, function (item) {
        var haystack = item.getAttribute('data-dzc-item') || '';
        var hit = terms.every(function (term) { return haystack.indexOf(term) !== -1; }) && !outOfType && (!filtering || matchFilters(item));
        item.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });

      section.classList.toggle('is-hidden', shown === 0);
      if (shown) {
        visibleSections++;
        visibleModels += shown;
      }

      var id = section.id;
      chips.forEach(function (chip) {
        if (chip.getAttribute('href') === '#' + id) {
          chip.classList.toggle('is-hidden', shown === 0);
        }
      });
      tiles.forEach(function (tile) {
        if (tile.getAttribute('href') === '#' + id) {
          tile.classList.toggle('is-hidden', shown === 0);
        }
      });
    });

    // Заголовок «Выберите тип оборудования» без единой плитки выглядит поломкой.
    if (tilesSection) {
      tilesSection.classList.toggle('is-hidden', visibleSections === 0);
    }
    var narrowing = terms.length > 0 || filtering;
    if (empty) {
      empty.classList.toggle('is-visible', visibleSections === 0);
      if (emptyQuery) emptyQuery.textContent = rawQuery;
      // без текста запроса фраза «По запросу „“» выглядела бы поломкой
      if (emptySearch) emptySearch.hidden = !terms.length;
      if (emptyFilter) emptyFilter.hidden = !!terms.length;
    }
    root.classList.toggle('is-searching', narrowing);
    if (counter) {
      counter.textContent = String(narrowing ? visibleModels : totalModels);
    }
    if (counterLine) {
      counterLine.hidden = !narrowing;
    }
    if (filterCount) {
      var n = activeFilters();
      filterCount.hidden = !n;
      filterCount.textContent = String(n);
    }
    if (clearButton) {
      clearButton.classList.toggle('is-visible', terms.length > 0);
    }
  }

  if (input) {
    var pending = null;
    input.addEventListener('input', function () {
      window.clearTimeout(pending);
      var value = input.value;
      pending = window.setTimeout(function () { applySearch(value); }, 90);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        input.value = '';
        applySearch('');
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      if (!input) return;
      input.value = '';
      applySearch('');
      input.focus();
    });
  }

  if (filterBox && filterToggle) {
    var bar = filterToggle.closest('.dzc-bar');
    function setOpen(open) {
      filterBox.hidden = !open;
      filterToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (bar) bar.classList.toggle('is-filter-open', open);
    }
    filterToggle.addEventListener('click', function () { setOpen(filterBox.hidden); });

    // На компьютере фильтр открыт сразу, на телефоне свёрнут: раскрытый он
    // занимает целый экран над списком моделей.
    if (window.matchMedia('(max-width: 900px)').matches) setOpen(false);

    // Кнопка у заголовка страницы: раскрыть фильтр и прокрутить к нему.
    var jump = root.querySelector('[data-dzc-fjump]');
    if (jump) {
      jump.addEventListener('click', function (event) {
        event.preventDefault();
        setOpen(true);
        (bar || filterBox).scrollIntoView({ block: 'start', behavior: 'smooth' });
        if (powerInput) window.setTimeout(function () { powerInput.focus({ preventScroll: true }); }, 400);
      });
    }

    // В группе выбрана одна кнопка; «Не важно» снимает условие.
    filterBox.addEventListener('click', function (event) {
      var chip = event.target.closest('.dzc-fchip');
      if (chip) {
        var key = ['cat', 'volt', 'ex', 'ip', 'ie'].filter(function (k) { return chip.hasAttribute('data-f-' + k); })[0];
        state[key] = chip.getAttribute('data-f-' + key);
        Array.prototype.forEach.call(chip.parentNode.children, function (b) {
          b.setAttribute('aria-pressed', b === chip ? 'true' : 'false');
        });
        applySearch(lastQuery);
        return;
      }
      if (event.target.closest('[data-f-reset]')) {
        state = { power: null, cat: '', volt: '', ex: '', ip: '', ie: '' };
        if (powerInput) powerInput.value = '';
        Array.prototype.forEach.call(filterBox.querySelectorAll('.dzc-fchip'), function (b) {
          var key = ['cat', 'volt', 'ex', 'ip', 'ie'].filter(function (k) { return b.hasAttribute('data-f-' + k); })[0];
          b.setAttribute('aria-pressed', b.getAttribute('data-f-' + key) === '' ? 'true' : 'false');
        });
        applySearch(lastQuery);
      }
    });

    if (powerInput) {
      var powerPending = null;
      powerInput.addEventListener('input', function () {
        window.clearTimeout(powerPending);
        powerPending = window.setTimeout(function () {
          var v = parseFloat(String(powerInput.value).replace(',', '.'));
          state.power = isFinite(v) && v > 0 ? v : null;
          applySearch(lastQuery);
        }, 150);
      });
    }
  }

  /* --- «Показать ещё» в списках категорий -------------------------------- */

  Array.prototype.forEach.call(root.querySelectorAll('[data-dzc-more]'), function (button) {
    button.addEventListener('click', function () {
      var section = button.closest('[data-dzc-section]');
      if (!section) return;

      var expanded = section.classList.toggle('is-expanded');
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.textContent = expanded
        ? button.getAttribute('data-dzc-less-label')
        : button.getAttribute('data-dzc-more-label');

      // Сворачивая длинный список, возвращаем пользователя к началу раздела,
      // иначе он окажется где-то посреди следующей категории.
      if (!expanded) {
        var top = section.getBoundingClientRect().top;
        if (top < 0) section.scrollIntoView({ block: 'start' });
      }
    });
  });

  /* --- кнопка «наверх» --------------------------------------------------- */

  var topButton = root.querySelector('[data-dzc-top]');
  if (topButton) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    window.addEventListener('scroll', function () {
      topButton.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });

    topButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* --- подсветка активной категории ------------------------------------- */

  var chipStrip = root.querySelector('[data-dzc-chips]');
  var activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;

    chips.forEach(function (chip) {
      var isActive = chip.getAttribute('href') === '#' + id;
      chip.classList.toggle('is-active', isActive);

      // Активный чип подтягиваем внутри самой ленты, не трогая прокрутку страницы.
      if (isActive && chipStrip) {
        var chipBox = chip.getBoundingClientRect();
        var stripBox = chipStrip.getBoundingClientRect();
        if (chipBox.left < stripBox.left) {
          chipStrip.scrollLeft -= stripBox.left - chipBox.left + 16;
        } else if (chipBox.right > stripBox.right) {
          chipStrip.scrollLeft += chipBox.right - stripBox.right + 16;
        }
      }
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var visible = Object.create(null);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible[entry.target.id] = entry.boundingClientRect.top;
        } else {
          delete visible[entry.target.id];
        }
      });

      var ids = Object.keys(visible);
      if (!ids.length) return;
      ids.sort(function (a, b) { return visible[a] - visible[b]; });
      setActive(ids[0]);
    }, { rootMargin: '-96px 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }
}());
