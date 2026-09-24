/* ============================================================
   王明课题组 — 新闻列表页脚本
   ============================================================ */

var currentNewsCat = "all";
var MONTH_NAMES_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateStr) {
  var parts = dateStr.split("-");
  var day = parts[2] || "";
  var monthIdx = parseInt(parts[1] || "1") - 1;
  if (currentLang === "zh") {
    return (parts[0] || "") + "年" + (monthIdx + 1) + "月" + day + "日";
  }
  return day + " " + MONTH_NAMES_EN[monthIdx] + " " + (parts[0] || "");
}

/* ---- Category filter ---- */
function setupNewsFilter() {
  var topicList = document.getElementById("newsTopicList");
  if (!topicList) return;

  topicList.querySelectorAll("a").forEach(function(a) {
    a.addEventListener("click", function() {
      currentNewsCat = this.getAttribute("data-cat");
      topicList.querySelectorAll("li").forEach(function(li) { li.classList.remove("active"); });
      this.parentElement.classList.add("active");
      renderNewsList();
    });
  });
}

/* ---- Sticky sidebar ---- */
function setupStickySidebar() {
  var sidebar = document.getElementById("newsSidebar");
  if (!sidebar) return;
  var headerH = 80;
  var sidebarTop = sidebar.offsetTop;

  onScroll(function() {
    if (window.innerWidth > 1024) {
      if (window.scrollY > sidebarTop - headerH - 10) {
        sidebar.style.position = "sticky";
        sidebar.style.top = (headerH + 10) + "px";
      }
    }
  });
}

function renderNewsList() {
  var list = document.getElementById("newsList");
  if (!list) return;

  var all = SITE_NEWS.slice();

  if (currentNewsCat !== "all") {
    all = all.filter(function(item) {
      return (item.tags || []).some(function(tag) {
        return tag.toLowerCase().indexOf(currentNewsCat.toLowerCase()) >= 0;
      });
    });
  }

  all.sort(function(a, b) { return b.date.localeCompare(a.date); });

  list.innerHTML = all.map(function(item) {
    var d = item[currentLang];
    var dateParts = item.date.split("-");
    var day = dateParts[2] || "";
    var monthIdx = parseInt(dateParts[1] || "1") - 1;
    var month = currentLang === "zh" ? (monthIdx + 1) + "月" : MONTH_NAMES_EN[monthIdx];
    var year = dateParts[0] || "";
    var thumbHtml = (item.images && item.images[0])
      ? '<div class="nt-thumb"><img src="' + item.images[0] + '" alt="" loading="lazy" /></div>'
      : "";
    var tagsHtml = (item.tags || []).map(function(t) {
      var label = t;
      if (t === "Graduate") label = currentLang === "zh" ? "毕业" : "Graduation";
      else if (t === "Awards") label = currentLang === "zh" ? "获奖" : "Awards";
      else if (t === "Academic") label = currentLang === "zh" ? "学术交流" : "Academic";
      return '<span class="nt-tag">' + label + '</span>';
    }).join("");
    return '\
      <article class="nt-item">\
        <div class="nt-date-badge">\
          <span class="nt-day">' + formatDate(item.date) + '</span>\
        </div>\
        ' + thumbHtml + '\
        <div class="nt-body">\
          <h3 class="nt-title"><a href="./news-item.html?id=' + item.id + '">' + d.title + '</a></h3>\
          <p class="nt-desc">' + ((d.detail && d.detail[0]) ? d.detail[0].substring(0, 120) + '…' : '') + '</p>\
          ' + (tagsHtml ? '<div class="nt-tags">' + tagsHtml + '</div>' : '') + '\
        </div>\
      </article>';
  }).join("");

  if (!all.length) {
    list.innerHTML = '<p class="empty-state">' + t("news.noResults") + '</p>';
  }
}

/* ---- Init ---- */
setupNewsFilter();
setupStickySidebar();
initCommon(renderNewsList);
renderNewsList();
