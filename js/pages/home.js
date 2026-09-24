/* ============================================================
   王明课题组 — 首页脚本
   ============================================================ */

/* ---- Banner slider ---- */
var bannerIndex = 0;
var bannerTimer = null;
var bannerSlides = [];

function initBanner() {
  var container = document.getElementById("homeBanner");
  var dots = document.getElementById("bannerDots");
  if (!container || !dots) return;

  var bannerImages = [
    "./assets/banners/home.jpg"
  ];

  container.innerHTML = bannerImages.map(function(src, i) {
    return '<div class="banner-slide' + (i === 0 ? ' active' : '') + '">' +
      '<img src="' + src + '" alt="Banner" />' +
      '</div>';
  }).join("");

  bannerSlides = container.querySelectorAll(".banner-slide");

  if (bannerImages.length <= 1) {
    dots.style.display = "none";
    return;
  }

  dots.innerHTML = bannerImages.map(function(_, i) {
    return '<button class="banner-dot' + (i === 0 ? ' active' : '') + '" type="button" data-index="' + i + '"></button>';
  }).join("");

  dots.querySelectorAll(".banner-dot").forEach(function(dot) {
    dot.addEventListener("click", function() {
      bannerIndex = parseInt(dot.getAttribute("data-index"));
      updateBanner();
      restartBannerTimer();
    });
  });

  startBannerTimer();
}

function updateBanner() {
  bannerSlides.forEach(function(s, i) { s.classList.toggle("active", i === bannerIndex); });
  var dots = document.querySelectorAll("#bannerDots .banner-dot");
  dots.forEach(function(d, i) { d.classList.toggle("active", i === bannerIndex); });
}

function moveBanner(step) {
  if (bannerSlides.length <= 1) return;
  bannerIndex = (bannerIndex + step + bannerSlides.length) % bannerSlides.length;
  updateBanner();
  restartBannerTimer();
}

function startBannerTimer() {
  if (bannerTimer) clearInterval(bannerTimer);
  if (bannerSlides.length > 1) {
    bannerTimer = setInterval(function() { moveBanner(1); }, 5000);
  }
}

function restartBannerTimer() { startBannerTimer(); }

/* ---- Progress carousel (top 3 papers, full-view TOC images) ---- */
var progressIndex = 0;
var progressTimer = null;

function renderProgress() {
  var slides = document.getElementById("progressSlides");
  var dots = document.getElementById("progressDots");
  if (!slides || !dots) return;
  var papers = PAPER_DATA.filter(function(p) { return p.toc && p.toc.trim(); }).slice(-3);
  slides.innerHTML = papers.map(function(paper, i) {
    var d = paper[currentLang];
    var tocPath = paper.toc || "";
    var tocHtml = tocPath
      ? '<img class="pc-toc" src="' + tocPath + '" alt="TOC" loading="lazy" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'grid\';" /><span class="pc-toc-fallback" style="display:none;">TOC</span>'
      : '<span class="pc-toc-fallback">TOC</span>';
    var active = i === progressIndex ? " active" : "";
    return '<div class="pc-slide' + active + '">\
      <div class="pc-toc-wrap">' + tocHtml + '</div>\
      <div class="pc-info">\
        <div class="pc-date">' + paper.date + ' &middot; ' + d.journal + '</div>\
        <div class="pc-title"><a href="./paper.html?id=' + paper.id + '">' + d.title + '</a></div>\
        <p class="pc-abstract">' + (d.abstract || "") + '</p>\
      </div>\
    </div>';
  }).join("");

  dots.innerHTML = papers.map(function(_, i) {
    var active = i === progressIndex ? " active" : "";
    return '<button class="pc-dot' + active + '" type="button" data-index="' + i + '"></button>';
  }).join("");

  dots.querySelectorAll(".pc-dot").forEach(function(dot) {
    dot.addEventListener("click", function() {
      progressIndex = parseInt(dot.getAttribute("data-index"));
      renderProgress();
      restartProgressTimer();
    });
  });

  /* Slide click is now handled by zone-based delegation on .pc-frame */
}

function moveProgress(step) {
  var papers = PAPER_DATA.filter(function(p) { return p.toc && p.toc.trim(); }).slice(-3);
  progressIndex = (progressIndex + step + papers.length) % papers.length;
  renderProgress();
  restartProgressTimer();
}

function startProgressTimer() {
  if (progressTimer) clearInterval(progressTimer);
  progressTimer = setInterval(function() { moveProgress(1); }, 6000);
}

function restartProgressTimer() { startProgressTimer(); }

/* Zone-based click: left 25% prev / center 50% go paper / right 25% next */
function setupProgressControls() {
  var carousel = document.getElementById("progressCarousel");
  if (!carousel) return;

  /* Mousemove — update cursor hint */
  carousel.addEventListener("mousemove", function(e) {
    var frame = carousel.querySelector(".pc-frame");
    if (!frame) return;
    var rect = frame.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;
    carousel.classList.remove("pc-zone-left", "pc-zone-center", "pc-zone-right");
    if (x < 0.25) carousel.classList.add("pc-zone-left");
    else if (x > 0.75) carousel.classList.add("pc-zone-right");
    else carousel.classList.add("pc-zone-center");
  });

  carousel.addEventListener("mouseleave", function() {
    carousel.classList.remove("pc-zone-left", "pc-zone-center", "pc-zone-right");
  });

  /* Click delegation */
  carousel.addEventListener("click", function(e) {
    if (e.target.closest(".pc-dots") || e.target.closest("a")) return;
    var frame = carousel.querySelector(".pc-frame");
    if (!frame) return;
    var rect = frame.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;

    if (x < 0.25) {
      moveProgress(-1);
    } else if (x > 0.75) {
      moveProgress(1);
    } else {
      var papers = PAPER_DATA.filter(function(p) { return p.toc && p.toc.trim(); }).slice(-3);
      if (papers[progressIndex]) {
        window.location.href = "./paper.html?id=" + papers[progressIndex].id;
      }
    }
  });
}

/* ---- Home Gallery carousel ---- */
var galleryIndex = 0;
var galleryTimer = null;

function flattenGalleryTree(folders) {
  var imgs = [];
  (folders || []).forEach(function(f) {
    if (f.images) imgs = imgs.concat(f.images);
    if (f.children) imgs = imgs.concat(flattenGalleryTree(f.children));
  });
  return imgs;
}

function getAllGalleryPhotos() {
  return flattenGalleryTree(GALLERY_DATA);
}

function renderHomeGallery() {
  var slides = document.getElementById("gallerySlides");
  var dots = document.getElementById("galleryDots");
  if (!slides || !dots) return;
  var photos = getAllGalleryPhotos();
  if (!photos.length) return;

  slides.innerHTML = photos.map(function(p, i) {
    var active = i === galleryIndex ? " active" : "";
    return '<div class="gc-slide' + active + '">\
      <div class="gc-slide-img-wrap">\
        <img class="gc-slide-img" src="' + p.path + '" alt="" loading="lazy" />\
      </div>\
    </div>';
  }).join("");

  dots.innerHTML = photos.map(function(_, i) {
    var active = i === galleryIndex ? " active" : "";
    return '<button class="gc-dot' + active + '" type="button" data-index="' + i + '"></button>';
  }).join("");

  dots.querySelectorAll(".gc-dot").forEach(function(dot) {
    dot.addEventListener("click", function() {
      galleryIndex = parseInt(dot.getAttribute("data-index"));
      renderHomeGallery();
      restartGalleryTimer();
    });
  });
}

function moveGallery(step) {
  var photos = getAllGalleryPhotos();
  if (!photos.length) return;
  galleryIndex = (galleryIndex + step + photos.length) % photos.length;
  renderHomeGallery();
  restartGalleryTimer();
}

function startGalleryTimer() {
  if (galleryTimer) clearInterval(galleryTimer);
  galleryTimer = setInterval(function() { moveGallery(1); }, 5000);
}

function restartGalleryTimer() { startGalleryTimer(); }

function setupGalleryControls() {
  document.querySelector(".gc-prev") && document.querySelector(".gc-prev").addEventListener("click", function() { moveGallery(-1); });
  document.querySelector(".gc-next") && document.querySelector(".gc-next").addEventListener("click", function() { moveGallery(1); });
}

/* ---- News badge list ---- */
function renderHomeNews() {
  var list = document.getElementById("homeNewsList");
  if (!list) return;
  var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  list.innerHTML = SITE_NEWS.slice(0, 3).map(function(n) {
    var d = n[currentLang];
    var parts = n.date.split("-");
    var day = parts[2] || "";
    var month = monthNames[parseInt(parts[1] || "1") - 1] || "";
    return '<li class="news-badge-item">\
      <div class="news-badge-time"><span class="day">' + day + '</span><span class="month">' + month + '</span></div>\
      <div class="news-badge-text">\
        <h3>' + d.title + '</h3>\
        <a class="news-more" href="./news-item.html?id=' + n.id + '">' + t("home.learnMore") + '</a>\
      </div>\
    </li>';
  }).join("");
}

/* ---- Research areas list with images ---- */
function renderResearchAreas() {
  var el = document.getElementById("researchAreasList");
  if (!el) return;
  el.innerHTML = RESEARCH_AREAS.map(function(item) {
    var d = item[currentLang];
    return '<li class="research-area-item">\
      <img class="research-img" src="' + item.img + '" alt="' + d.title + '" loading="lazy" />\
      <div class="research-text">\
        <h3>' + d.title + '</h3>\
        <p>' + d.desc + '</p>\
      </div>\
    </li>';
  }).join("");
}

/* ---- Refresh all dynamic content ---- */
function refreshAll() {
  renderProgress();
  renderHomeNews();
  renderResearchAreas();
  renderHomeGallery();
}

/* ---- Init ---- */
setupProgressControls();
setupGalleryControls();
initCommon(refreshAll);
refreshAll();
initBanner();
startProgressTimer();
startGalleryTimer();
