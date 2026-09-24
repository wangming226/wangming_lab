/* ============================================================
   王明课题组 — 论文详情页脚本
   ============================================================ */

function renderPaperDetail() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var idx = PAPER_DATA.findIndex(function(p) { return p.id === id; });
  var paper = idx >= 0 ? PAPER_DATA[idx] : null;
  var root = document.getElementById("paperDetail");

  if (!paper) {
    root.innerHTML = '<h3>' + t("publications.noPaper") + '</h3><a class="output-source-btn" href="./publications.html">' + t("publications.back") + '</a>';
    return;
  }

  var d = paper[currentLang];
  var prev = idx > 0 ? PAPER_DATA[idx - 1] : null;
  var next = idx < PAPER_DATA.length - 1 ? PAPER_DATA[idx + 1] : null;
  var tocImg = paper.toc
    ? '<p style="text-align:center;"><img class="pd-content-img" src="' + paper.toc + '" alt="TOC" loading="lazy" onerror="this.style.display=\'none\';" /></p>'
    : "";

  root.innerHTML = '\
    <h2 class="pd-hl-title">' + d.title + '</h2>\
    <h3 class="pd-hl-subtitle">' + (d.authors || "") + '</h3>\
    <h4 class="pd-hl-info">' + paper.date + '</h4>\
    <div class="pd-hl-content">\
      <p><span class="pd-abs-label">' + t("publications.summary") + ':&nbsp;</span></p>\
      <p>' + (d.abstract || "") + '</p>\
      ' + tocImg + '\
      ' + (paper.source && paper.source !== "#" ? '<p><a class="pd-hl-doi" href="' + paper.source + '" target="_blank" rel="noopener noreferrer">DOI: ' + paper.source + '</a></p>' : '') + '\
    </div>\
    <div class="pd-hl-actions">\
      <a class="pd-back" href="./publications.html">&laquo; ' + t("publications.back") + '</a>\
      <div class="pd-prev-next">\
        ' + (prev ? '<a href="./paper.html?id=' + prev.id + '">' + t("publications.prev") + '</a>' : '') + '\
        ' + (next ? '<a href="./paper.html?id=' + next.id + '">' + t("publications.next") + '</a>' : '') + '\
      </div>\
    </div>';
}

/* ---- Init ---- */
initCommon(renderPaperDetail);
renderPaperDetail();
