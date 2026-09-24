/* ============================================================
   王明课题组 — 研究成果页脚本
   ============================================================ */

var currentTopic = "all";
var currentYear = "all";
var featuredIndex = 0;
var featuredTimer = null;

/* ---- Featured publications carousel ---- */
function renderFeatured() {
  var slides = document.getElementById("featuredSlides");
  if (!slides) return;

  var featured = PAPER_DATA.filter(function(p) { return p.toc && p.toc.trim(); }).slice(-9);
  if (featured.length === 0) {
    featured = PAPER_DATA.slice(0, 6);
  }

  slides.innerHTML = featured.map(function(paper) {
    var d = paper[currentLang];
    var tocSrc = paper.toc || "";
    return '\
      <div class="featured-card" onclick="window.location.href=\'./paper.html?id=' + paper.id + '\'">\
        <img class="featured-card-img" src="' + tocSrc + '" alt="TOC" loading="lazy" onerror="this.style.background=\'#eaf2fb\';" />\
        <div class="featured-card-body">\
          <h4>' + d.title + '</h4>\
          <p class="feat-journal"><em>' + (d.journal || "") + '</em></p>\
        </div>\
      </div>';
  }).join("");

  var frame = document.querySelector(".featured-frame");
  if (frame && featured.length > 0) {
    featuredIndex = 0;
    updateFeaturedPosition();
  }

  if (featured.length <= 3) {
    var arrows = document.querySelectorAll(".featured-arrow");
    arrows.forEach(function(a) { a.style.display = "none"; });
  }

  startFeaturedTimer();
}

function updateFeaturedPosition() {
  var slides = document.getElementById("featuredSlides");
  var cards = slides ? slides.querySelectorAll(".featured-card") : [];
  if (!cards.length) return;
  var cardWidth = cards[0].offsetWidth + 20;
  var maxIndex = Math.max(0, cards.length - 3);
  if (featuredIndex > maxIndex) featuredIndex = maxIndex;
  slides.style.transform = "translateX(-" + (featuredIndex * cardWidth) + "px)";
}

function moveFeatured(step) {
  var cards = document.querySelectorAll(".featured-card");
  if (!cards.length) return;
  var maxIndex = Math.max(0, cards.length - 3);
  featuredIndex = Math.max(0, Math.min(maxIndex, featuredIndex + step));
  updateFeaturedPosition();
  restartFeaturedTimer();
}

function startFeaturedTimer() {
  if (featuredTimer) clearInterval(featuredTimer);
  var cards = document.querySelectorAll(".featured-card");
  if (cards.length > 3) {
    featuredTimer = setInterval(function() {
      var maxIndex = Math.max(0, cards.length - 3);
      featuredIndex = (featuredIndex + 1) % (maxIndex + 1);
      updateFeaturedPosition();
    }, 5000);
  }
}

function restartFeaturedTimer() { startFeaturedTimer(); }

/* ---- Year selector ---- */
function renderYearSelector() {
  var el = document.getElementById("yearSelector");
  if (!el) return;

  var years = {};
  PAPER_DATA.forEach(function(p) {
    var y = p.date.split("-")[0] || p.date;
    if (!years[y]) years[y] = 0;
    years[y]++;
  });
  var yearKeys = Object.keys(years).sort(function(a, b) { return b.localeCompare(a); });

  el.innerHTML = '<span class="year-pill active" data-year="all">' + t("publications.all") + '</span>' +
    yearKeys.map(function(y) {
      return '<span class="year-pill" data-year="' + y + '">' + y + '</span>';
    }).join("");

  el.querySelectorAll(".year-pill").forEach(function(pill) {
    pill.addEventListener("click", function() {
      currentYear = this.getAttribute("data-year");
      el.querySelectorAll(".year-pill").forEach(function(p) { p.classList.remove("active"); });
      this.classList.add("active");
      renderPaperList();
    });
  });
}

/* ---- Topic filter ---- */
function setupTopicFilter() {
  var topicList = document.getElementById("topicList");
  if (!topicList) return;

  topicList.querySelectorAll("a").forEach(function(a) {
    a.addEventListener("click", function() {
      currentTopic = this.getAttribute("data-topic");
      topicList.querySelectorAll("li").forEach(function(li) { li.classList.remove("active"); });
      this.parentElement.classList.add("active");
      renderPaperList();
    });
  });
}

/* ---- Paper list ---- */
function extractDOI(journal) {
  var m = (journal || "").match(/DOI:\s*(https?:\/\/\S+)/i);
  if (!m) m = (journal || "").match(/DIO:\s*(https?:\/\/\S+)/i);
  return m ? m[1] : "";
}

function cleanJournal(journal) {
  return (journal || "").replace(/\s*DO[IO]:\s*https?:\/\/\S+/gi, "").trim();
}

function renderPaperList() {
  var list = document.getElementById("pubList");
  if (!list) return;

  var all = PAPER_DATA.slice();

  if (currentYear !== "all") {
    all = all.filter(function(p) {
      return (p.date.split("-")[0] || p.date) === currentYear;
    });
  }

  if (currentTopic !== "all") {
    all = all.filter(function(p) {
      var tags = (p.tags || []).map(function(t) { return t.toLowerCase(); });
      return tags.indexOf(currentTopic.toLowerCase()) >= 0;
    });
  }

  all.sort(function(a, b) { return b.date.localeCompare(a.date); });

  var groups = {};
  all.forEach(function(p) {
    var year = p.date.split("-")[0] || p.date;
    if (!groups[year]) groups[year] = [];
    groups[year].push(p);
  });

  var years = Object.keys(groups).sort(function(a, b) { return b.localeCompare(a); });

  var html = "";
  var globalIdx = 0;
  years.forEach(function(year) {
    var papers = groups[year];
    html += '<section class="pub-year-group"><h2 class="pub-year-title">' + year + '</h2>';
    papers.forEach(function(paper) {
      globalIdx++;
      var d = paper[currentLang];
      var tocSrc = paper.toc || "";
      var doi = extractDOI(d.journal);
      var journalClean = cleanJournal(d.journal);
      var abstract = d.abstract || "";

      html += '\
        <article class="pub-item">\
          <div class="pub-item-num">' + globalIdx + '</div>\
          <div class="pub-item-body">\
            <h3 class="pub-title"><a href="./paper.html?id=' + paper.id + '">' + d.title + '</a></h3>\
            ' + (tocSrc ? '<div class="pub-item-toc"><img src="' + tocSrc + '" alt="TOC" loading="lazy" onerror="this.style.display=\'none\'" /></div>' : '') + '\
            <p class="pub-authors">' + (d.authors || "") + '</p>\
            <p class="pub-journal"><em>' + journalClean + '</em></p>\
            ' + (abstract ? '<p class="pub-abstract">' + abstract + '</p>' : '') + '\
            <div class="pub-links">\
              <a class="pub-link" href="./paper.html?id=' + paper.id + '">' + t("publications.details") + '</a>\
              ' + (paper.pdf ? '<a class="pub-link" href="' + paper.pdf + '" target="_blank" rel="noopener noreferrer">PDF</a>' : '') + '\
              ' + (doi ? '<a class="pub-link pub-link-doi" href="' + doi + '" target="_blank" rel="noopener noreferrer">DOI</a>' : '') + '\
            </div>\
          </div>\
        </article>';
    });
    html += '</section>';
  });

  if (!html) {
    html = '<p class="empty-state">' + t("publications.noResults") + '</p>';
  }

  list.innerHTML = html;
}

/* ---- Featured arrows ---- */
function setupFeaturedControls() {
  document.querySelector(".feat-prev") && document.querySelector(".feat-prev").addEventListener("click", function() { moveFeatured(-1); });
  document.querySelector(".feat-next") && document.querySelector(".feat-next").addEventListener("click", function() { moveFeatured(1); });
}

/* ---- Sticky sidebar ---- */
function setupStickySidebar() {
  var sidebar = document.getElementById("pubSidebar");
  if (!sidebar) return;
  var headerH = 80;
  var sidebarTop = sidebar.offsetTop;

  onScroll(function() {
    if (window.innerWidth > 1024) {
      if (window.scrollY > sidebarTop - headerH - 10) {
        sidebar.style.position = "sticky";
        sidebar.style.top = (headerH + 10) + "px";
      } else {
        sidebar.style.position = "";
        sidebar.style.top = "";
      }
    } else {
      sidebar.style.position = "";
      sidebar.style.top = "";
    }
  });
}

/* ---- Resize handler ---- */
function setupResizeHandler() {
  window.addEventListener("resize", function() { updateFeaturedPosition(); });
}

/* ---- Render all ---- */
function renderAll() {
  renderFeatured();
  renderYearSelector();
  renderPaperList();
}

/* ---- Init ---- */
setupFeaturedControls();
setupTopicFilter();
setupStickySidebar();
setupResizeHandler();
initCommon(renderAll);
renderAll();
