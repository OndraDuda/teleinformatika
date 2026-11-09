// Interakce na stránce. Obsah je napsaný přímo v index.html, skript jen přidává chování.
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Světlý / tmavý režim ----------
  var themeBtn = document.querySelector('.theme-btn');

  function syncThemeLabel() {
    var label = root.getAttribute('data-theme') === 'dark' ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
  }

  if (themeBtn) {
    syncThemeLabel();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('teleinformatika-theme', next); } catch (e) {}
      syncThemeLabel();
    });
  }

  // ---------- Panely v navigaci (Pro žáky a rodiče, mobilní menu) ----------
  var nav = document.querySelector('.nav');
  var studentBtn = document.querySelector('.student-btn');
  var studentPanel = document.getElementById('pro-zaky');
  var menuBtn = document.querySelector('.menu-btn');
  var menuPanel = document.getElementById('mobilni-menu');

  function setPanel(btn, panel, open) {
    if (!btn || !panel) return;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('is-open', open);
  }

  function anyPanelOpen() {
    return (studentPanel && !studentPanel.hidden) || (menuPanel && !menuPanel.hidden);
  }

  function closePanels() {
    setPanel(studentBtn, studentPanel, false);
    setPanel(menuBtn, menuPanel, false);
  }

  if (studentBtn) {
    studentBtn.addEventListener('click', function () {
      var open = studentPanel.hidden;
      setPanel(menuBtn, menuPanel, false);
      setPanel(studentBtn, studentPanel, open);
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = menuPanel.hidden;
      setPanel(studentBtn, studentPanel, false);
      setPanel(menuBtn, menuPanel, open);
    });
  }

  // Klik na odkaz v panelu panel zavře.
  [studentPanel, menuPanel].forEach(function (panel) {
    if (!panel) return;
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) closePanels();
    });
  });

  // Escape a klik mimo navigaci panely zavřou.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !anyPanelOpen()) return;
    var focusBack = menuPanel && !menuPanel.hidden ? menuBtn : studentBtn;
    closePanels();
    if (focusBack) focusBack.focus();
  });

  document.addEventListener('click', function (e) {
    if (anyPanelOpen() && !nav.contains(e.target)) closePanels();
  });

  // ---------- Scroll: schovávání navigace, tlačítko nahoru, aktivní položka menu ----------
  var peek = document.querySelector('.nav-peek');
  var toTop = document.querySelector('.to-top');
  var obory = document.getElementById('obory');
  var navItems = document.querySelectorAll('[data-nav]');
  var lastY = window.pageYOffset || 0;
  var acc = 0;
  var ticking = false;
  var navHidden = false;
  var activeSection = 'uvod';

  function setNavHidden(hidden) {
    if (hidden === navHidden) return;
    navHidden = hidden;
    nav.classList.toggle('nav-hidden', hidden);
    peek.classList.toggle('nav-peek-on', hidden);
    peek.setAttribute('aria-hidden', hidden ? 'false' : 'true');
    peek.tabIndex = hidden ? 0 : -1;
  }

  function setActive(section) {
    if (section === activeSection) return;
    activeSection = section;
    for (var i = 0; i < navItems.length; i++) {
      var el = navItems[i];
      var on = el.getAttribute('data-nav') === section;
      el.classList.toggle(el.classList.contains('mlink') ? 'mlink-on' : 'navlink-on', on);
    }
  }

  function onScroll() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var d = y - lastY;
    lastY = y;

    var showTop = y > 700;
    toTop.classList.toggle('to-top-on', showTop);
    toTop.setAttribute('aria-hidden', showTop ? 'false' : 'true');
    toTop.tabIndex = showTop ? 0 : -1;

    var section = 'uvod';
    if (obory) {
      var r = obory.getBoundingClientRect();
      var mid = window.innerHeight * 0.4;
      if (r.top <= mid && r.bottom > mid) section = 'obory';
    }
    setActive(section);

    if (y < 80) {
      acc = 0;
      setNavHidden(false);
    } else {
      acc = (d > 0) === (acc > 0) ? acc + d : d;
      if (!navHidden && acc > 40 && !anyPanelOpen()) { acc = 0; setNavHidden(true); }
      else if (navHidden && acc < -30) { acc = 0; setNavHidden(false); }
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  peek.addEventListener('click', function () { acc = 0; setNavHidden(false); });

  // Fokus klávesnicí na skrytou navigaci ji zase ukáže.
  document.addEventListener('focusin', function (e) {
    if (navHidden && nav.contains(e.target)) setNavHidden(false);
  });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    var brand = document.querySelector('.brand');
    if (brand) brand.focus({ preventScroll: true });
  });

  // ---------- Akce: Dnes / Zítra, proběhlé akce se skryjí ----------
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  var lists = document.querySelectorAll('.js-events');
  for (var l = 0; l < lists.length; l++) {
    var items = lists[l].querySelectorAll('[data-date]');
    var visible = 0;
    for (var j = 0; j < items.length; j++) {
      var item = items[j];
      var p = item.getAttribute('data-date').split('-');
      var date = new Date(+p[0], +p[1] - 1, +p[2]);
      var diff = Math.round((date - today) / 864e5);
      if (diff < 0) { item.hidden = true; continue; }
      visible++;
      var meta = item.querySelector('[data-meta]');
      if (diff === 0) item.classList.add('is-today');
      if (meta && diff <= 1) {
        var text = meta.getAttribute('data-meta');
        meta.textContent = (diff === 0 ? 'Dnes, ' : 'Zítra, ') + text.charAt(0).toLowerCase() + text.slice(1);
      }
    }
    if (!visible) {
      lists[l].hidden = true;
      var empty = lists[l].parentNode.querySelector('.week-empty');
      if (empty) empty.hidden = false;
    }
  }

  // ---------- Rubriky aktualit ----------
  var newsTabs = document.querySelectorAll('.tabs .tab');
  var feat = document.querySelector('.g-feat');
  var newsItems = document.querySelectorAll('.g-feat [data-cat]');
  var emptyBox = document.querySelector('.empty');
  var emptyCat = document.querySelector('.empty-cat');

  for (var n = 0; n < newsTabs.length; n++) {
    newsTabs[n].addEventListener('click', function () {
      var cat = this.getAttribute('data-cat');
      for (var a = 0; a < newsTabs.length; a++) {
        var on = newsTabs[a] === this;
        newsTabs[a].classList.toggle('tab-on', on);
        newsTabs[a].setAttribute('aria-selected', on ? 'true' : 'false');
      }
      var count = 0;
      for (var b = 0; b < newsItems.length; b++) {
        var match = cat === 'Vše' || newsItems[b].getAttribute('data-cat') === cat;
        newsItems[b].hidden = !match;
        if (match) count++;
      }
      feat.hidden = count === 0;
      emptyBox.hidden = count > 0;
      emptyCat.textContent = cat;
    });
  }

  // ---------- Sekce se jemně objeví, když dojedou do zorného pole ----------
  var reveal = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) {
    for (var v = 0; v < reveal.length; v++) reveal[v].classList.add('rv-in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('rv-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    for (var w = 0; w < reveal.length; w++) io.observe(reveal[w]);
  }
})();
