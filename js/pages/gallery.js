/* ============================================================
   王明课题组 — 实验室相册页脚本
   按文件夹层级渲染，每个图片组为一个轮播
   ============================================================ */

/* ---- 排序：课题组活动 > 毕业留念 > 学术活动 ---- */
var FOLDER_ORDER = ["lab", "graduation", "academic"];

function sortFolders(folders) {
  return (folders || []).slice().sort(function(a, b) {
    var ai = FOLDER_ORDER.indexOf(a.name);
    var bi = FOLDER_ORDER.indexOf(b.name);
    if (ai === -1) ai = 99;
    if (bi === -1) bi = 99;
    return ai - bi;
  });
}

/* ---- 构建一个轮播的 HTML ---- */
function buildCarousel(images, carouselId, label) {
  if (!images || !images.length) return "";

  var slidesHtml = images.map(function(img, i) {
    var active = i === 0 ? " active" : "";
    return '\
      <div class="gc-slide' + active + '" data-index="' + i + '">\
        <div class="gc-slide-img-wrap">\
          <img class="gc-slide-img" src="' + img.path + '" alt="' + label + ' ' + (i + 1) + '" loading="lazy" />\
        </div>\
      </div>';
  }).join("");

  var dotsHtml = images.map(function(_, i) {
    var active = i === 0 ? " active" : "";
    return '<button class="gc-dot' + active + '" type="button" data-index="' + i + '"></button>';
  }).join("");

  return '\
    <div class="gallery-carousel" id="' + carouselId + '" data-total="' + images.length + '" data-index="0">\
      <button class="gc-arrow gc-prev" type="button" aria-label="上一张">&lsaquo;</button>\
      <div class="gc-frame">\
        <div class="gc-slides">' + slidesHtml + '</div>\
      </div>\
      <button class="gc-arrow gc-next" type="button" aria-label="下一张">&rsaquo;</button>\
      <div class="gc-dots">' + dotsHtml + '</div>\
    </div>';
}

/* ---- 车车 ID 计数器 ---- */
var carouselIdCounter = 0;

/* ---- 递归渲染一个文件夹模块 ---- */
function renderFolder(folder, depth) {
  var hasImages = folder.images && folder.images.length > 0;
  var hasChildren = folder.children && folder.children.length > 0;
  if (!hasImages && !hasChildren) return "";

  var html = "";
  var headingTag = depth === 0 ? "h2" : "h3";
  var sectionClass = depth === 0 ? "gl-section" : "gl-subsection";

  html += '<section class="' + sectionClass + '">';
  var label = resolveI18n(currentLang, "gallery." + folder.name);
  if (typeof label !== 'string') label = folder.name;
  html += '<' + headingTag + ' class="gl-section-title">' + label + '</' + headingTag + '>';

  /* 本层图片 → 一个轮播 */
  if (hasImages) {
    var cid = "gc-" + (++carouselIdCounter);
    html += buildCarousel(folder.images, cid, folder.name);
  }

  /* 子文件夹：两列网格排列 */
  if (hasChildren) {
    var sorted = sortFolders(folder.children);
    html += '<div class="gl-subgrid">';
    sorted.forEach(function(child) {
      html += renderFolder(child, depth + 1);
    });
    html += '</div>';
  }

  html += '</section>';
  return html;
}

/* ---- 渲染整个画廊 ---- */
function renderGallery() {
  var el = document.getElementById("galleryMain");
  if (!el) return;

  var data = sortFolders(GALLERY_DATA || []);
  var html = data.map(function(folder) {
    return renderFolder(folder, 0);
  }).join("");

  el.innerHTML = html || '<p class="empty-state">' + t("gallery.empty") + '</p>';

  /* 绑定所有轮播事件 */
  setupAllCarousels();
}

/* ---- 轮播控制 ---- */
var carouselTimers = {};

function setupAllCarousels() {
  document.querySelectorAll(".gallery-carousel").forEach(function(carousel) {
    var id = carousel.id;
    var total = parseInt(carousel.getAttribute("data-total"));
    if (!total) return;

    /* 箭头 */
    carousel.querySelector(".gc-prev") && carousel.querySelector(".gc-prev").addEventListener("click", function() {
      moveCarousel(id, -1);
    });
    carousel.querySelector(".gc-next") && carousel.querySelector(".gc-next").addEventListener("click", function() {
      moveCarousel(id, 1);
    });

    /* 圆点 */
    carousel.querySelectorAll(".gc-dot").forEach(function(dot) {
      dot.addEventListener("click", function() {
        var idx = parseInt(dot.getAttribute("data-index"));
        jumpCarousel(id, idx);
      });
    });

    /* 自动播放 */
    startCarouselTimer(id);
  });
}

function getCarouselState(id) {
  var el = document.getElementById(id);
  if (!el) return null;
  return {
    el: el,
    total: parseInt(el.getAttribute("data-total")),
    index: parseInt(el.getAttribute("data-index"))
  };
}

function updateCarouselDOM(id, newIndex) {
  var state = getCarouselState(id);
  if (!state) return;
  state.el.setAttribute("data-index", newIndex);
  var slides = state.el.querySelectorAll(".gc-slide");
  var dots = state.el.querySelectorAll(".gc-dot");
  slides.forEach(function(s, i) { s.classList.toggle("active", i === newIndex); });
  dots.forEach(function(d, i) { d.classList.toggle("active", i === newIndex); });
}

function moveCarousel(id, step) {
  var state = getCarouselState(id);
  if (!state) return;
  var newIdx = (state.index + step + state.total) % state.total;
  updateCarouselDOM(id, newIdx);
  restartCarouselTimer(id);
}

function jumpCarousel(id, idx) {
  updateCarouselDOM(id, idx);
  restartCarouselTimer(id);
}

function startCarouselTimer(id) {
  if (carouselTimers[id]) clearInterval(carouselTimers[id]);
  carouselTimers[id] = setInterval(function() { moveCarousel(id, 1); }, 5000);
}

function restartCarouselTimer(id) {
  startCarouselTimer(id);
}

/* ---- Init ---- */
initCommon(renderGallery);
renderGallery();
