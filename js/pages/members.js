/* ============================================================
   王明课题组 — 成员介绍页脚本
   ============================================================ */

function nameOf(m) { return currentLang === "zh" ? m.name : m.enName; }

/* ---- Sticky sub-nav ---- */
function setupStickySubnav() {
  var subnav = document.getElementById("peopleSubnav");
  if (!subnav) return;
  var headerH = 80;
  var subnavTop = subnav.offsetTop;

  onScroll(function() {
    if (window.scrollY > subnavTop - headerH) {
      subnav.classList.add("navFix-people");
      subnav.style.top = headerH + "px";
    } else {
      subnav.classList.remove("navFix-people");
      subnav.style.top = "";
    }
  });

  subnav.querySelectorAll("a").forEach(function(a) {
    a.addEventListener("click", function(e) {
      e.preventDefault();
      var targetId = this.getAttribute("href").replace("#", "");
      var target = document.getElementById(targetId);
      if (target) {
        var offset = target.offsetTop - headerH - 50;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
      subnav.querySelectorAll("li").forEach(function(li) { li.classList.remove("bg_color"); });
      this.parentElement.classList.add("bg_color");
    });
  });
}

/* ---- Render PI section ---- */
function renderPI() {
  var el = document.getElementById("piSection");
  if (!el) return;
  var pi = PI_DATA || {};
  var name = currentLang === "zh" ? pi.name : (pi.enName || pi.name);
  var title = currentLang === "zh" ? (pi.titleZh || "") : (pi.titleEn || "");
  var email = pi.email || "";
  var phone = pi.phone || "";
  var addr = currentLang === "zh" ? (pi.addressZh || "") : (pi.addressEn || "");
  var bio = currentLang === "zh" ? (pi.bioZh || "") : (pi.bioEn || "");
  var research = currentLang === "zh" ? (pi.researchZh || "") : (pi.researchEn || "");

  el.innerHTML = '\
    <div class="pi-card">\
      <div class="pi-avatar-wrap">\
        <img class="pi-avatar" src="./assets/members/' + pi.name + '.jpg" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />\
        <span class="pi-avatar-fb">' + (pi.name ? pi.name.slice(0,1) : "王") + '</span>\
      </div>\
      <div class="pi-right">\
        <div class="pi-name-row">\
          <h2 class="pi-name">' + name + '</h2>\
          <span class="pi-badge">' + t("members.pi") + '</span>\
        </div>\
        <p class="pi-title-info">' + title + '</p>\
        <div class="pi-contact-row">\
          <span>&#9993; <a href="mailto:' + email + '">' + email + '</a></span>\
          ' + (addr ? '<span>&#128205; ' + addr + '</span>' : '') + '\
        </div>\
        <div class="pi-info-grid">\
          <div class="pi-info-item" style="grid-column:1/-1;">\
            <h4>' + t("members.bio") + '</h4>\
            <p>' + bio + '</p>\
          </div>\
        </div>\
      </div>\
    </div>';
}

/* ---- Render people grid cards ---- */
function renderPeopleGrid(containerId, arr, groupLabel, isAlumni) {
  var el = document.getElementById(containerId);
  if (!el || !arr.length) return;
  var label = groupLabel || "";

  if (isAlumni) {
    var items = arr.map(function(m) {
      var nm = currentLang === "zh" ? m.name : m.enName;
      var years = m.years || "";
      var dest = currentLang === "zh" ? (m.destinationZh || "") : (m.destinationEn || "");
      var photoPath = './assets/members/' + m.name + '.jpg';
      return '\
        <div class="people-card">\
          <div class="people-card-photo">\
            <img src="' + photoPath + '" alt="' + nm + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />\
            <div class="photo-fb" style="display:none;">' + m.name.charAt(0) + '</div>\
          </div>\
          <div class="people-card-info">\
            <div class="pc-name">' + nm + '</div>\
            <div class="pc-role">' + years + '</div>\
            ' + (dest ? '<div class="pc-email">' + t("members.destination") + dest + '</div>' : '') + '\
          </div>\
        </div>';
    }).join("");
    el.innerHTML = '<h2 class="people-title">' + label + '</h2><div class="people-grid">' + items + '</div>';
  } else {
    var items = arr.map(function(m) {
      var nm = currentLang === "zh" ? m.name : m.enName;
      var foc = currentLang === "zh" ? m.focusZh : m.focusEn;
      var email = m.email || "";
      var photoPath = './assets/members/' + m.name + '.jpg';
      return '\
        <div class="people-card">\
          <div class="people-card-photo">\
            <img src="' + photoPath + '" alt="' + nm + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';" />\
            <div class="photo-fb" style="display:none;">' + m.name.charAt(0) + '</div>\
          </div>\
          <div class="people-card-info">\
            <div class="pc-name">' + nm + '</div>\
            <div class="pc-role">' + (foc || "") + '</div>\
            ' + (email ? '<div class="pc-email"><a href="mailto:' + email + '">' + email + '</a></div>' : '') + '\
          </div>\
        </div>';
    }).join("");
    el.innerHTML = '<h2 class="people-title">' + label + '</h2><div class="people-grid">' + items + '</div>';
  }
}

/* ---- Toggle READ MORE ---- */
function setupReadMore() {
  document.querySelectorAll(".people-readmore").forEach(function(link) {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      var targetId = this.getAttribute("href").replace("#", "");
      var target = document.getElementById(targetId);
      if (!target) return;
      var isOpen = target.classList.contains("open");
      document.querySelectorAll(".people-detail-collapse.open").forEach(function(d) {
        d.classList.remove("open");
      });
      if (!isOpen) {
        target.classList.add("open");
        setTimeout(function() {
          target.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 100);
      }
    });
  });
}

/* ---- Render all sections ---- */
function renderAll() {
  renderPI();
  renderPeopleGrid("postdocSection", MEMBER_DATA.postdoc, t("members.postdoc"), false);
  renderPeopleGrid("phdSection", MEMBER_DATA.phd, t("members.phd"), false);
  renderPeopleGrid("mscSection", MEMBER_DATA.msc, t("members.msc"), false);
  renderPeopleGrid("alumniSection", MEMBER_DATA.alumni, t("members.alumni"), true);
}

/* ---- Init ---- */
initCommon(function() { renderAll(); setupReadMore(); });
renderAll();
setupStickySubnav();
setupReadMore();
