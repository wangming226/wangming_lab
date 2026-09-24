/* ============================================================
   王明课题组 — 公共脚本 (common.js)
   所有页面共享的基础功能：语言切换、移动导航、返回顶部
   ============================================================ */

var currentLang = localStorage.getItem("wm-lab-lang") || "zh";

/* ---- i18n helper (支持点号路径如 members.phd) ---- */
function resolveI18n(lang, key) {
  var parts = key.split('.');
  var val = SITE_I18N[lang];
  for (var i = 0; i < parts.length; i++) {
    if (val == null) return null;
    val = val[parts[i]];
  }
  return val;
}

function t(key) {
  var val = resolveI18n(currentLang, key);
  return (typeof val === 'string') ? val : key;
}

/* ---- Apply language to static [data-i18n] elements ---- */
function applyLang() {
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    var key = el.getAttribute("data-i18n");
    var val = resolveI18n(currentLang, key);
    if (key && typeof val === 'string') {
      el.textContent = val;
    }
  });
  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === currentLang);
  });
}

/* ---- Mobile nav toggle ---- */
function setupMobileNav() {
  var toggle = document.getElementById("navbarToggle");
  var nav = document.getElementById("headerNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    nav.classList.toggle("open");
    var expanded = nav.classList.contains("open");
    toggle.setAttribute("aria-expanded", String(expanded));
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (window.innerWidth <= 860) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/* ---- Language buttons (accepts optional per-page re-render callback) ---- */
function setupLangButtons(refreshFn) {
  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang-btn");
      if (!lang) return;
      currentLang = lang;
      localStorage.setItem("wm-lab-lang", currentLang);
      applyLang();
      if (typeof refreshFn === "function") refreshFn();
    });
  });
}

/* ---- Throttled scroll helper ---- */
function onScroll(fn) {
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        fn();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ---- Back to top ---- */
function setupBackToTop() {
  var btn = document.getElementById("backToTop");
  if (!btn) return;
  onScroll(function () {
    btn.classList.toggle("visible", window.scrollY > 400);
  });
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---- Footer year ---- */
function setupFooterYear() {
  var el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ---- Init common features ---- */
function initCommon(refreshFn) {
  setupMobileNav();
  setupLangButtons(refreshFn);
  setupBackToTop();
  setupFooterYear();
  applyLang();
}
