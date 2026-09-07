/* Первый экран главной: смена трёх слайдов.

   Текст и характеристики берутся из блока JSON рядом с разметкой, картинки
   переключаются среди уже отрисованных — при смене слайда ничего не грузится
   заново и не мигает. Первый слайд полностью лежит в вёрстке, поэтому без
   скрипта экран остаётся осмысленным. */
(function () {
  'use strict';

  var STEP = 7000;

  function init() {
    var hero = document.querySelector('[data-dzh-hero]');
    var data = hero && hero.querySelector('[data-dzh-hero-data]');
    if (!hero || !data) return;

    var slides;
    try {
      slides = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }
    if (slides.length < 2) return;

    var frames = hero.querySelectorAll('.dzh-hero__frame');
    var shots = hero.querySelectorAll('.dzh-hero__shot');
    var dots = hero.querySelectorAll('[data-dzh-dot]');
    var text = hero.querySelector('[data-dzh-text]');
    var eyebrow = hero.querySelector('[data-dzh-eyebrow]');
    var title = hero.querySelector('[data-dzh-title]');
    var lede = hero.querySelector('[data-dzh-lede]');
    var caption = hero.querySelector('[data-dzh-caption]');
    var mark = hero.querySelector('[data-dzh-mark]');
    var specs = hero.querySelector('[data-dzh-specs]');
    var cta = hero.querySelector('[data-dzh-cta]');
    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    var current = 0;
    var timer = null;
    var held = false;

    hero.style.setProperty('--h-hero-step', STEP + 'ms');
    hero.classList.add('dzh-hero--anim');

    function paintTitle(value) {
      title.innerHTML = '';
      value.split('\n').forEach(function (part) {
        var line = document.createElement('span');
        line.className = 'dzh-hero__line';
        var inner = document.createElement('span');
        inner.textContent = part;
        line.appendChild(inner);
        title.appendChild(line);
      });
    }

    function paintSpecs(rows) {
      specs.innerHTML = '';
      rows.forEach(function (row) {
        var li = document.createElement('li');
        var value = document.createElement('b');
        value.textContent = row[0];
        var note = document.createElement('span');
        note.textContent = row[1];
        li.appendChild(value);
        li.appendChild(note);
        specs.appendChild(li);
      });
    }

    /* Перезапуск css-анимации: без снятия класса и принудительной перерисовки
       браузер считает, что она уже проиграна, и второй раз её не покажет. */
    function replay(node) {
      node.classList.remove('is-live');
      void node.offsetWidth;
      node.classList.add('is-live');
    }

    function show(index) {
      var slide = slides[index];
      if (!slide) return;
      current = index;

      Array.prototype.forEach.call(frames, function (frame, i) {
        frame.classList.toggle('is-on', i === index);
      });
      Array.prototype.forEach.call(shots, function (shot, i) {
        shot.classList.toggle('is-on', i === index);
      });
      Array.prototype.forEach.call(dots, function (dot, i) {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });

      eyebrow.textContent = slide.eyebrow;
      paintTitle(slide.title);
      lede.textContent = slide.lede;
      caption.textContent = slide.caption;
      mark.textContent = slide.mark;
      paintSpecs(slide.specs);
      cta.setAttribute('href', slide.cta[1]);
      cta.querySelector('span').textContent = slide.cta[0];

      replay(text);
      replay(specs);
    }

    function stop() {
      window.clearTimeout(timer);
      timer = null;
      hero.classList.remove('dzh-hero--playing');
    }

    function play() {
      stop();
      if (held || calm.matches || document.hidden) return;
      hero.classList.add('dzh-hero--playing');
      timer = window.setTimeout(function () {
        show((current + 1) % slides.length);
        play();
      }, STEP);
    }

    Array.prototype.forEach.call(dots, function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        play();
      });
    });

    /* Мышь показ не трогает: наведение на блок — обычное дело, и останавливать
       из-за него перелистывание нельзя.

       Пауза нужна только там, где содержимое меняется под руками: это левая
       колонка со ссылкой, у которой на каждом слайде свой адрес. Номера слайдов
       от смены не страдают, поэтому клик по номеру показ не останавливает. */
    function inText(node) {
      return !!(node && node.closest && node.closest('.dzh-hero__text'));
    }

    hero.addEventListener('focusin', function (event) {
      if (!inText(event.target)) return;
      held = true;
      stop();
    });
    hero.addEventListener('focusout', function (event) {
      if (!held || inText(event.relatedTarget)) return;
      held = false;
      play();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else play();
    });
    if (calm.addEventListener) calm.addEventListener('change', play);

    replay(text);
    replay(specs);
    play();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
