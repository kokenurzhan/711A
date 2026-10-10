/* GNS — общий скрипт сайта */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Открытие сайта с диска (file://): ссылки вида "foam/" → "foam/index.html"
  if (location.protocol === "file:") {
    $$("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (!/^(https?:|mailto:|tel:|#|javascript:)/.test(h) && /\/$|^\.\.?$/.test(h)) a.setAttribute("href", h.replace(/\/?$/, "/") + "index.html");
    });
  }

  // Мобильное меню
  var burger = $(".burger"), menu = $(".menu");
  if (burger) burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });

  // Аналитика (Meta Pixel): клики по WhatsApp и Kaspi
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !window.fbq) return;
    if (a.href.indexOf("wa.me") > -1) fbq("track", "Contact");
    else if (a.href.indexOf("kaspi.kz") > -1) fbq("trackCustom", "KaspiClick", { product: document.body.dataset.product || "" });
  });

  // ===== Баннер: играет только активный слайд, следующий — когда видео закончилось =====
  var hero = $(".s1");
  if (hero) {
    var slides = $$(".s1__slide", hero), dots = $$(".s1__dots button", hero), cur = 0, fallback;
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var v = $("video", s), on = k === cur;
        s.classList.toggle("on", on);
        s.setAttribute("aria-hidden", !on);
        if (on) { v.preload = "auto"; try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
      dots.forEach(function (d, k) { d.classList.toggle("on", k === cur); });
      var nxt = $("video", slides[(cur + 1) % slides.length]);
      if (nxt.preload === "none") nxt.preload = "metadata";
      clearTimeout(fallback);                 // если видео не играет (экономия трафика) — листаем по таймеру
      fallback = setTimeout(function () { var v = $("video", slides[cur]); if (v.paused) go(cur + 1); }, 9000);
    };
    slides.forEach(function (s) { $("video", s).addEventListener("ended", function () { go(cur + 1); }); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); }); });
    $(".s1__arr--l", hero).addEventListener("click", function () { go(cur - 1); });
    $(".s1__arr--r", hero).addEventListener("click", function () { go(cur + 1); });
    // свайп на телефоне
    var x0 = null;
    hero.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    });
    // не тратим трафик, когда баннер не виден
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) {
      var v = $("video", slides[cur]);
      if (en[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    }).observe(hero);
    go(0);
  }

  // ===== Окно просмотра (видео / фото / YouTube) =====
  var modal = $("#modal"), box = modal && $(".modal__box", modal), gallery = [], gi = 0;
  function show(item) {
    if (item.type === "video") box.innerHTML = '<video controls autoplay playsinline poster="' + item.poster + '" src="' + item.src + '"></video>';
    else if (item.type === "yt") box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + item.src + '?autoplay=1&rel=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    else box.innerHTML = '<img src="' + item.src + '" alt="">';
    $$(".modal__nav", modal).forEach(function (b) { b.hidden = gallery.length < 2; });
  }
  function open(list, i) {
    gallery = list; gi = i; show(gallery[gi]);
    modal.classList.add("on"); document.body.style.overflow = "hidden";
  }
  function close() { modal.classList.remove("on"); box.innerHTML = ""; document.body.style.overflow = ""; }
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    $(".modal__x", modal).addEventListener("click", close);
    $(".modal__nav--l", modal).addEventListener("click", function () { gi = (gi - 1 + gallery.length) % gallery.length; show(gallery[gi]); });
    $(".modal__nav--r", modal).addEventListener("click", function () { gi = (gi + 1) % gallery.length; show(gallery[gi]); });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && gallery.length > 1) { gi = (gi + 1) % gallery.length; show(gallery[gi]); }
      if (e.key === "ArrowLeft" && gallery.length > 1) { gi = (gi - 1 + gallery.length) % gallery.length; show(gallery[gi]); }
    });
  }
  // галереи: карусель видео и фото-пазл — открываются в окне просмотра
  $$("[data-gallery]").forEach(function (g) {
    var btns = $$("button[data-type]", g);
    var items = btns.map(function (b) { return { type: b.dataset.type, src: b.dataset.src, poster: b.dataset.poster || "" }; });
    btns.forEach(function (b, i) { b.addEventListener("click", function () { open(items, i); }); });
  });
  // стрелки каруселей
  $$(".reel").forEach(function (reel) {
    $$(".arrs button", reel.parentNode).forEach(function (b) {
      b.addEventListener("click", function () { reel.scrollBy({ left: (b.dataset.dir === "l" ? -1 : 1) * reel.clientWidth * 0.8, behavior: "smooth" }); });
    });
  });
  // видео о заводе
  $$("[data-about]").forEach(function (b) {
    b.addEventListener("click", function () {
      open([{ type: b.dataset.type, src: b.dataset.src, poster: b.dataset.poster || "" }], 0);
    });
  });

  // ===== Варианты товара: меняют фото, подпись и блоки с data-v =====
  $$(".variants").forEach(function (wrap) {
    var btns = $$("button", wrap), img = $("#pimg"), note = $(".vnote");
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
        if (b.dataset.img) { img.src = b.dataset.img; img.hidden = false; $("#pimg-ph").hidden = true; }
        else { img.hidden = true; $("#pimg-ph").hidden = false; }
        note.textContent = b.dataset.note || "";
        $$("[data-v]").forEach(function (el) { el.hidden = el.dataset.v !== String(i); });
      });
    });
  });
})();
