/* ============================================================
   王明课题组 — 新闻详情页脚本
   ============================================================ */

function formatDate(dateStr) {
  var parts = dateStr.split("-");
  if (currentLang === "zh") {
    return (parts[0] || "") + "年" + (parts[1] || "") + "月" + (parts[2] || "") + "日";
  }
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return (parts[2] || "") + " " + months[parseInt(parts[1] || "1") - 1] + " " + (parts[0] || "");
}

function renderNewsDetail() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var idx = SITE_NEWS.findIndex(function(n) { return n.id === id; });
  var item = idx >= 0 ? SITE_NEWS[idx] : null;
  var root = document.getElementById("newsDetail");

  if (!item) {
    root.innerHTML = '<h3>' + t("news.noNews") + '</h3><a class="output-source-btn" href="./news.html">' + t("news.back") + '</a>';
    return;
  }

  var d = item[currentLang];
  var paragraphs = (d.detail || []).map(function(p) { return '<p>' + p + '</p>'; }).join("");
  var images = (item.images || []).map(function(img) { return '<p style=\"text-align:center;\"><img class=\"nd-content-img\" src=\"' + img + '\" alt=\"\" loading=\"lazy\" /></p>'; }).join("");
  var prev = idx > 0 ? SITE_NEWS[idx - 1] : null;
  var next = idx < SITE_NEWS.length - 1 ? SITE_NEWS[idx + 1] : null;
  var tags = (item.tags || []).map(function(tag) { return '<span class="nt-tag">' + tag + '</span>'; }).join("");

  root.innerHTML = '\
    <h2>' + d.title + '</h2>\
    <div class="news-detail-meta">\
      <span>' + formatDate(item.date) + '</span>\
      ' + (tags ? '&nbsp;&middot;&nbsp; ' + tags : '') + '\
    </div>\
    <div class="news-detail-body">\
      ' + (d.desc ? '<p>' + d.desc + '</p>' : '') + '\
      ' + images + '\
      ' + paragraphs + '\
    </div>\
    <div class="pd-hl-actions">\
      <a class="pd-back" href="./news.html">&laquo; ' + t("news.back") + '</a>\
      <div class="pd-prev-next">\
        ' + (prev ? '<a href="./news-item.html?id=' + prev.id + '">' + t("news.prev") + '</a>' : '') + '\
        ' + (next ? '<a href="./news-item.html?id=' + next.id + '">' + t("news.next") + '</a>' : '') + '\
      </div>\
    </div>';
}

/* ---- Init ---- */
initCommon(renderNewsDetail);
renderNewsDetail();
