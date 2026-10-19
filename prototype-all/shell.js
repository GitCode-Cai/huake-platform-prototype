/* 统一外壳：一个侧边栏，装两个模块原型 */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };

  var MODULES = {
    bs: {
      name: "基础支撑管理", short: "基础支撑", actor: "张伟（平台管理员）", avatar: "张",
      base: "../prototype/index.html",
      pages: [
        { key: "overview", label: "平台能力", icon: "◎" },
        { key: "apps", label: "接入的应用", icon: "▤" },
        { key: "identity", label: "账号来源", icon: "◈" },
        { key: "sessions", label: "登录状态", icon: "◐" },
        { key: "params", label: "系统设置", icon: "⚙" },
        { key: "files", label: "文件存储", icon: "▣" },
        { key: "messages", label: "消息通知", icon: "✉" },
        { key: "apis", label: "系统对接", icon: "⇄" },
        { key: "audit", label: "操作记录", icon: "⌕" }
      ]
    },
    viz: {
      name: "数据可视化系统", short: "数据可视化", actor: "王分析（业务分析师）", avatar: "王",
      base: "../prototype-viz/index.html",
      pages: [
        { key: "dashboard", label: "经营总览", icon: "▤" },
        { key: "quality", label: "质量分析", icon: "◎" },
        { key: "production", label: "生产实时状态", icon: "▦" },
        { key: "sales", label: "销售分析", icon: "◔" },
        { key: "report", label: "报表制作", icon: "✎" },
        { key: "datasets", label: "数据表与质量", icon: "▣" },
        { key: "metrics", label: "指标定义", icon: "≡" },
        { key: "screen", label: "展示屏设计", icon: "▥" },
        { key: "alerts", label: "预警提醒", icon: "!" },
        { key: "exports", label: "导出审批", icon: "↧" },
        { key: "lineage", label: "数据来源关系", icon: "⌘" }
      ]
    }
  };

  var REVIEW = [
    { module: "bs", route: "rules", label: "基础支撑 · 规则清单", icon: "☑" },
    { module: "bs", route: "questions", label: "基础支撑 · 待确认", icon: "？" },
    { module: "viz", route: "rules", label: "可视化 · 规则清单", icon: "☑" },
    { module: "viz", route: "questions", label: "可视化 · 待确认", icon: "？" }
  ];

  var GROUPS = [
    { key: "bs", label: "基础支撑管理", icon: "支", module: "bs" },
    { key: "viz", label: "数据可视化", icon: "视", module: "viz" },
    { key: "review", label: "评审工具", icon: "☑", items: REVIEW }
  ];


  var GLOSSARY = [
    { plain: "经营总览", old: "驾驶舱", desc: "把公司最关键的几个指标放在一屏上看，点数字还能逐层看到明细。" },
    { plain: "统计定义", old: "口径", desc: "这个指标到底怎么算、算哪些数据。定义不统一，两个部门就会报出两个数。" },
    { plain: "逐层查看", old: "下钻", desc: "从汇总数字点进去，看区域、产品线、工序、批次，一层层找到原因。" },
    { plain: "一起筛选", old: "联动", desc: "点一个图里的某个值，其他图跟着只显示这个值的数据。" },
    { plain: "数据来源关系", old: "血缘", desc: "这个数字是从哪张表、哪个字段、经过哪些加工来的；改一个字段会影响谁。" },
    { plain: "数据说明", old: "元数据", desc: "数据的说明书：字段什么意思、谁负责、多久更新一次。" },
    { plain: "基础档案", old: "主数据", desc: "客户、物料、供应商这类全公司只有一份的官方记录。" },
    { plain: "展示屏", old: "大屏", desc: "展厅、指挥中心或车间墙上的大屏幕，只负责展示。" },
    { plain: "实时状态", old: "看板", desc: "车间现场看生产进度、设备状态的屏幕。" },
    { plain: "质量波动图", old: "SPC 控制图", desc: "看质量指标是不是稳定；超出上下控制线，就说明过程有异常波动。" },
    { plain: "缺陷排名", old: "柏拉图", desc: "把缺陷按数量从多到少排，先解决占大头的那几类。" },
    { plain: "设备综合效率", old: "OEE", desc: "设备的时间利用率、速度、合格率的综合表现。" },
    { plain: "一次登录", old: "单点登录 / SSO", desc: "登录一次，就能进所有有权限的系统，不用每个系统再输密码。" },
    { plain: "登录凭证", old: "令牌 / Token", desc: "证明你已经登录的一张电子凭证，有有效期，过期要重新登录。" },
    { plain: "操作记录", old: "审计日志", desc: "谁在什么时候、从哪个系统、对什么数据做了什么，都能查。" },
    { plain: "警戒线", old: "阈值", desc: "给指标设的一条线，超过或低于这条线就提醒责任人。" },
    { plain: "先小范围试用", old: "灰度", desc: "新配置先对一小部分应用或用户生效，没问题再全量。" },
    { plain: "重复提交不重复生效", old: "幂等", desc: "同一个请求因为网络重试发了两次，系统也只处理一次。" }
  ];

  function openGloss() {
    var box = document.getElementById("gloss");
    if (!box) return;
    document.getElementById("gloss-body").innerHTML = GLOSSARY.map(function (g) {
      return '<div class="gloss-item"><div><b>' + g.plain + '</b><span class="old">原来叫：' + g.old + "</span></div>" +
        '<p>' + g.desc + "</p></div>";
    }).join("");
    box.classList.add("open");
  }
  function closeGloss() {
    var box = document.getElementById("gloss");
    if (box) box.classList.remove("open");
  }

  var LS_COLLAPSE = "proto-shell-collapsed";
  var LS_GROUPS = "proto-shell-groups";

  var state = {
    module: "bs", route: "overview", title: "能力总览",
    collapsed: false, mobileOpen: false, loaded: false,
    groups: { bs: true, viz: false, review: true }
  };

  try {
    state.collapsed = localStorage.getItem(LS_COLLAPSE) === "1";
    var g = JSON.parse(localStorage.getItem(LS_GROUPS) || "null");
    if (g) { state.groups.bs = g.bs !== false; state.groups.viz = g.viz === true; state.groups.review = g.review !== false; }
  } catch (e) { }

  function persist() {
    try {
      localStorage.setItem(LS_COLLAPSE, state.collapsed ? "1" : "0");
      localStorage.setItem(LS_GROUPS, JSON.stringify(state.groups));
    } catch (e) { }
  }

  function safePage(m, r) {
    if (!MODULES[m]) return false;
    if (MODULES[m].pages.some(function (p) { return p.key === r; })) return true;
    return r === "rules" || r === "questions";
  }

  function parseHash() {
    var parts = location.hash.replace(/^#\/?/, "").split("/");
    var m = parts[0], r = parts[1];
    if (m && r && safePage(m, r)) return { module: m, route: r };
    return null;
  }

  function pageTitle(m, r) {
    var p = MODULES[m].pages.filter(function (x) { return x.key === r; })[0];
    if (p) return p.label;
    if (r === "rules") return "业务规则清单";
    if (r === "questions") return "待确认问题";
    return r;
  }

  function renderNav() {
    var html = "";
    GROUPS.forEach(function (grp) {
      var items = grp.items || MODULES[grp.module].pages;
      var closed = state.groups[grp.key] === false;
      html += '<div class="nav-group ' + (closed ? "closed" : "") + '" data-group="' + grp.key + '">' +
        '<button class="group-head" data-act="toggle-group" data-key="' + grp.key + '" title="' + grp.label + '">' +
        '<span class="g-ico">' + grp.icon + "</span>" +
        '<span class="g-label">' + grp.label + "</span>" +
        '<span class="g-count">' + items.length + "</span>" +
        '<span class="chev">▾</span></button>' +
        '<div class="group-items">' + items.map(function (it) {
          var mod = grp.module || it.module;
          var route = grp.module ? it.key : it.route;
          var label = it.label;
          var active = state.module === mod && state.route === route;
          return '<a class="nav-item ' + (active ? "active" : "") + '" href="#/' + mod + "/" + route + '" ' +
            'title="' + label + '" data-module="' + mod + '" data-route="' + route + '">' +
            '<span class="ico">' + it.icon + '</span><span class="lbl">' + label + "</span></a>";
        }).join("") + "</div></div>";
    });
    $("#nav").innerHTML = html;

    var shell = document.querySelector(".shell");
    shell.classList.toggle("collapsed", state.collapsed);
    shell.classList.toggle("mobile-open", state.mobileOpen);
  }

  function updateChrome() {
    var mod = MODULES[state.module];
    $("#crumb").innerHTML = '<span class="mod">' + mod.name + '</span><span class="sep">/</span><b>' + state.title + "</b>";
    $("#actor").textContent = mod.actor;
    var av = $("#avatar");
    av.textContent = mod.avatar;
    av.classList.toggle("viz", state.module === "viz");
    $("#collapse-icon").textContent = state.collapsed ? "»" : "«";
    document.title = state.title + " · " + mod.name + " · 业务原型";
  }

  function showLoading(on) {
    var el = $("#loading");
    if (!el) return;
    el.classList.toggle("on", !!on);
    var stage = $("#stage");
    if (stage) stage.classList.toggle("fading", !!on);
  }

  function loadModule(p, force) {
    var src = MODULES[p.module].base + "?embed=1#/" + p.route;
    var stage = $("#stage");
    showLoading(true);
    if (force || stage.getAttribute("data-module") !== p.module) {
      stage.setAttribute("data-module", p.module);
      stage.src = src;
    } else {
      postGo(p.route);
      showLoading(false);
    }
  }

  function postGo(route) {
    var stage = $("#stage");
    try {
      if (stage.contentWindow) stage.contentWindow.postMessage({ type: "proto-go", route: route }, "*");
    } catch (e) { }
  }

  function applyRoute(p) {
    var moduleChanged = p.module !== state.module || !state.loaded;
    var oldModule = state.module;
    state.module = p.module;
    state.route = p.route;
    state.title = pageTitle(p.module, p.route);
    renderNav();
    updateChrome();
    if (moduleChanged) {
      // 手风琴：展开当前模块，收起另一个模块，避免侧边栏过长
      state.groups[p.module] = true;
      var other = p.module === "bs" ? "viz" : "bs";
      if (oldModule !== p.module) state.groups[other] = false;
      persist();
      renderNav();
      state.loaded = true;
      loadModule(p, true);
    } else {
      postGo(p.route);
    }
  }

  function onHash() {
    var p = parseHash();
    if (!p) {
      p = { module: "bs", route: "overview" };
      history.replaceState(null, "", "#/bs/overview");
    }
    applyRoute(p);
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t = e.target;
    var closeMobile = t.closest && t.closest("[data-close-mobile]");
    if (closeMobile) { state.mobileOpen = false; renderNav(); return; }

    var toggle = t.closest && t.closest("[data-act=toggle-group]");
    if (toggle) {
      var key = toggle.getAttribute("data-key");
      if (state.collapsed) {
        state.collapsed = false;
        state.groups[key] = true;
      } else {
        state.groups[key] = !state.groups[key];
      }
      persist();
      renderNav();
      return;
    }

    var collapse = t.closest && t.closest("[data-act=collapse]");
    if (collapse) {
      if (window.innerWidth <= 900) {
        state.mobileOpen = !state.mobileOpen;
        renderNav();
        return;
      }
      state.collapsed = !state.collapsed;
      persist();
      renderNav();
      updateChrome();
      return;
    }

    var item = t.closest && t.closest(".nav-item");
    if (item) {
      if (window.innerWidth <= 900) { state.mobileOpen = false; }
      renderNav();
      return; // 由 href 触发 hashchange
    }

    var glossBtn = t.closest && t.closest("[data-act=glossary]");
    if (glossBtn) { openGloss(); return; }
    var glossClose = t.closest && t.closest("[data-act=gloss-close]");
    if (glossClose) { closeGloss(); return; }

    var openNew = t.closest && t.closest("[data-act=new-window]");
    if (openNew) {
      var url = MODULES[state.module].base + "#/" + state.route;
      window.open(url, "_blank");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeGloss();
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      state.collapsed = !state.collapsed;
      persist();
      renderNav();
      updateChrome();
    }
  });

  $("#stage").addEventListener("load", function () {
    showLoading(false);
  });

  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type !== "proto-route") return;
    if (d.module !== state.module) return;
    if (d.route) state.route = d.route;
    state.title = d.title || pageTitle(state.module, state.route);
    renderNav();
    updateChrome();
    var want = "#/" + d.module + "/" + d.route;
    if (location.hash !== want) {
      try { history.replaceState(null, "", want); } catch (err) { }
    }
  });

  window.addEventListener("hashchange", onHash);
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900 && state.mobileOpen) {
      state.mobileOpen = false;
      renderNav();
    }
  });

  // clock
  function tick() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : n; }
    $("#clock").textContent = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  // boot
  renderNav();
  updateChrome();
  tick();
  setInterval(tick, 20000);
  onHash();
})();
