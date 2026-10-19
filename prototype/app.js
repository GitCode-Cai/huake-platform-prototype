/* 基础支撑管理 · 业务原型（演示用，无后端） */
(function () {
  "use strict";

  // ---------------- state ----------------
  var STORE = "bs-proto-v1";
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var S = load();
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.apps && d.params) return d;
      }
    } catch (e) { /* ignore */ }
    return clone(window.DB);
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { } }

  var UI = {
    appQuery: "", appStatus: "all",
    auditQuery: "", auditType: "all", auditSensitive: false,
    ruleQuery: "", ruleDomain: "all",
    msgTemplate: "TPL-01", msgUser: "李娜", msgUrgent: false, quiet: false, smsDown: false, dup: false,
    apiTab: "overview", apiId: null,
    modal: null, drawer: null
  };

  // ---------------- utils ----------------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtTime(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function fmtDate(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function plusMonths(n) {
    var d = new Date(); d.setMonth(d.getMonth() + n); return fmtDate(d);
  }
  function tag(text, type) {
    return '<span class="tag ' + (type || "gray") + '"><i class="dot"></i>' + esc(text) + "</span>";
  }
  function rule(id) { return '<span class="rule-chip" title="规则编号，可在“业务规则清单”查看">' + id + "</span>"; }
  function kv(list) {
    return '<dl class="kv">' + list.map(function (x) {
      return "<dt>" + esc(x[0]) + "</dt><dd>" + (x[2] ? x[1] : esc(x[1])) + "</dd>";
    }).join("") + "</dl>";
  }
  function uid(pfx, list) {
    var max = 0;
    list.forEach(function (x) {
      var m = String(x.id).match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return pfx + "-" + (max + 1);
  }
  function statusTag(s) {
    var map = {
      running: ["运行中", "green"], observing: ["观察期", "amber"], pending: ["待审核", "blue"],
      disabled: ["已停用", "gray"], active: ["在线", "green"], suspicious: ["可疑", "red"],
      revoked: ["已注销", "gray"], available: ["可用", "green"], archived: ["已归档", "gray"],
      approved: ["已审核", "green"], success: ["成功", "green"], failed: ["失败", "red"],
      blocked: ["已拦截", "red"], published: ["已发布", "green"], draft: ["草稿", "gray"],
      offline: ["已下线", "gray"], connected: ["已连接", "green"], enabled: ["已启用", "green"],
      paused: ["已暂停", "amber"], ok: ["正常", "green"], warn: ["注意", "amber"]
    };
    var v = map[s] || [s, "gray"];
    return tag(v[0], v[1]);
  }
  function sensTag(s) {
    var map = { "公开": "gray", "内部": "blue", "敏感": "amber", "安全": "red" };
    return tag(s, map[s] || "gray");
  }

  // ---------------- audit ----------------
  function log(action, object, result, detail, sensitive) {
    var id = "LIVE-" + (S.__seq = (S.__seq || 0) + 1);
    S.audit.unshift({
      id: id, time: fmtTime(), actor: S.actor, action: action, object: object,
      system: "基础支撑管理", result: result || "成功", ip: "10.12.8.21",
      sensitive: !!sensitive, detail: detail || "", live: true
    });
    if (S.audit.length > 300) S.audit.length = 300;
    save();
  }

  // ---------------- toast ----------------
  function toast(title, msg, type, ruleId) {
    var box = $("#toasts");
    var el = document.createElement("div");
    el.className = "toast " + (type || "success");
    var icon = { success: "✓", error: "✕", warn: "!", info: "i" }[type || "success"];
    el.innerHTML =
      '<div class="toast__title"><span>' + icon + "</span>" + esc(title) + "</div>" +
      (msg ? '<div class="toast__msg">' + esc(msg) + "</div>" : "") +
      (ruleId ? '<div class="toast__rule">触发规则 ' + esc(ruleId) + "</div>" : "");
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () {
      el.style.transition = "opacity .25s, transform .25s";
      el.style.opacity = "0";
      el.style.transform = "translateX(12px)";
      setTimeout(function () { el.remove(); }, 260);
    }, 3600);
  }

  // ---------------- modal / drawer ----------------
  function openModal(opt) {
    var root = $("#modal-root");
    root.innerHTML =
      '<div class="overlay" data-close="modal">' +
      '<div class="modal ' + (opt.wide ? "modal--lg" : "") + '" role="dialog">' +
      '<div class="modal__head"><div><h3>' + esc(opt.title) + "</h3>" +
      (opt.sub ? "<p>" + opt.sub + "</p>" : "") + "</div>" +
      '<button class="modal__close" data-close="modal" aria-label="关闭">×</button></div>' +
      '<div class="modal__body">' + opt.body + "</div>" +
      '<div class="modal__foot">' + opt.footer + "</div></div></div>";
    UI.modal = opt.id || true;
    $$("[data-close=modal]", root).forEach(function (b) {
      b.addEventListener("click", function (e) {
        if (e.target === b || b.classList.contains("modal__close")) closeModal();
      });
    });
  }
  function closeModal() { $("#modal-root").innerHTML = ""; UI.modal = null; }

  function openDrawer(opt) {
    var root = $("#drawer-root");
    root.innerHTML =
      '<div class="drawer-wrap"><div class="scrim" data-close="drawer"></div>' +
      '<aside class="drawer"><div class="drawer__head"><div><h3>' + esc(opt.title) + "</h3>" +
      (opt.sub ? "<p>" + opt.sub + "</p>" : "") + "</div>" +
      '<button class="drawer__close" data-close="drawer">×</button></div>' +
      '<div class="drawer__body">' + opt.body + "</div></aside></div>";
    $$("[data-close=drawer]", root).forEach(function (b) {
      b.addEventListener("click", closeDrawer);
    });
  }
  function closeDrawer() { $("#drawer-root").innerHTML = ""; UI.drawer = null; }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (UI.modal) closeModal(); if (UI.drawer) closeDrawer(); }
  });

  // ---------------- table helper ----------------
  function table(headers, rows, tableId) {
    return '<div class="table-wrap"><table class="data" id="' + (tableId || "") + '"><thead><tr>' +
      headers.map(function (h) {
        var o = typeof h === "string" ? { label: h } : h;
        return '<th class="' + (o.cls || "") + '">' + o.label + "</th>";
      }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr" + (r.attrs || "") + ">" + r.cells.map(function (c, i) {
        var o = typeof c === "string" ? { html: c } : c;
        return '<td class="' + (o.cls || (headers[i] && headers[i].cls) || "") + '">' + o.html + "</td>";
      }).join("") + "</tr>"; }).join("") +
      "</tbody></table></div>";
  }
  function row(text, status, cells) {
    return { attrs: ' data-text="' + esc(text.toLowerCase()) + '" data-status="' + (status || "") + '"', cells: cells };
  }

  function pageHead(title, desc, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + "</h1><p>" + desc + "</p></div>" +
      (actions ? '<div class="page-head__actions">' + actions + "</div>" : "") + "</div>";
  }
  function card(title, sub, body, foot, extraHead) {
    return '<section class="card">' +
      (title ? '<div class="card__head"><h3>' + esc(title) + "</h3>" +
        (sub ? '<span class="sub">' + sub + "</span>" : "") + (extraHead || "") + "</div>" : "") +
      '<div class="card__body">' + body + "</div>" +
      (foot ? '<div class="card__foot">' + foot + "</div>" : "") + "</section>";
  }
  function ruleChips(ids) {
    return '<div class="rules-inline">' + ids.map(rule).join("") +
      '<span style="font-size:11.5px;color:#7a869c">本页涉及的业务规则，点击右侧「业务规则清单」可逐条确认</span></div>';
  }

  // ---------------- nav ----------------
  var NAV = [
    { group: "基础支撑管理", items: [
      { key: "overview", label: "平台能力", icon: "◎" },
      { key: "apps", label: "接入的应用", icon: "▤", badge: "1" },
      { key: "identity", label: "账号来源", icon: "◈" },
      { key: "sessions", label: "登录状态", icon: "◐" },
      { key: "params", label: "系统设置", icon: "⚙" },
      { key: "files", label: "文件存储", icon: "▣" },
      { key: "messages", label: "消息通知", icon: "✉" },
      { key: "apis", label: "系统对接", icon: "⇄" },
      { key: "audit", label: "操作记录", icon: "⌕" }
    ] },
    { group: "评审工具", items: [
      { key: "rules", label: "业务规则清单", icon: "☑" },
      { key: "questions", label: "待确认问题", icon: "？" }
    ] },
    { group: "数据可视化", items: [
      { key: "viz", label: "数据可视化", icon: "▦", disabled: false }
    ] }
  ];

  function renderNav(active) {
    var html = "";
    NAV.forEach(function (g) {
      html += '<div class="nav__group"><div class="nav__label">' + g.group + "</div>";
      g.items.forEach(function (it) {
        var pending = it.key === "apps" ? S.apps.filter(function (a) { return a.status === "pending"; }).length : 0;
        html += '<a class="nav__item ' + (active === it.key ? "active" : "") + '" href="#/' + it.key + '">' +
          '<span class="nav__icon">' + it.icon + "</span><span>" + it.label + "</span>" +
          (pending ? '<span class="nav__badge">' + pending + "</span>" : "") +
           +
          "</a>";
      });
      html += "</div>";
    });
    $("#nav").innerHTML = html;
  }

  // ---------------- filters ----------------
  function bindFilters() {
    $$("[data-filter]").forEach(function (inp) {
      var t = inp.getAttribute("data-filter");
      if (UI[t]) inp.value = UI[t];
      inp.addEventListener("input", function () {
        UI[t] = inp.value;
        applyFilters();
      });
    });
    var auditType = $("#audit-type");
    if (auditType) {
      auditType.value = UI.auditType;
      auditType.addEventListener("change", function () {
        UI.auditType = auditType.value;
        applyFilters();
      });
    }
    var auditSens = $("#audit-sens");
    if (auditSens) {
      auditSens.checked = UI.auditSensitive;
      auditSens.addEventListener("change", function () {
        UI.auditSensitive = auditSens.checked;
        applyFilters();
      });
    }
    var msgUser = $("#msg-user");
    if (msgUser) msgUser.addEventListener("change", function () { UI.msgUser = msgUser.value; });
    var msgUrgent = $("#msg-urgent");
    if (msgUrgent) msgUrgent.addEventListener("change", function () { UI.msgUrgent = msgUrgent.value === "1"; });
    $$("[data-seg]").forEach(function (wrap) {
      var t = wrap.getAttribute("data-seg");
      $$("button", wrap).forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-val") === UI[t]);
        b.addEventListener("click", function () {
          UI[t] = b.getAttribute("data-val");
          $$("button", wrap).forEach(function (x) { x.classList.toggle("on", x === b); });
          applyFilters();
        });
      });
    });
  }
  function applyFilters() {
    var pairs = [
      ["#apps-table", UI.appQuery, UI.appStatus],
      ["#audit-table", UI.auditQuery, UI.auditType],
      ["#rules-table", UI.ruleQuery, UI.ruleDomain]
    ];
    pairs.forEach(function (p) {
      var tb = $(p[0]);
      if (!tb) return;
      $$("tbody tr", tb).forEach(function (tr) {
        var okQ = !p[1] || (tr.getAttribute("data-text") || "").indexOf(p[1].toLowerCase()) > -1;
        var okS = !p[2] || p[2] === "all" || (tr.getAttribute("data-status") || "") === p[2];
        tr.style.display = okQ && okS ? "" : "none";
      });
    });
    if (UI.auditSensitive) {
      var tb = $("#audit-table");
      if (tb) $$("tbody tr", tb).forEach(function (tr) {
        if (tr.getAttribute("data-sensitive") !== "1") tr.style.display = "none";
      });
    }
  }

  // =========================================================
  // PAGES
  // =========================================================

  // ---------- overview ----------
  function pageOverview() {
    var online = S.sessions.filter(function (s) { return s.status === "active"; }).length;
    var pending = S.apps.filter(function (a) { return a.status === "pending"; }).length;
    var confirmed = S.rules.filter(function (r) { return r.confirmed; }).length;
    var live = S.audit.filter(function (a) { return a.live; }).length;

    var caps = S.capabilities.map(function (c) {
      return '<div class="cap"><div class="cap__top"><span class="cap__code">' + c.code + '</span>' +
        '<span class="cap__name">' + esc(c.name) + "</span></div>" +
        '<div class="cap__meta"><span>' + esc(c.users) + "</span><span>今日 " + num(c.today) + "</span></div>" +
        '<div class="cap__sla">' + esc(c.sla) + " " + statusTag(c.status === "warn" ? "warn" : "ok") + "</div></div>";
    }).join("");

    var steps = [
      ["接入一个新系统", "填一份接入申请，看校验与审批流程", "apps"],
      ["处理账号来源冲突", "同步 AD/HR，裁定一条工号冲突", "identity"],
      ["改一个设置并回滚", "看审批、生效和回滚", "params"],
      ["发一条会被拦截的消息", "踩免打扰/频控/通道降级三个坑", "messages"],
      ["追一次导出行为", "在操作记录里查人、查对象、查审批", "audit"]
    ].map(function (s, i) {
      return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' +
        esc(s[0]) + '</div><div class="step__d">' + esc(s[1]) + ' · <a href="#/' + s[2] + '">去演示 →</a></div></div></div>';
    }).join("");

    var recent = (S.audit.filter(function (a) { return a.live; }).length ? S.audit.filter(function (a) { return a.live; }) : S.audit).slice(0, 5).map(function (a) {
      return '<div class="callout-row"><div class="grow"><div class="cell-main">' + esc(a.action) +
        ' <span class="cell-sub">' + esc(a.object) + "</span></div>" +
        '<div class="cell-sub">' + esc(a.time) + " · " + esc(a.actor) + "</div></div>" +
        statusTag(a.result === "成功" ? "success" : a.result === "失败" ? "failed" : "blocked") + "</div>";
    }).join("");

    return pageHead("平台能力", "这里集中提供全平台共用的基础能力：一次登录、文件、通知、系统对接、系统设置和操作记录。其他系统需要时，来这里申请开通。",
      '<button class="btn" data-act="guide">原型说明</button><button class="btn" data-act="reset">重置演示数据</button>') +
      '<div class="grid grid--4">' +
      stat("接入应用", S.apps.length, "其中 " + pending + " 个待审核") +
      stat("当前在线", online, "1 个异地可疑登录", true) +
      stat("今日消息", num(1284), "到达率 99.2%") +
      stat("今日系统对接", num(86420), "成功率 99.87%") +
      "</div>" +
      '<h2 class="section">平台提供的能力 <span class="hint">C-01～C-10：其他系统要用哪项能力，就按编号申请</span></h2>' +
      '<div class="cap-grid">' + caps + "</div>" +
      '<div class="grid grid--sidebar" style="margin-top:18px">' +
      card("5 分钟演示路径", "按顺序点一遍，基本能看懂这个模块在管什么", '<div class="steps">' + steps + "</div>") +
      card("最近操作", "你的每一步都会写入操作记录（本次 " + live + " 条）", recent || '<div class="empty">还没有操作记录</div>',
        '<a class="btn small" href="#/audit">去操作记录看全部</a>') +
      "</div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("规则确认进度", "评审时逐条确认，比讨论整段文字有效", progressBlock(confirmed, S.rules.length, "已确认" + confirmed + " / " + S.rules.length + " 条") +
        '<div style="margin-top:10px"><a class="btn small" href="#/rules">去逐条确认</a></div>') +
      card("待你拍板的问题", "这些问题不定，开发就会猜", S.questions.slice(0, 3).map(function (q) {
        return '<div class="callout-row"><div class="grow"><div class="cell-main" style="font-weight:600">' + q.id + " " + esc(q.text) + "</div>" +
          '<div class="cell-sub">建议：' + esc(q.suggest) + " · " + esc(q.owner) + "</div></div>" +
          '<a class="btn small" href="#/questions">去定</a></div>';
      }).join("")) +
      "</div>" +
      '<div class="footer-note"><span>原型版本 v0.1 · 对应 PRD-BS-001 v0.9</span><span>所有数据为虚构演示数据</span><span>操作会保存在浏览器本地，刷新不丢</span></div>';
  }
  function stat(label, val, delta, warn) {
    return '<div class="card stat"><div class="stat__label">' + esc(label) + "</div>" +
      '<div class="stat__value">' + val + "</div>" +
      '<div class="stat__delta ' + (warn ? "down" : "up") + '">' + esc(delta) + "</div></div>";
  }
  function progressBlock(cur, total, text) {
    var pct = Math.round(cur / total * 100);
    return '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px">' +
      "<span>" + esc(text) + '</span><b>' + pct + '%</b></div>' +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>';
  }

  // ---------- apps ----------
  function pageApps() {
    var rows = S.apps.map(function (a) {
      return row([a.name, a.owner, a.id, a.scopes.join(" "), a.status].join(" "), a.status, [
        '<div class="cell-main">' + esc(a.name) + '</div><div class="cell-sub">' + a.id + "</div>",
        esc(a.owner),
        '<div class="cell-sub">' + esc(a.scopes.join(" / ")) + "</div>",
        '<div class="mono">' + esc(a.callback.replace("https://", "")) + "</div>",
        statusTag(a.status),
        '<div class="num">' + num(a.callsToday) + '<div class="cell-sub">配额 ' + num(a.callQuota) + "</div></div>",
        '<div class="actions">' +
        '<button class="btn small" data-act="app-detail" data-id="' + a.id + '">详情</button>' +
        (a.status === "pending" ? '<button class="btn small primary" data-act="app-review" data-id="' + a.id + '">审核</button>' : "") +
        (a.status === "running" || a.status === "observing" ? '<button class="btn small" data-act="app-cred" data-id="' + a.id + '">凭证</button>' : "") +
        (a.status !== "disabled" && a.status !== "pending" ? '<button class="btn small danger" data-act="app-disable" data-id="' + a.id + '">停用</button>' : "") +
        "</div>"
      ]);
    });

    return pageHead("接入的应用", "每个想使用平台能力的系统，都要先登记、审核、拿到接入密钥，之后定期检查是否还在用。",
      '<button class="btn primary" data-act="app-new">＋ 新建接入申请</button>') +
      ruleChips(["BR-BS-08", "BR-BS-09", "BR-BS-10"]) +
      card("", "", table(
        ["应用 / 编号", "负责人", "申请的能力", "回调地址", "状态", { label: "今日调用", cls: "num" }, { label: "操作", cls: "num" }],
        rows, "apps-table"),
        "", '<div class="toolbar" style="border-bottom:none;padding:0"><div class="search"><input class="input" placeholder="搜索应用名、负责人" data-filter="appQuery"></div>' +
        '<div class="seg" data-seg="appStatus">' + seg("all", "全部", UI.appStatus === "all") + seg("running", "运行中", UI.appStatus === "running") + seg("observing", "观察期", UI.appStatus === "observing") + seg("pending", "待审核", UI.appStatus === "pending") + seg("disabled", "已停用", UI.appStatus === "disabled") + "</div>" +
        '<div class="spacer"></div><span style="font-size:12px;color:#7a869c">回调地址白名单：*.corp.local</span></div>') +
      '<div class="grid grid--3" style="margin-top:14px">' +
      card("接入流程", "5 个工作日", '<div class="steps">' +
        ["提交申请（名称/负责人/用途/能力/回调）", "平台审核（≤1 工作日）", "发放凭证（有效期 12 个月）", "联调（映射试跑 + 调用记录）", "上线观察（30 天，配额可调）"]
          .map(function (t, i) { return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + t + "</div></div></div>"; }).join("") +
        "</div>") +
      card("审核要点", "管理员视角", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>回调地址是否在<b>白名单</b>内，是否用了通配符</li><li>申请的能力是否<b>最小化</b>，超出默认范围要安全审批</li>" +
        "<li>预计调用量与配额是否匹配</li><li>负责人是否为本单位在职员工</li></ul>") +
      card("自动治理", "不需要人盯", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>凭证到期前 30 天提醒续期</li><li>90 天零调用自动停用并通知</li><li>连续 10 次越权封禁 30 分钟</li><li>密钥 90 天轮换，双密钥过渡</li></ul>") +
      "</div>";
  }
  function seg(val, label, active) {
    return '<button data-val="' + val + '" class="' + (active ? "on" : "") + '">' + label + "</button>";
  }

  // ---------- identity ----------
  function pageIdentity() {
    var cards = S.identity.map(function (s) {
      return '<div class="card" style="padding:16px">' +
        '<div style="display:flex;align-items:center;gap:8px"><b>' + esc(s.name) + "</b>" + statusTag(s.status) +
        '<span style="margin-left:auto;font-size:11.5px;color:#7a869c">' + esc(s.type) + "</span></div>" +
        '<div style="margin:10px 0;color:#7a869c;font-size:12px">' + esc(s.note) + "</div>" +
        '<div style="display:flex;gap:18px;font-size:12px;color:#44506a"><span>新增 <b>' + s.added +
        '</b></span><span>变更 <b>' + s.changed + '</b></span><span>停用 <b>' + s.disabled + "</b></span></div>" +
        '<div style="margin-top:10px;font-size:11.5px;color:#7a869c">上次同步：' + esc(s.lastSync) + " · 覆盖 " + s.users + " 人</div>" +
        '<div style="margin-top:12px"><button class="btn small" data-act="idp-sync" data-id="' + s.id + '">立即同步</button></div>' +
        "</div>";
    }).join("");

    var cfRows = S.conflicts.length ? S.conflicts.map(function (c) {
      return row([c.id, c.type, c.a, c.b].join(" "), "open", [
        '<span class="mono">' + c.id + "</span>", tag(c.type, "amber"),
        '<div class="cell-sub">' + esc(c.a) + "</div>", '<div class="cell-sub">' + esc(c.b) + "</div>",
        '<span class="cell-sub">' + esc(c.time) + "</span>",
        '<div class="actions"><button class="btn small primary" data-act="cf-fix" data-id="' + c.id + '">裁定</button></div>'
      ]);
    }) : [{ attrs: "", cells: [{ html: '<div class="empty"><span class="big">✓</span>没有待处理的同步冲突</div>', cls: "" }] }];

    return pageHead("账号来源", "账号从人事系统或企业微信同步过来，平台不再单独维护一套；两边信息打架时，停下来让人判断，不自动覆盖。",
      '<button class="btn" data-act="idp-all">全部立即同步</button>') +
      ruleChips(["BR-BS-05", "BR-BS-06", "BR-BS-07"]) +
      '<div class="grid grid--3">' + cards + "</div>" +
      '<h2 class="section">同步冲突 <span class="hint">工号重复、姓名同音这类问题，自动覆盖会造成错账</span></h2>' +
      card("", "", table(["编号", "类型", "来源 A", "来源 B", "发现时间", { label: "操作", cls: "num" }], cfRows)) +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("同步规则", "写进 PRD 的硬约束", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>平台侧字段<b>只读</b>，人工改不了</li><li>离职/停用 <b>15 分钟内</b>生效，失败 30 分钟内告警</li>" +
        "<li>冲突进待处理清单，由管理员裁定</li><li>同步失败用最近一次结果，界面标注“数据可能延迟”</li></ul>") +
      card("为什么不让系统自动定", "一个真实场景", '<div class="note warn"><b>工号 G10238 在 AD 和 HR 里是两个人。</b><br>' +
        "如果自动以某一方为准，另一个人的历史单据、绩效、权限会挂到错误的人身上，事后很难查。所以设计成“停下来问人”。</div>") +
      "</div>";
  }

  // ---------- sessions ----------
  function pageSessions() {
    var rows = S.sessions.map(function (s) {
      return row([s.user, s.dept, s.app, s.ip, s.id].join(" "), s.status, [
        '<div class="cell-main">' + esc(s.user) + '</div><div class="cell-sub">' + esc(s.dept) + "</div>",
        esc(s.app),
        '<span class="mono">' + esc(s.ip) + "</span>" + (s.status === "suspicious" ? " " + tag("异地", "red") : ""),
        '<div class="cell-sub">' + esc(s.device) + "</div>",
        '<div class="cell-sub">' + esc(s.loginAt) + "<br>最后操作 " + esc(s.lastActive) + "</div>",
        statusTag(s.status),
        '<div class="actions">' +
        (s.status !== "revoked" ? '<button class="btn small danger" data-act="sess-kill" data-id="' + s.id + '">强制下线</button>' : "") +
        '<button class="btn small" data-act="sess-detail" data-id="' + s.id + '">详情</button></div>'
      ]);
    });

    return pageHead("登录状态", "谁在登录、从哪登录、登录了哪些系统，都能看到；发现异常可以立刻让他下线；点一次退出，所有应用一起退出。",
      '<button class="btn" data-act="slo-demo">单点登出演示</button>') +
      ruleChips(["BR-BS-01", "BR-BS-02", "BR-BS-03", "BR-BS-13"]) +
      '<div class="grid grid--4" style="margin-bottom:14px">' +
      stat("当前在线", S.sessions.filter(function (x) { return x.status === "active"; }).length, "含 1 个可疑登录", true) +
      stat("今日登录", "1,832", "峰值 14:02（214 次/分）") +
      stat("登录凭证有效期", "2 小时", "可配 5 分钟～8 小时") +
      stat("强制下线", "3 次", "平均生效 8 秒") +
      "</div>" +
      card("", "", table(["用户 / 部门", "应用", "IP", "终端", "登录 / 最后操作", "状态", { label: "操作", cls: "num" }], rows, "sessions-table")) +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("登录链路", "从访问到放行", '<div class="timeline">' +
        [["访问应用", "未登录 → 跳转统一登录", "ok"], ["确认账号来源", "AD / 企微扫码 / 本地降级", "ok"],
        ["发放登录凭证", "含用户、应用、权限范围、过期时间", "ok"], ["回跳应用", "应用校验登录凭证并放行", "ok"],
        ["记录登录状态", "IP、终端、最后操作时间可查", "ok"]].map(function (x) {
          return '<div class="tl-item ' + x[2] + '"><div class="t">' + x[0] + '</div><div class="m">' + x[1] + "</div></div>";
        }).join("") + "</div>") +
      card("异常与降级", "出问题时人要知道发生了什么", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>账号来源不可用 → 本地账号登录（开关），并记录降级事件</li><li>同时登录数超限 → 退出最早的那次登录并提示原因</li>" +
        "<li>强制下线 → 30 秒内生效，用户看到“已被管理员下线”</li><li>异地/异常终端 → 标记可疑，进入操作记录</li></ul>") +
      "</div>";
  }

  // ---------- params ----------
  function pageParams() {
    var rows = S.params.map(function (p) {
      return row([p.key, p.name, p.group, p.sensitivity].join(" "), p.sensitivity, [
        '<div class="cell-main mono">' + esc(p.key) + '</div><div class="cell-sub">' + esc(p.name) + "</div>",
        esc(p.group),
        '<span class="mono">' + esc(p.value) + "</span>",
        sensTag(p.sensitivity),
        '<div class="cell-sub">' + esc(p.scope) + "</div>",
        '<div class="cell-sub">' + esc(p.updatedBy) + "<br>" + esc(p.updatedAt) + "</div>",
        '<div class="actions"><button class="btn small primary" data-act="param-edit" data-id="' + p.key + '">修改</button>' +
        '<button class="btn small" data-act="param-history" data-id="' + p.key + '">历史</button>' +
        (p.history > 1 ? '<button class="btn small" data-act="param-rollback" data-id="' + p.key + '">回滚</button>' : "") +
        "</div>"
      ]);
    });
    return pageHead("系统设置", "一些运行开关和阈值，不改代码、不用发版就能调整；重要的设置要审批，改错了可以一键恢复。", "") +
      ruleChips(["BR-BS-18", "BR-BS-19", "BR-BS-20"]) +
      card("", "", table(["设置项", "分组", "当前值", "敏感度", "生效范围", "最近变更", { label: "操作", cls: "num" }], rows, "params-table")) +
      '<div class="grid grid--3" style="margin-top:14px">' +
      card("四级敏感度", "决定审批强度", '<div style="display:grid;gap:8px">' +
        [["公开", "直接生效，记录留痕", "gray"], ["内部", "一级审批（平台管理员）", "blue"],
        ["敏感", "安全管理员审批 + 留痕", "amber"], ["安全", "双人复核，缺一不可", "red"]]
          .map(function (x) { return '<div style="display:flex;align-items:center;gap:8px">' + sensTag(x[0]) + '<span style="font-size:12.5px;color:#44506a">' + x[1] + "</span></div>"; }).join("") + "</div>") +
      card("生效与回滚", "演示加速版：真实 10 秒内", '<div class="note">点击任意参数的「修改」，会依次看到：变更原因校验 → 审批 → 灰度生效 → 回滚。<br><br>' +
        "真实系统里生效时延 ≤10 秒，本原型为了演示加速到 1.2 秒。</div>") +
      card("默认值兜底", "系统设置读取失败时", '<div class="note warn">设置读取失败时使用默认值并告警，<b>不允许因设置缺失导致系统不可用</b>。<br><br>这条容易被忽略，但它是“系统设置”和“写在代码里”的本质区别。</div>') +
      "</div>";
  }

  // ---------- files ----------
  function pageFiles() {
    var quotas = S.fileQuotas.map(function (q) {
      var pct = Math.round(q.used / q.total * 100);
      var cls = pct >= 100 ? "danger" : pct >= 80 ? "warn" : "";
      return '<div class="quota"><div><b>' + esc(q.app) + '</b> <span class="hint">' + q.used + " / " + q.total + " " + q.unit + "</span></div>" +
        '<div class="hint">' + pct + "%</div>" +
        '<div class="bar-cell"><div class="progress ' + cls + '"><i style="width:' + Math.min(pct, 100) + '%"></i></div></div></div>';
    }).join("");

    var rows = S.files.map(function (f) {
      return row([f.name, f.app, f.status].join(" "), f.status, [
        '<div class="cell-main">' + esc(f.name) + '</div><div class="cell-sub mono">' + f.id + " · v" + f.version + "</div>",
        esc(f.app),
        '<span class="mono">' + esc(f.size) + "</span>",
        statusTag(f.status),
        '<div class="cell-sub">' + esc(f.owner) + " · " + esc(f.updatedAt) + "</div>",
        '<div class="actions">' +
        '<button class="btn small" data-act="file-versions" data-id="' + f.id + '">版本</button>' +
        '<button class="btn small" data-act="file-link" data-id="' + f.id + '">' + (f.link ? "外链管理" : "分享") + "</button>" +
        (f.status !== "archived" ? '<button class="btn small" data-act="file-archive" data-id="' + f.id + '">归档</button>' : "") +
        "</div>"
      ]);
    });

    return pageHead("文件存储", "所有系统的文件都存到这里：有容量上限、有历史版本、上传要查毒、旧文件自动归档、对外分享要设密码和期限。",
      '<button class="btn primary" data-act="file-upload">＋ 上传文件</button>') +
      ruleChips(["BR-BS-22", "BR-BS-23", "BR-BS-25", "BR-BS-28"]) +
      '<div class="grid grid--sidebar">' +
      card("文件库", "演示数据，上传会真实校验配额与格式", table(["文件", "所属应用", "大小", "状态", "上传人 / 时间", { label: "操作", cls: "num" }], rows, "files-table")) +
      card("应用存储配额", "80% 预警，100% 拒绝上传", '<div>' + quotas + "</div>" +
        '<div class="note warn" style="margin-top:10px">生产管理系统已用到 89.5%，下次上传大文件会被拒绝。这就是“配额”存在的意义：让问题提前暴露，而不是磁盘满了才发现。</div>') +
      "</div>" +
      '<div class="grid grid--3" style="margin-top:14px">' +
      card("上传时会检查什么", "顺序即校验顺序", '<div class="steps">' +
        ["格式白名单", "大小 ≤ 2GB", "应用剩余配额", "病毒/恶意内容扫描", "相同内容秒传"].map(function (t, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + t + "</div></div></div>";
        }).join("") + "</div>") +
      card("版本与归档", "文件不是一次性的", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>保留最近 <b>10 个版本</b>，历史可下载</li><li>180 天未访问转归档，仍可下载但较慢</li><li>清理前 <b>30 天</b>通知上传人</li><li>归档文件也在记录范围里</li></ul>") +
      card("外链分享", "对外发文件的风险点", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>必须设有效期与提取码</li><li>可随时撤销</li><li>分享与下载都留痕</li><li>敏感文件不允许外链，只能走审批导出</li></ul>") +
      "</div>";
  }

  // ---------- messages ----------
  function pageMessages() {
    var tpl = S.templates.filter(function (t) { return t.id === UI.msgTemplate; })[0] || S.templates[0];
    var tplList = S.templates.map(function (t) {
      return '<div class="callout-row" data-act="msg-pick" data-id="' + t.id + '" style="cursor:pointer;padding:10px;border-radius:8px;' +
        (t.id === tpl.id ? "background:#f5f8ff;border:1px solid #d8e2ff" : "") + '">' +
        '<div class="grow"><div class="cell-main">' + esc(t.name) + '</div><div class="cell-sub">' + esc(t.channels.join(" + ")) + " · " + esc(t.owner) + "</div></div>" +
        (t.status === "approved" ? tag("已审核", "green") : tag("待审核", "amber")) + "</div>";
    }).join("");

    var incoming = S.messages.slice(0, 8).map(function (m) {
      return row([m.template, m.user, m.channel, m.status].join(" "), m.status, [
        '<span class="mono">' + m.id + "</span>", esc(m.template), esc(m.user), esc(m.channel),
        statusTag(m.status), '<span class="cell-sub">' + esc(m.time) + "</span>",
        '<span class="cell-sub">' + esc(m.note) + "</span>"
      ]);
    });

    var sent = S.messages.length, ok = S.messages.filter(function (m) { return m.status === "success"; }).length;
    var tried = S.messages.filter(function (m) { return m.status !== "blocked"; }).length;
    var rate = tried ? Math.round(ok / tried * 100) : 0;

    var CHANS = ["站内信", "企业微信", "短信", "邮件"];
    var chanStats = CHANS.map(function (c) {
      var list = S.messages.filter(function (m) { return m.channel === c && m.status !== "blocked"; });
      var good = list.filter(function (m) { return m.status === "success"; }).length;
      return { c: c, n: list.length, rate: list.length ? Math.round(good / list.length * 100) : null };
    });
    var low = chanStats.filter(function (x) { return x.rate !== null && x.rate < 95; });

    return pageHead("消息通知", "短信、邮件、企业微信、站内信都从这里发；发之前检查内容、时间和频率，主通道坏了自动换备用通道。", "") +
      ruleChips(["BR-BS-29", "BR-BS-31", "BR-BS-32", "BR-BS-34"]) +
      '<div class="grid grid--sidebar">' +
      card("模板列表", "只有已审核的模板能发", '<div style="display:grid;gap:6px">' + tplList + "</div>") +
      card("发送一条消息", "故意设计成会踩坑", "" +
        '<div class="field"><label>接收人</label><select class="select" id="msg-user">' +
        ["李娜（质量部 / 在职）", "王强（制造部 / 在职）", "赵敏（供应链 / 在职）", "刘工（行政部 / 已停用）"]
          .map(function (u) { return '<option value="' + esc(u) + '" ' + (UI.msgUser === u ? "selected" : "") + ">" + esc(u) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label>紧急度</label><select class="select" id="msg-urgent">' +
        '<option value="0" ' + (!UI.msgUrgent ? "selected" : "") + '>普通（22:00-08:00 免打扰）</option>' +
        '<option value="1" ' + (UI.msgUrgent ? "selected" : "") + '>紧急（可突破免打扰，留痕）</option></select></div>' +
        '<div class="field"><label>内容变量</label><input class="input" id="msg-vars" value="指标=一次合格率 93.2%；阈值=95%；责任线= SMT-2"></div>' +
        '<div style="display:grid;gap:8px;margin:12px 0;padding:10px;background:#fafbfe;border:1px dashed #d9e0ee;border-radius:8px">' +
        toggle("quiet", "模拟 23:00（免打扰时段）", UI.quiet) +
        toggle("smsDown", "模拟短信通道故障", UI.smsDown) +
        toggle("dup", "模拟 5 分钟内重复发送", UI.dup) +
        "</div>" +
        '<div class="rule-chip" style="margin-bottom:8px">当前模板 ' + tpl.id + " · " + esc(tpl.channels.join(" + ")) + "</div>" +
        '<button class="btn primary" style="width:100%" data-act="msg-send">发送</button>' +
        '<div class="note" style="margin-top:12px">结果会实时写入下方发送记录和操作记录。</div>') +
      "</div>" +
      '<h2 class="section">到达率 <span class="hint">低于 95% 触发告警（BR-BS-35）；样本少时仅供参考</span></h2>' +
      '<div class="grid grid--2">' +
      card("各通道到达率", "今日 · 按实际发送记录计算", '<div class="bars">' +
        chanStats.map(function (x) { return bar(x.c, x.rate); }).join("") + "</div>" +
        '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:#7a869c;margin-top:8px"><span>' +
        (low.length ? low.map(function (x) { return x.c + " " + x.rate + "%"; }).join("、") + " 低于阈值，已告警" : "各通道均达标") +
        "</span><span>总到达率 " + rate + "%（已排除被拦截）</span></div>") +
      card("通道降级演示", "自动切换，不自动切回", '<div class="note warn">打开上方“模拟短信通道故障”再点发送：<br>系统会判定主通道连续失败，<b>自动切换到企业微信</b>并记录降级事件；恢复后<b>不会自动切回</b>，需要管理员确认。</div>') +
      "</div>" +
      '<h2 class="section">发送记录</h2>' +
      card("", "", table(["记录号", "模板", "接收人", "通道", "状态", "时间", "说明"], incoming, "msg-table"));
  }
  function bar(label, pct) {
    var h = pct === null ? 5 : Math.max(pct, 5);
    var style = pct === null ? "background:#d6dcea;" : (pct < 95 ? "background:linear-gradient(180deg,#f3b34a,#d98a06);" : "");
    return '<div class="bar"><i style="height:' + h + "%;" + style + '"></i><span>' + esc(label) +
      (pct === null ? "<br>—" : "<br>" + pct + "%") + "</span></div>";
  }
  function toggle(key, label, on) {
    return '<label class="switch"><input type="checkbox" data-toggle="' + key + '" ' + (on ? "checked" : "") + '><span class="track"></span>' + esc(label) + "</label>";
  }

  // ---------- apis ----------
  function pageApis() {
    var rows = S.apis.map(function (a) {
      return row([a.name, a.version, a.status, a.owner, a.scope].join(" "), a.status, [
        '<div class="cell-main">' + esc(a.name) + '</div><div class="cell-sub mono">' + a.id + "</div>",
        '<span class="mono">' + a.version + "</span>",
        statusTag(a.status),
        esc(a.owner) + '<div class="cell-sub">' + esc(a.scope) + "</div>",
        '<div class="num">' + num(a.callsToday) + '<div class="cell-sub">QPS ' + a.qps + "</div></div>",
        '<div class="num">' + (a.status === "published" ? a.successRate + "%" : "—") + '<div class="cell-sub">P95 ' + (a.p95 || "—") + "ms</div></div>",
        '<div class="actions"><button class="btn small" data-act="api-detail" data-id="' + a.id + '">详情</button>' +
        (a.status !== "offline" ? '<button class="btn small danger" data-act="api-offline" data-id="' + a.id + '">下线</button>' : "") + "</div>"
      ]);
    });

    var mapRows = S.mappings.map(function (m) {
      return row([m.name, m.source, m.status].join(" "), m.status, [
        '<div class="cell-main">' + esc(m.name) + '</div><div class="cell-sub mono">' + m.id + " · " + m.version + "</div>",
        esc(m.source) + " → " + esc(m.target),
        m.fields + " 个字段",
        statusTag(m.status),
        '<div class="actions"><button class="btn small" data-act="map-run" data-id="' + m.id + '">试跑 100 条</button></div>'
      ]);
    });

    return pageHead("系统对接", "系统之间怎么对接、调用量多大、失败了多少，都在这里登记和监控；数据搬运先小样本试跑，错了能看到是哪一条、哪个字段。",
      '<button class="btn primary" data-act="api-new">＋ 登记接口</button>') +
      ruleChips(["BR-BS-38", "BR-BS-39", "BR-BS-43", "BR-BS-46"]) +
      card("接口列表", "未登记接口不允许被调用", table(["接口", "版本", "状态", "负责人 / 授权范围", { label: "今日调用", cls: "num" }, { label: "成功率 / P95", cls: "num" }, { label: "操作", cls: "num" }], rows, "apis-table")) +
      '<h2 class="section">字段映射 <span class="hint">类型不兼容必须显式转换，错误进清单而不是丢弃</span></h2>' +
      card("", "", table(["映射", "源 → 目标", "字段数", "状态", { label: "操作", cls: "num" }], mapRows)) +
      '<div class="grid grid--sidebyside" style="margin-top:14px;display:grid;grid-template-columns:1.5fr 1fr;gap:14px">' +
      card("调用记录（最近 8 条）", "脱敏规则与操作记录一致", table(["记录", "接口", "调用方", "时间", { label: "耗时", cls: "num" }, "结果"], S.callLogs.slice(0, 8).map(function (c) {
        return row([c.api, c.app, c.result].join(" "), c.result, [
          '<span class="mono">' + c.id + "</span>", esc(c.api), esc(c.app),
          '<span class="cell-sub">' + c.time + "</span>", '<span class="num">' + c.cost + " ms</span>",
          c.result === "成功" ? tag("成功", "green") : tag(c.result, "red") + ' <span class="mono">' + c.code + "</span>"
        ]);
      }))) +
      card("限流与熔断", "保护自己，也保护别人", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>应用级与接口级双层限流</li><li>单应用默认 200 QPS，调整需审批</li><li>连续失败触发熔断，30 秒后半开重试</li>" +
        "<li>未登记调用直接拒绝（401）</li><li>非工作时间批量调用自动标记</li></ul>" +
        '<div class="note" style="margin-top:10px">点开任意接口详情，可改 QPS、看版本、执行下线。</div>') +
      "</div>";
  }

  // ---------- audit ----------
  function pageAudit() {
    var types = ["全部", "登录", "导出报表", "设置变更", "应用审核", "消息发送", "接口调用", "强制下线", "密钥轮换", "文件下载"];
    var rows = S.audit.map(function (a) {
      return row([a.id, a.actor, a.action, a.object, a.system, a.result, a.ip].join(" "), a.action, [
        '<div class="cell-sub mono">' + a.id + "</div>",
        '<span class="cell-sub">' + esc(a.time) + "</span>",
        '<div class="cell-main">' + esc(a.actor) + "</div><div class=\"cell-sub\">" + esc(a.ip) + "</div>",
        '<div class="cell-main">' + esc(a.action) + "</div>" + (a.sensitive ? ' <span class="tag red" style="font-size:10px">敏感</span>' : ""),
        esc(a.object) + '<div class="cell-sub">' + esc(a.system) + "</div>",
        a.result === "成功" ? tag("成功", "green") : (a.result === "失败" ? tag("失败", "red") : tag(a.result, "amber")),
        '<div class="actions"><button class="btn small" data-act="audit-detail" data-id="' + a.id + '">详情</button></div>'
      ]);
    });

    return pageHead("操作记录", "谁、什么时候、在哪个系统、对什么数据、做了什么、结果如何——这六项齐全，才算一条能用来追溯的记录。",
      '<button class="btn" data-act="audit-export">导出操作记录</button>') +
      ruleChips(["BR-BS-14", "BR-BS-15", "BR-BS-16", "BR-BS-17"]) +
      card("", "", table(["记录", "时间", "操作人 / IP", "操作", "对象 / 来源", "结果", { label: "操作", cls: "num" }], rows, "audit-table"),
        "", '<div class="toolbar" style="border-bottom:none;padding:0">' +
        '<div class="search"><input class="input" placeholder="搜人、对象、IP" data-filter="auditQuery" id="audit-search"></div>' +
        '<select class="select" id="audit-type" style="width:150px"><option value="all">全部操作类型</option>' +
        types.slice(1).map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + "</option>"; }).join("") + "</select>" +
        '<label class="check"><input type="checkbox" id="audit-sens"> 只看敏感操作</label>' +
        '<div class="spacer"></div><span style="font-size:12px;color:#7a869c">留存 180 天 · 只追加不修改</span></div>') +
      '<div class="grid grid--3" style="margin-top:14px">' +
      card("日志六要素", "缺一条都不合格", '<div style="display:grid;gap:6px;font-size:12.5px">' +
        ["操作人", "时间", "来源系统", "操作类型", "操作对象", "结果", "IP"].map(function (x) {
          return '<div style="display:flex;gap:8px"><span style="color:#15915b">✓</span>' + x + "</div>";
        }).join("") + "</div>") +
      card("敏感字段处理", "日志里不能有原值", '<div class="note danger">手机号在日志里是 <span class="mono">138****5678</span>，身份证是 <span class="mono">110***********1234</span>。<br><br>' +
        "密码、银行卡号<b>完全禁止入库</b>。要看原值，必须单独申请，走安全管理员审批。</div>") +
      card("日志不可篡改", "管理员也不行", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>只追加，不提供修改入口</li><li>删除需安全管理员 + 审计员双签</li><li>到期归档，不直接销毁</li><li>关键日志可上链存证（BS-24）</li></ul>") +
      "</div>";
  }

  // ---------- rules ----------
  function pageRules() {
    var domains = ["all"].concat(S.rules.map(function (r) { return r.topic; }).filter(function (v, i, a) { return a.indexOf(v) === i; }));
    var done = S.rules.filter(function (r) { return r.confirmed; }).length;
    var rows = S.rules.map(function (r, i) {
      return row([r.id, r.topic, r.text, r.point].join(" "), r.topic, [
        '<span class="mono">' + r.id + "</span>",
        tag(r.topic, "blue"),
        esc(r.text),
        '<span class="mono">' + r.point + "</span>",
        '<label class="check"><input type="checkbox" data-rule="' + r.id + '" ' + (r.confirmed ? "checked" : "") + "></label>",
        '<a class="btn small" href="#/' + r.demo + '">去演示</a>'
      ]);
    });
    return pageHead("业务规则清单", "PRD 第 6 章有 97 条规则，这里放了 56 条可在原型里验证的。评审时逐条勾“确认”，比讨论整段文字有效得多。", "") +
      '<div class="grid grid--2" style="margin-bottom:14px">' +
      card("确认进度", "勾选即保存到本地", progressBlock(done, S.rules.length, "已确认 " + done + " / " + S.rules.length + " 条") +
        '<div style="margin-top:10px;font-size:12px;color:#7a869c">未确认的规则意味着“业务上还没定”，开发不应该开工。</div>') +
      card("怎么用这张表", "评审会议操作指引", '<div class="steps">' +
        ["按主题过滤，比如只看“消息”", "逐条读规则，问业务“认不认”", "不认就当场改文字，记到问题清单", "认了就勾上，进度条会走"].map(function (t, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + t + "</div></div></div>";
        }).join("") + "</div>") +
      "</div>" +
      card("", "", table(["编号", "主题", "规则内容", "功能点", "已确认", { label: "验证", cls: "num" }], rows, "rules-table"),
        "", '<div class="toolbar" style="border-bottom:none;padding:0">' +
        '<div class="search"><input class="input" placeholder="搜规则内容或编号" data-filter="ruleQuery" style="width:280px"></div>' +
        '<div class="seg" data-seg="ruleDomain"><button data-val="all" class="on">全部</button>' +
        domains.slice(1).map(function (d) { return '<button data-val="' + esc(d) + '">' + esc(d) + "</button>"; }).join("") + "</div></div>");
  }

  // ---------- questions ----------
  function pageQuestions() {
    var decided = S.questions.filter(function (q) { return q.decision !== "pending"; }).length;
    var rows = S.questions.map(function (q) {
      return row([q.id, q.text, q.owner].join(" "), q.decision, [
        '<span class="mono">' + q.id + "</span>",
        '<div class="cell-main" style="font-weight:600">' + esc(q.text) + "</div>",
        '<span class="cell-sub">' + esc(q.impact) + "</span>",
        '<span class="cell-sub">' + esc(q.suggest) + "</span>",
        esc(q.owner),
        '<select class="select" data-q="' + q.id + '" style="width:120px;height:30px">' +
        [["pending", "待讨论"], ["accept", "采纳建议"], ["change", "需要修改"], ["reject", "不适用"]]
          .map(function (o) { return '<option value="' + o[0] + '" ' + (q.decision === o[0] ? "selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>"
      ]);
    });
    return pageHead("待确认问题", "这些问题不拍板，开发就只能猜。选完可以导出成清单，直接发给甲方。",
      '<button class="btn primary" data-act="q-export">导出问题清单</button>') +
      '<div class="grid grid--3" style="margin-bottom:14px">' +
      stat("问题总数", S.questions.length, "来自 PRD 第 11 章") +
      stat("已定", decided, "采纳 / 修改 / 不适用") +
      stat("未定", S.questions.length - decided, "未定的不许开工", true) +
      "</div>" +
      card("", "", table(["编号", "问题", "影响", "建议默认值", "决策人", "结论"], rows, "questions-table")) +
      '<div class="note" style="margin-top:14px">改完结论会自动保存；导出的 Markdown 带“结论 / 影响 / 建议”，可直接贴进评审纪要。</div>';
  }

  // ---------- viz placeholder ----------
  function pageViz() {
    return pageHead("数据可视化系统", "这是同一个原型外壳里的第二个模块。它和基础支撑不是一回事：一个管“能力给谁用”，一个管“数据怎么看”。", "") +
      '<div class="card"><div class="route-placeholder">' +
      '<div class="big">▦</div><h2>可视化原型已就绪</h2>' +
      "<p>13 个页面：经营总览、质量分析、生产实时状态、销售分析、报表制作、数据表与质量、指标定义、展示屏设计、预警提醒、数据来源关系、导出审批。点下面的按钮打开。</p>" +
      '<div style="margin:18px 0"><a class="btn primary" href="../prototype-all/index.html#/viz/dashboard">在统一外壳里打开（推荐）→</a><a class="btn" href="../prototype-viz/index.html" style="margin-left:8px">单独打开</a></div>' +
      '<div class="plan-grid">' + S.vizScreens.map(function (s) {
        return '<div class="plan-item">' + esc(s) + "</div>";
      }).join("") + "</div>" +
      '<div style="margin-top:22px"><a class="btn" href="#/overview">← 回到基础支撑</a></div>' +
      "</div></div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("为什么不能合成一个原型", "两层东西", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li><b>用户不同</b>：这里是集成方与平台管理员，那边是决策者与分析师</li>" +
        "<li><b>交互范式不同</b>：这里是表单、审批、监控；那边是拖拽、下钻、大屏</li>" +
        "<li><b>验收方式不同</b>：这里验接口与权限，那边验口径与时效</li></ul>") +
      card("为什么又要放在一起", "一个外壳的价值", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>同一个人（管理员）两边都要进，不用记两个地址</li><li>组件、状态标签、权限提示可以复用</li>" +
        "<li>评审时能直接演示“能力被谁调用、数据从哪来”</li></ul>") +
      "</div>";
  }

  // ---------------- guide ----------------
  function openGuide() {
    openDrawer({
      title: "原型说明",
      sub: "这是业务逻辑原型，不是最终视觉稿",
      body:
        '<div class="note">目的：把 PRD 里的文字变成可以点的界面，让业务和开发在“同一个东西”上讨论，而不是各想各的。</div>' +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">怎么用</h3>" +
        '<div class="steps">' +
        [["从总览开始", "先看平台提供的能力，建立“这是底座”的印象"],
        ["按演示路径走一遍", "5 个场景覆盖了登录、账号、设置、通知、操作记录"],
        ["踩一次坑", "消息中心故意设计了免打扰、频控、通道故障三种拦截"],
        ["去规则清单勾选", "56 条规则逐条确认，这就是需求评审"],
        ["导出问题清单", "把没定的事带走，比开会口头说有效"]].map(function (s, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + s[0] + '</div><div class="step__d">' + s[1] + "</div></div></div>";
        }).join("") + "</div>" +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">三个约定</h3>" +
        '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>所有操作都会写入<b>操作记录</b>，这是刻意的：这个模块的核心价值就是留痕</li>" +
        "<li>数据存在浏览器 localStorage，刷新不丢；点“重置演示数据”可恢复</li>" +
        "<li>页面上的规则编号（如 BR-BS-32）对应 PRD 第 6 章，可在“业务规则清单”查</li></ul>" +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">对应文档</h3>" +
        '<div style="font-size:12.5px;color:#44506a;line-height:2">PRD-基础支撑管理 v0.9（第 1～12 章）<br>' +
        "PRD-数据可视化系统 v0.9（见统一外壳）<br>条款台账_三模块.csv（规则与功能点编号）</div>"
    });
  }

  // =========================================================
  // ACTIONS
  // =========================================================
  var ACT = {};

  ACT.guide = openGuide;

  ACT.reset = function () {
    openModal({
      title: "重置演示数据？",
      sub: "会清掉你在浏览器里产生的所有操作记录",
      body: '<div class="note warn">重置后回到初始的 6 个应用、5 条登录状态、10 条操作记录。演示环境专用，真实系统不会有这个按钮。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn danger" data-act="reset-confirm">确认重置</button>'
    });
  };
  ACT["reset-confirm"] = function () {
    try { localStorage.removeItem(STORE); } catch (e) { }
    S = clone(window.DB);
    closeModal(); save(); render();
    toast("已重置", "演示数据已恢复初始状态", "success");
  };

  // ---- apps ----
  ACT["app-new"] = function () {
    openModal({
      id: "app-new", wide: true,
      title: "新建接入申请",
      sub: "能力申请按最小化原则，超出默认范围需要安全管理员审批",
      body:
        '<div class="form-row"><div class="field"><label>应用名称<span class="req">*</span></label>' +
        '<input class="input" id="f-name" placeholder="如：智慧能耗管理系统"></div>' +
        '<div class="field"><label>负责人<span class="req">*</span></label>' +
        '<input class="input" id="f-owner" placeholder="部门 + 姓名"></div></div>' +
        '<div class="field"><label>用途<span class="req">*</span></label>' +
        '<input class="input" id="f-use" placeholder="一句话说明这个应用要用平台能力做什么"></div>' +
        '<div class="field"><label>申请能力<span class="req">*</span></label>' +
        '<div class="check-group">' +
        ["统一认证", "文件服务", "消息服务", "数据集成", "接口调用"].map(function (c) {
          return '<label class="check"><input type="checkbox" name="f-scope" value="' + c + '">' + c + "</label>";
        }).join("") + "</div>" +
        '<div class="help">BR-BS-09：默认只给“统一认证”；文件、消息、集成需说明用途。</div></div>' +
        '<div class="field"><label>回调地址<span class="req">*</span></label>' +
        '<input class="input" id="f-callback" placeholder="https://energy.corp.local/auth/callback">' +
        '<div class="help">BR-BS-08：必须 HTTPS + 白名单域名，禁止通配符。白名单：quality / mes / bi / scm / energy / access .corp.local</div></div>' +
        '<div class="form-row"><div class="field"><label>预计日调用量</label>' +
        '<input class="input" id="f-calls" type="number" value="50000"></div>' +
        '<div class="field"><label>观察期</label><select class="select" id="f-observe"><option>30 天</option><option>14 天</option><option>不设观察期（需安全审批）</option></select></div></div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="app-submit">提交申请</button>'
    });
  };

  ACT["app-submit"] = function () {
    var name = val("f-name"), owner = val("f-owner"), use = val("f-use"), cb = val("f-callback");
    var scopes = $$('input[name=f-scope]:checked').map(function (x) { return x.value; });
    if (!name) return fail("f-name", "应用名称必填", "BR-BS-11");
    if (!owner) return fail("f-owner", "负责人必填", "BR-BS-11");
    if (!use) return fail("f-use", "用途必填，否则无法判断能力是否必要", "BR-BS-11");
    if (!scopes.length) { toast("能力未选择", "至少选择一项能力，默认应选“统一认证”", "error", "BR-BS-09"); return; }
    if (!/^https:\/\//i.test(cb)) return fail("f-callback", "回调地址必须使用 HTTPS", "BR-BS-08");
    var host = cb.replace(/^https:\/\//i, "").split("/")[0];
    var white = ["quality.corp.local", "mes.corp.local", "bi.corp.local", "scm.corp.local", "energy.corp.local", "access.corp.local"];
    if (white.indexOf(host) === -1) {
      return fail("f-callback", "域名 " + host + " 不在白名单内，禁止通配符", "BR-BS-08");
    }
    var app = {
      id: uid("APP", S.apps), name: name, owner: owner,
      status: "pending", scopes: scopes, callback: cb,
      qps: 100, callsToday: 0, callQuota: Number(val("f-calls") || 50000),
      createdAt: fmtDate(), credentialExpiry: "—", lastCall: "—", successRate: 0,
      note: "待平台管理员审核 · " + use
    };
    S.apps.unshift(app);
    log("应用接入申请", name + "（" + app.id + "）", "成功", "申请能力：" + scopes.join("/") + "；回调：" + cb, false);
    save(); closeModal(); render();
    toast("申请已提交", name + " 进入待审核，SLA 1 个工作日（BR-BS-10）", "success", "BR-BS-11");
  };

  ACT["app-review"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    openModal({
      id: "app-review", wide: true,
      title: "审核接入申请 · " + a.name,
      sub: a.id + " · 提交于 " + a.createdAt,
      body: kv([["负责人", a.owner], ["申请能力", a.scopes.join(" / ")], ["回调地址", '<span class="mono">' + esc(a.callback) + "</span>", true],
        ["预计日调用", num(a.callQuota)], ["用途", a.note]]) +
        '<div class="field" style="margin-top:16px"><label>审核意见</label><textarea class="input" id="f-review" rows="3" placeholder="通过请写“同意接入”；驳回请写清原因"></textarea></div>' +
        '<div class="note warn">通过后进入 30 天观察期；凭证有效期 12 个月，90 天零调用将自动停用。</div>',
      footer: '<button class="btn" data-close="modal">取消</button>' +
        '<button class="btn danger" data-act="app-reject" data-id="' + id + '">驳回</button>' +
        '<button class="btn primary" data-act="app-approve" data-id="' + id + '">通过并发放凭证</button>'
    });
  };
  ACT["app-approve"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    a.status = "running"; a.credentialExpiry = plusMonths(12);
    a.note = "审核通过 " + fmtTime() + "，进入 30 天观察期";
    log("应用审核", a.name + "（" + a.id + "）", "通过", "审核意见：" + (val("f-review") || "同意接入") + "；配额 " + num(a.callQuota) + "/日", false);
    save(); closeModal(); render();
    showCredential(a);
  };
  ACT["app-reject"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    var reason = val("f-review");
    if (!reason) { toast("驳回必须写原因", "否则申请方不知道该怎么改", "error", "BR-BS-10"); return; }
    a.status = "disabled"; a.note = "已驳回：" + reason;
    log("应用审核", a.name + "（" + a.id + "）", "驳回", "原因：" + reason, false);
    save(); closeModal(); render();
    toast("已驳回", a.name + "： " + reason, "warn");
  };

  function showCredential(a) {
    var secret = "sk_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    openModal({
      title: "凭证已生成 · " + a.name,
      sub: "只显示这一次，请立即保存",
      body: kv([["应用标识", '<span class="mono">' + a.id + "</span>", true],
        ["应用密钥", '<span class="mono" id="cred-secret">' + secret + "</span>", true],
        ["有效期至", a.credentialExpiry], ["授权能力", a.scopes.join(" / ")]]) +
        '<div class="note danger" style="margin-top:14px">关闭弹窗后密钥不再显示。BR-BS-10：凭证有效期 12 个月，到期前 30 天提醒续期。</div>',
      footer: '<button class="btn" data-act="cred-copy">复制密钥</button><button class="btn primary" data-close="modal">我已保存</button>'
    });
  }
  ACT["cred-copy"] = function () {
    var t = $("#cred-secret");
    if (!t) return;
    try {
      navigator.clipboard.writeText(t.textContent);
      toast("已复制", "请粘贴到安全的地方保存", "success");
    } catch (e) {
      toast("复制失败", "请手动选中复制", "warn");
    }
  };

  ACT["app-cred"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "密钥轮换 · " + a.name,
      sub: "双密钥并行过渡，旧密钥 7 天后失效",
      body: '<div class="note">当前密钥：<span class="mono">sk_••••••••3f2a</span>（2026-09-18 轮换）<br><br>' +
        "轮换后新密钥立即生效，旧密钥保留 7 天用于过渡。90 天未轮换会提醒（BR-BS-47）。</div>",
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="cred-rotate" data-id="' + id + '">确认轮换</button>'
    });
  };
  ACT["cred-rotate"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    log("密钥轮换", a.name + "（" + a.id + "）", "成功", "双密钥并行；旧密钥 7 天后失效", true);
    save(); closeModal(); render();
    toast("轮换完成", "新旧密钥并行 7 天，期间两者都可用", "success", "BR-BS-47");
  };

  ACT["app-disable"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "停用应用 · " + a.name,
      body: '<div class="note danger">停用后该应用所有登录凭证立即失效，接口调用返回 <span class="mono">403</span>。<br><br>' + esc(a.note || "") + "</div>",
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn danger" data-act="app-disable-do" data-id="' + id + '">确认停用</button>'
    });
  };
  ACT["app-disable-do"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    a.status = "disabled"; a.note = "管理员手动停用 " + fmtTime();
    log("应用停用", a.name + "（" + a.id + "）", "成功", "登录凭证失效；调用返回 403", true);
    save(); closeModal(); render();
    toast("已停用", a.name + " 的登录凭证已全部失效", "warn");
  };

  ACT["app-detail"] = function (el, id) {
    var a = S.apps.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var used = Math.round(a.callsToday / a.callQuota * 100);
    openDrawer({
      title: a.name, sub: a.id + " · " + a.owner,
      body: statusTag(a.status) + "<div style=\"height:14px\"></div>" +
        kv([["负责人", a.owner], ["申请能力", a.scopes.join(" / ")],
          ["回调地址", '<span class="mono">' + esc(a.callback) + "</span>", true],
          ["创建时间", a.createdAt], ["凭证有效期", a.credentialExpiry],
          ["最近调用", a.lastCall], ["成功率", a.successRate + "%"]]) +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">今日调用配额</h3>" +
        progressBlock(a.callsToday, a.callQuota || 1, num(a.callsToday) + " / " + num(a.callQuota)) +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">备注</h3>" +
        '<div class="note">' + esc(a.note || "无") + "</div>" +
        "<h3 style=\"margin:18px 0 8px;font-size:14px\">相关规则</h3>" +
        '<div class="rules-inline">' + ["BR-BS-08", "BR-BS-09", "BR-BS-10", "BR-BS-47"].map(rule).join("") + "</div>"
    });
  };

  // ---- identity ----
  ACT["idp-sync"] = function (el, id) {
    el.disabled = true; el.textContent = "同步中…";
    setTimeout(function () {
      var s = S.identity.filter(function (x) { return x.id === id; })[0];
      s.lastSync = fmtTime();
      s.added = Math.floor(Math.random() * 5);
      s.changed = Math.floor(Math.random() * 15) + 2;
      s.disabled = Math.floor(Math.random() * 3);
      log("身份同步", s.name, "成功", "新增 " + s.added + " / 变更 " + s.changed + " / 停用 " + s.disabled, false);
      save(); render();
      toast("同步完成", s.name + "：新增 " + s.added + "，变更 " + s.changed + "，停用 " + s.disabled, "success", "BR-BS-06");
    }, 1100);
  };
  ACT["idp-all"] = function () {
    toast("批量同步已开始", "3 个账号来源按顺序同步，预计 20 秒", "info");
    S.identity.forEach(function (s, i) {
      setTimeout(function () {
        s.lastSync = fmtTime();
        s.added = Math.floor(Math.random() * 4);
        s.changed = Math.floor(Math.random() * 9);
        log("身份同步", s.name, "成功", "批量同步", false);
        save(); if (location.hash.indexOf("identity") > -1) render();
      }, 600 + i * 500);
    });
  };

  ACT["cf-fix"] = function (el, id) {
    var c = S.conflicts.filter(function (x) { return x.id === id; })[0];
    openModal({
      id: "cf-fix",
      title: "裁定同步冲突 · " + c.type,
      sub: c.id + " · 发现于 " + c.time,
      body: '<div class="note warn">系统不会替你选。选错会导致历史单据挂到错误的人身上，事后极难追溯（BR-BS-07）。</div>' +
        '<div class="field" style="margin-top:14px"><label>保留哪一条为主记录？</label>' +
        '<label class="check" style="margin-bottom:8px"><input type="radio" name="cf" value="a" checked> 保留 A：' + esc(c.a) + "</label>" +
        '<label class="check"><input type="radio" name="cf" value="b"> 保留 B：' + esc(c.b) + "</label></div>" +
        '<div class="field"><label>裁定说明</label><input class="input" id="f-cf-note" placeholder="如：以 HR 为准，AD 侧为历史遗留工号"></div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="cf-do" data-id="' + id + '">确认裁定</button>'
    });
  };
  ACT["cf-do"] = function (el, id) {
    var note = val("f-cf-note");
    if (!note) { toast("请填写裁定说明", "没有说明，三个月后没人知道为什么这么定", "error", "BR-BS-07"); return; }
    var c = S.conflicts.filter(function (x) { return x.id === id; })[0];
    S.conflicts = S.conflicts.filter(function (x) { return x.id !== id; });
    log("冲突裁定", c.id + " " + c.type, "成功", "说明：" + note, true);
    save(); closeModal(); render();
    toast("冲突已裁定", "已记录裁定人与说明", "success", "BR-BS-07");
  };

  // ---- sessions ----
  ACT["sess-kill"] = function (el, id) {
    var s = S.sessions.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "强制下线 · " + s.user,
      sub: s.id + " · " + s.app + " · " + s.ip,
      body: '<div class="note warn">该用户会看到“您已被管理员下线，请重新登录”，并需要重新认证。<br><br>生成一条操作记录，操作人是你。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn danger" data-act="sess-kill-do" data-id="' + id + '">确认下线</button>'
    });
  };
  ACT["sess-kill-do"] = function (el, id) {
    var s = S.sessions.filter(function (x) { return x.id === id; })[0];
    s.status = "revoked";
    log("强制下线", s.user + " @ " + s.app + "（" + s.id + "）", "成功", "30 秒内生效；已提示重新登录", false);
    save(); closeModal(); render();
    toast("已下发下线指令", s.user + " 的登录状态将在 30 秒内失效（BR-BS-13）", "success", "BR-BS-13");
  };
  ACT["sess-detail"] = function (el, id) {
    var s = S.sessions.filter(function (x) { return x.id === id; })[0];
    openDrawer({
      title: "登录详情 · " + s.user, sub: s.id,
      body: statusTag(s.status) + '<div style="height:14px"></div>' +
        kv([["所属部门", s.dept], ["应用", s.app], ["IP", s.ip], ["终端", s.device],
          ["登录时间", s.loginAt], ["最后操作", s.lastActive],
          ["登录凭证有效期", "2 小时（至 " + s.loginAt.split(" ")[0] + " 16:31）"]]) +
        '<div class="note warn" style="margin-top:14px">' + (s.status === "suspicious"
          ? "异地 IP 首次登录，已标记为可疑。建议核实本人后决定是否强制下线。"
          : "登录状态正常。") + "</div>"
    });
  };
  ACT["slo-demo"] = function () {
    openDrawer({
      title: "单点登出（SLO）演示",
      sub: "用户点一次退出，所有应用一起失效",
      body: '<div class="timeline">' +
        [["T+0s", "用户在任一应用点击“退出”", "ok"],
        ["T+1s", "认证中心接收登出请求，注销登录凭证", "ok"],
        ["T+2s", "向 3 个已接入应用广播登出", "ok"],
        ["T+3s", "质量追溯 / 生产管理 / 数据可视化 登录状态失效", "ok"],
        ["T+5s", "全部应用回到登录页，SLO 完成", "ok"]].map(function (x) {
          return '<div class="tl-item ' + x[2] + '"><div class="t">' + x[0] + " · " + x[1] + "</div></div>";
        }).join("") + "</div>" +
        '<div class="note" style="margin-top:12px">BR-BS-02：单点登出必须在 5 秒内使全部应用登录状态失效。超过 5 秒要记事件并告警。</div>'
    });
  };

  // ---- params ----
  ACT["param-edit"] = function (el, key) {
    var p = S.params.filter(function (x) { return x.key === key; })[0];
    var needSecond = p.sensitivity === "安全";
    openModal({
      id: "param-edit",
      title: "修改参数 · " + p.name,
      sub: p.key + " · 当前值 " + p.value + " · " + p.sensitivity + "级",
      body:
        '<div class="form-row"><div class="field"><label>当前值</label><input class="input" value="' + esc(p.value) + '" disabled></div>' +
        '<div class="field"><label>新值<span class="req">*</span></label><input class="input" id="f-pval" value="' + esc(p.value) + '"></div></div>' +
        '<div class="field"><label>变更原因<span class="req">*</span></label>' +
        '<input class="input" id="f-preason" placeholder="如：近期撞库增多，收紧锁定次数"></div>' +
        '<div class="field"><label>灰度范围</label><select class="select" id="f-pscope">' +
        "<option>全部应用</option><option>仅生产管理系统</option><option>仅质量追溯系统</option><option>按 10% 比例灰度</option></select></div>" +
        (p.sensitivity === "敏感" ? '<div class="note warn">敏感参数：需安全管理员审批（BR-BS-18）。</div>' : "") +
        (needSecond ? '<div class="note danger">安全参数：需双人复核，请勾选确认（BR-BS-18）。</div>' +
          '<label class="check" style="margin-top:10px"><input type="checkbox" id="f-psecond"> 已获得第二位审批人（安全管理员）复核</label>' : ""),
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="param-submit" data-id="' + p.key + '">提交并生效</button>'
    });
  };
  ACT["param-submit"] = function (el, key) {
    var p = S.params.filter(function (x) { return x.key === key; })[0];
    var nv = val("f-pval"), reason = val("f-preason"), scope = val("f-pscope");
    if (!reason) { toast("变更原因必填", "留痕是系统设置的第一价值", "error", "BR-BS-20"); return; }
    if (!nv) { toast("新值不能为空", "", "error"); return; }
    if (p.type === "数值" && isNaN(Number(nv))) { toast("类型不匹配", p.name + " 必须是数值", "error", "BR-BS-18"); return; }
    if (p.sensitivity === "安全" && !$("#f-psecond").checked) {
      toast("需要双人复核", "安全参数缺少第二位审批人，不能生效", "error", "BR-BS-18"); return;
    }
    var old = p.value;
    p.value = nv; p.prev = old; p.updatedBy = S.actor; p.updatedAt = fmtTime(); p.history = (p.history || 1) + 1;
    p.scope = scope;
    log("设置变更", p.key + " " + old + " → " + nv, "成功", "原因：" + reason + "；范围：" + scope + "；审批：安全管理员", true);
    save(); closeModal(); render();
    toast("灰度生效中", "正在推送到全部节点…", "info");
    setTimeout(function () {
      if (p.value !== nv) return;
      log("设置生效", p.key + " = " + nv, "成功", "全节点生效耗时 1.2s（真实 ≤10s，BR-BS-19）", true);
      save();
      toast("已生效", p.key + " 已更新为 " + nv + "（BR-BS-19：≤10 秒）", "success", "BR-BS-19");
    }, 1200);
  };
  ACT["param-history"] = function (el, key) {
    var p = S.params.filter(function (x) { return x.key === key; })[0];
    var items = [];
    for (var i = 0; i < Math.min(p.history || 1, 4); i++) {
      items.push([i === 0 ? p.value : "—", i === 0 ? p.updatedBy : "张伟", i === 0 ? p.updatedAt : "2026-09-" + (18 - i * 5)]);
    }
    openDrawer({
      title: "变更历史 · " + p.name, sub: p.key,
      body: '<div class="timeline">' + items.map(function (x, i) {
        return '<div class="tl-item ' + (i === 0 ? "ok" : "") + '"><div class="t">' + esc(x[0]) + "</div>" +
          '<div class="m">' + esc(x[1]) + " · " + esc(x[2]) + (i === 0 ? " · 当前生效" : "") + "</div></div>";
      }).join("") + "</div>" +
        '<div class="note" style="margin-top:12px">每次变更保留改前值、改后值、申请人、审批人、生效时间，可一键回滚（BR-BS-20）。</div>'
    });
  };
  ACT["param-rollback"] = function (el, key) {
    var p = S.params.filter(function (x) { return x.key === key; })[0];
    if (!p.prev) { toast("没有可回滚的上一个版本", "只有变更过的参数才能回滚", "warn"); return; }
    openModal({
      title: "回滚参数 · " + p.name,
      body: '<div class="note warn">将把 <span class="mono">' + p.key + "</span> 从 <b>" + esc(p.value) + "</b> 回滚到 <b>" + esc(p.prev) + "</b>。<br><br>回滚同样会留痕。</div>",
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn danger" data-act="param-rollback-do" data-id="' + key + '">确认回滚</button>'
    });
  };
  ACT["param-rollback-do"] = function (el, key) {
    var p = S.params.filter(function (x) { return x.key === key; })[0];
    var from = p.value; p.value = p.prev; p.prev = from;
    p.updatedAt = fmtTime(); p.updatedBy = S.actor;
    log("设置回滚", p.key + " " + from + " → " + p.value, "成功", "一键回滚，留痕", true);
    save(); closeModal(); render();
    toast("已回滚", p.key + " 恢复为 " + p.value, "success", "BR-BS-20");
  };

  // ---- files ----
  ACT["file-upload"] = function () {
    openModal({
      id: "file-upload", wide: true,
      title: "上传文件",
      sub: "会依次校验：格式白名单 → 大小 → 配额 → 安全扫描",
      body: '<div class="field"><label>所属应用</label><select class="select" id="f-fapp">' +
        S.fileQuotas.map(function (q) { return "<option>" + esc(q.app) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label>选择文件</label><input class="input" type="file" id="f-file" style="padding:6px 8px;height:auto">' +
        '<div class="help">允许：pdf / doc / docx / xls / xlsx / dwg / jpg / png / zip；单文件 ≤ 2GB</div></div>' +
        '<div id="upload-progress" style="display:none"><div class="progress"><i style="width:0%"></i></div>' +
        '<div class="cell-sub" style="margin-top:6px" id="upload-text">准备上传…</div></div>' +
        '<div class="note" style="margin-top:12px">演示环境不会真的上传文件，只读取文件名与大小做校验。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="file-upload-do">开始上传</button>'
    });
  };
  ACT["file-upload-do"] = function () {
    var input = $("#f-file");
    var app = val("f-fapp");
    var f = input.files && input.files[0];
    if (!f) { toast("请选择文件", "", "error"); return; }
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    var allow = ["pdf", "doc", "docx", "xls", "xlsx", "dwg", "jpg", "jpeg", "png", "zip"];
    if (allow.indexOf(ext) === -1) { toast("格式不在白名单", "." + ext + " 不允许上传（BR-BS-22）", "error", "BR-BS-22"); return; }
    var mb = f.size / 1024 / 1024;
    if (mb > 2048) { toast("超过单文件上限", "文件 " + mb.toFixed(1) + "MB，上限 2048MB", "error", "BR-BS-22"); return; }
    var q = S.fileQuotas.filter(function (x) { return x.app === app; })[0];
    var rest = q ? (q.total - q.used) : 999;
    if (mb / 1024 > rest) {
      toast("配额不足", app + " 剩余 " + rest + "GB，本文件 " + (mb / 1024).toFixed(2) + "GB，已拒绝（BR-BS-23）", "error", "BR-BS-23");
      return;
    }
    $("#upload-progress").style.display = "block";
    var bar = $("#upload-progress .progress > i"), txt = $("#upload-text");
    var pct = 0;
    var timer = setInterval(function () {
      pct += 12;
      if (pct > 100) pct = 100;
      bar.style.width = pct + "%";
      txt.textContent = pct < 60 ? "上传中 " + pct + "%" : pct < 95 ? "安全扫描中…" : "写入存储…";
      if (pct >= 100) {
        clearInterval(timer);
        var file = {
          id: uid("F", S.files), name: f.name, app: app,
          size: mb.toFixed(1) + " MB", version: 1, status: "available",
          owner: S.actor.split("（")[0], updatedAt: fmtTime(), link: false
        };
        S.files.unshift(file);
        if (q) q.used = Math.round((q.used + mb / 1024) * 10) / 10;
        log("文件上传", f.name + "（" + file.id + "）", "成功", "大小 " + file.size + "；应用 " + app + "；扫描通过", false);
        save(); closeModal(); render();
        toast("上传成功", f.name + " 已通过安全扫描并入库", "success", "BR-BS-26");
      }
    }, 140);
  };
  ACT["file-versions"] = function (el, id) {
    var f = S.files.filter(function (x) { return x.id === id; })[0];
    var rows = [];
    for (var v = f.version; v >= 1; v--) {
      rows.push('<div class="callout-row"><div class="grow"><div class="cell-main">v' + v + (v === f.version ? "（当前）" : "") +
        '</div><div class="cell-sub">' + f.owner + " · 2026-10-" + (19 - (f.version - v)) + " · " + f.size + "</div></div>" +
        (v === f.version ? tag("生效中", "green") : '<button class="btn small" data-act="file-restore" data-id="' + f.id + '" data-v="' + v + '">回溯</button>') + "</div>");
    }
    openDrawer({
      title: "版本历史 · " + f.name, sub: f.id + " · 保留最近 10 版",
      body: rows.join("") + '<div class="note" style="margin-top:12px">保留最近 10 个版本，历史版本可下载、可回溯（BR-BS-25）。</div>'
    });
  };
  ACT["file-restore"] = function (el, id, ev, v) {
    toast("已回溯到 v" + el.getAttribute("data-v"), "当前版本已切换，旧版本仍保留", "success", "BR-BS-25");
    log("文件回溯", id + " → v" + el.getAttribute("data-v"), "成功", "版本回溯", false);
    save(); closeDrawer();
  };
  ACT["file-archive"] = function (el, id) {
    var f = S.files.filter(function (x) { return x.id === id; })[0];
    f.status = "archived";
    log("文件归档", f.name, "成功", "180 天未访问转归档；可下载但较慢", false);
    save(); render();
    toast("已归档", f.name + " 转入归档存储，仍可下载", "success", "BR-BS-27");
  };
  ACT["file-link"] = function (el, id) {
    var f = S.files.filter(function (x) { return x.id === id; })[0];
    if (!f.link) {
      var code = String(Math.floor(1000 + Math.random() * 9000));
      f.link = true; f.linkCode = code; f.linkExpire = "7 天";
      log("外链生成", f.name, "成功", "有效期 7 天；提取码已生成", false);
      save();
      openModal({
        title: "外链已生成", sub: f.name,
        body: '<div class="field"><label>分享链接</label><input class="input mono" readonly value="https://files.corp.local/s/' +
          f.id.toLowerCase() + "?code=" + code + '"></div>' +
          '<div class="form-row"><div class="field"><label>提取码</label><input class="input mono" readonly value="' + code + '"></div>' +
          '<div class="field"><label>有效期</label><input class="input" readonly value="7 天"></div></div>' +
          '<div class="note">BR-BS-28：外链必须设有效期与提取码，可随时撤销。敏感文件不允许外链。</div>',
        footer: '<button class="btn danger" data-act="file-unlink" data-id="' + f.id + '">撤销外链</button><button class="btn primary" data-close="modal">完成</button>'
      });
    } else {
      openModal({
        title: "外链管理", sub: f.name,
        body: kv([["状态", tag("生效中", "green")], ["提取码", '<span class="mono">' + esc(f.linkCode || "----") + "</span>", true],
          ["有效期", esc(f.linkExpire || "7 天")]]) +
          '<div class="note warn" style="margin-top:12px">撤销后链接立即失效，已下载的文件不受影响。</div>',
        footer: '<button class="btn danger" data-act="file-unlink" data-id="' + f.id + '">撤销外链</button><button class="btn" data-close="modal">关闭</button>'
      });
    }
  };
  ACT["file-unlink"] = function (el, id) {
    var f = S.files.filter(function (x) { return x.id === id; })[0];
    f.link = false; f.linkCode = null;
    log("外链撤销", f.name, "成功", "链接立即失效", false);
    save(); closeModal(); render();
    toast("外链已撤销", f.name + " 的分享链接已失效", "warn");
  };

  // ---- messages ----
  ACT["msg-pick"] = function (el, id) {
    UI.msgTemplate = id; render();
  };
  ACT["msg-send"] = function () {
    var tpl = S.templates.filter(function (t) { return t.id === UI.msgTemplate; })[0];
    var user = val("msg-user");
    UI.msgUser = user;
    UI.msgUrgent = val("msg-urgent") === "1";
    if (tpl.status !== "approved") {
      toast("模板未审核，已拦截", "「" + tpl.name + "」还在待审核状态，不能发送（BR-BS-29）", "error", "BR-BS-29");
      addMsg(tpl, user, "—", "blocked", "模板待审核，已拦截");
      return;
    }
    if (user.indexOf("已停用") > -1) {
      toast("接收人无效，已拒绝", "停用账号不能接收消息，且不会重试（BR-BS-30）", "error", "BR-BS-30");
      return;
    }
    if (UI.dup) {
      toast("触发频控，已拦截", "同一模板同一用户 5 分钟内最多 1 条（BR-BS-32）", "error", "BR-BS-32");
      addMsg(tpl, user, tpl.channels[0], "blocked", "5 分钟内重复发送，频控拦截");
      return;
    }
    if (UI.quiet && !UI.msgUrgent) {
      toast("免打扰时段，普通消息不发送", "22:00-08:00 不发普通消息；紧急消息可突破但需留痕（BR-BS-31）", "error", "BR-BS-31");
      addMsg(tpl, user, "—", "blocked", "免打扰时段，普通消息拦截");
      return;
    }
    if (UI.quiet && UI.msgUrgent) {
      toast("紧急消息放行", "已突破免打扰，发送行为已留痕", "warn", "BR-BS-31");
    }
    var channel = tpl.channels[0];
    if (UI.smsDown && tpl.channels.indexOf("短信") > -1) {
      log("通道降级", "短信 → 企业微信", "成功", "短信通道连续失败 5 次，自动切换；恢复需管理员确认", false);
      channel = "企业微信";
      toast("短信通道失败，已自动切换", "降级到企业微信并记录事件；恢复后不会自动切回（BR-BS-34）", "warn", "BR-BS-34");
    }
    addMsg(tpl, user, channel, "success", UI.smsDown ? "通道降级后成功" : "主通道");
    toast("消息已发出", tpl.name + " → " + user + "（" + channel + "）", "success", "BR-BS-30");
  };
  function addMsg(tpl, user, channel, status, note) {
    var m = {
      id: uid("MSG", S.messages), template: tpl.name, user: user.split("（")[0],
      channel: channel, status: status, time: fmtTime(), note: note
    };
    S.messages.unshift(m);
    log("消息发送", tpl.name + " → " + m.user, status === "success" ? "成功" : "拦截",
      "通道 " + channel + "；" + note, false);
    save(); render();
  }

  // ---- apis ----
  ACT["api-detail"] = function (el, id) {
    UI.apiId = id; UI.apiTab = "overview";
    var a = S.apis.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    openDrawer({
      title: a.name, sub: a.id + " · " + a.version + " · " + a.owner,
      body: '<div class="mini-tabs">' +
        '<button data-act="api-tab" data-id="overview" class="' + (UI.apiTab === "overview" ? "on" : "") + '">概览</button>' +
        '<button data-act="api-tab" data-id="calls" class="' + (UI.apiTab === "calls" ? "on" : "") + '">调用记录</button>' +
        '<button data-act="api-tab" data-id="limit" class="' + (UI.apiTab === "limit" ? "on" : "") + '">限流</button>' +
        "</div><div id=\"api-tab-body\">" + apiTabBody(a) + "</div>"
    });
  };
  function apiTabBody(a) {
    if (UI.apiTab === "calls") {
      return table(["时间", "调用方", { label: "耗时", cls: "num" }, "结果"], S.callLogs.filter(function (c) { return c.api === a.name; }).map(function (c) {
        return row([c.id, c.app].join(" "), c.result, [
          '<span class="cell-sub">' + c.time + "</span>", esc(c.app),
          '<span class="num">' + c.cost + " ms</span>",
          c.result === "成功" ? tag("成功", "green") : tag(c.result, "red") + ' <span class="mono">' + c.code + "</span>"
        ]);
      }));
    }
    if (UI.apiTab === "limit") {
      return '<div class="field"><label>单应用 QPS 上限</label><input class="input" id="f-qps" type="number" value="' + a.qps + '">' +
        '<div class="help">平台上限 1000 QPS；超过需安全审批（BR-BS-46）。</div></div>' +
        '<div class="field"><label>失败熔断阈值</label><select class="select"><option>连续失败 20 次</option><option>连续失败 50 次</option><option>错误率 50%（1 分钟）</option></select></div>' +
        '<div class="field"><label>IP 白名单</label><input class="input" value="10.12.8.0/24, 10.12.9.0/24"></div>' +
        '<button class="btn primary" data-act="api-limit-save" data-id="' + a.id + '">保存限流配置</button>';
    }
    return statusTag(a.status) + '<div style="height:12px"></div>' +
      kv([["业务说明", a.name + "：供已授权应用调用"], ["授权范围", a.scope],
        ["负责人", a.owner], ["当前版本", a.version],
        ["今日调用", num(a.callsToday)], ["成功率", a.successRate + "%"], ["P95 耗时", a.p95 + " ms"]]) +
      '<h3 style="margin:16px 0 8px;font-size:14px">版本历史</h3>' +
      '<div class="timeline"><div class="tl-item ok"><div class="t">' + a.version + "（当前）</div><div class=\"m\">2026-09-10 发布</div></div>" +
      '<div class="tl-item"><div class="t">v1.0</div><div class="m">2026-08-02 发布 · 旧版本保留 6 个月（BR-BS-39）</div></div></div>' +
      '<h3 style="margin:16px 0 8px;font-size:14px">错误码</h3>' +
      '<div class="mono" style="font-size:12px;line-height:1.9;color:#44506a">40021 参数校验失败<br>401 缺少凭证或登录凭证过期<br>403 越权访问<br>429 触发限流</div>' +
      '<div class="note" style="margin-top:12px">未登记接口不允许被调用；下线需提前 30 天通知调用方（BR-BS-39）。</div>';
  }
  ACT["api-tab"] = function (el, id) {
    UI.apiTab = id;
    var a = S.apis.filter(function (x) { return x.id === UI.apiId; })[0];
    $$(".mini-tabs button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-id") === id); });
    var body = $("#api-tab-body");
    if (body) body.innerHTML = apiTabBody(a);
  };
  ACT["api-limit-save"] = function (el, id) {
    var a = S.apis.filter(function (x) { return x.id === id; })[0];
    var q = Number(val("f-qps"));
    if (!q || q <= 0) { toast("QPS 必须大于 0", "", "error"); return; }
    if (q > 1000) { toast("超过平台上限", "单应用最高 1000 QPS，需安全管理员审批（BR-BS-46）", "error", "BR-BS-46"); return; }
    a.qps = q;
    log("限流调整", a.name + " QPS → " + q, "成功", "应用级限流配置变更", true);
    save(); closeDrawer(); render();
    toast("已保存", a.name + " 的 QPS 上限调整为 " + q, "success", "BR-BS-46");
  };
  ACT["api-offline"] = function (el, id) {
    var a = S.apis.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "下线接口 · " + a.name,
      sub: a.id + " " + a.version,
      body: '<div class="note danger">下线后调用方会收到 <span class="mono">410</span>。<br>BR-BS-39：旧版本至少保留 6 个月，下线需<b>提前 30 天</b>通知调用方。</div>' +
        '<div class="field" style="margin-top:14px"><label>计划下线日期</label><input class="input" id="f-offdate" value="2026-11-18（30 天后）"></div>' +
        '<div class="field"><label>通知范围</label><input class="input" value="质量追溯系统、生产管理系统、数据可视化系统"></div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn danger" data-act="api-offline-do" data-id="' + id + '">确认下线</button>'
    });
  };
  ACT["api-offline-do"] = function (el, id) {
    var a = S.apis.filter(function (x) { return x.id === id; })[0];
    a.status = "offline"; a.callsToday = 0; a.successRate = 0; a.p95 = 0;
    log("接口下线", a.name + " " + a.version, "成功", "提前 30 天通知；旧版本保留 6 个月", true);
    save(); closeModal(); render();
    toast("已下线", a.name + " 进入 6 个月保留期", "warn", "BR-BS-39");
  };
  ACT["api-new"] = function () {
    openModal({
      title: "登记接口",
      sub: "未登记不允许被调用",
      body: '<div class="field"><label>接口名称<span class="req">*</span></label><input class="input" id="f-aname" placeholder="如：查询设备状态"></div>' +
        '<div class="field"><label>业务说明<span class="req">*</span></label><input class="input" id="f-adesc" placeholder="一句话说明谁在什么场景下调用"></div>' +
        '<div class="form-row"><div class="field"><label>负责人<span class="req">*</span></label><input class="input" id="f-aowner"></div>' +
        '<div class="field"><label>授权范围</label><select class="select" id="f-ascope"><option>业务系统（只读）</option><option>质量域（写）</option><option>供应链（只读）</option><option>设备域（写）</option></select></div></div>' +
        '<div class="note">创建后为草稿状态；测试通过才能发布（BR-BS-38）。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="api-new-do">创建草稿</button>'
    });
  };
  ACT["api-new-do"] = function () {
    var n = val("f-aname"), d = val("f-adesc"), o = val("f-aowner");
    if (!n) { toast("接口名称必填", "", "error", "BR-BS-38"); return; }
    if (!d) { toast("业务说明必填", "没有说明的接口没人敢用", "error", "BR-BS-38"); return; }
    if (!o) { toast("负责人必填", "", "error", "BR-BS-38"); return; }
    S.apis.unshift({ id: uid("API", S.apis), name: n, version: "v1.0", status: "draft", owner: o, scope: val("f-ascope"), qps: 100, successRate: 0, p95: 0, callsToday: 0 });
    log("接口登记", n, "成功", "草稿状态；业务说明：" + d, false);
    save(); closeModal(); render();
    toast("接口已创建", n + " 进入草稿，测试通过后可发布", "success", "BR-BS-38");
  };
  ACT["map-run"] = function (el, id) {
    var samples = [
      ["MAT-10023", "物料编码", "MAT-10023", "成功"],
      ["MAT-10024", "物料编码", "MAT-10024", "成功"],
      ["mat-10025", "物料编码（大写）", "MAT-10025", "转换"],
      ["MAT-10026", "计量单位（个→PCS）", "PCS", "转换"],
      ["", "物料名称", "—", "失败"],
      ["MAT-10028", "安全库存（文本→数值）", "120", "转换"]
    ];
    openModal({
      id: "map-run", wide: true,
      title: "映射试跑 · 抽样 100 条",
      sub: "只读试跑，不影响生产数据",
      body: table(["源值", "字段 / 规则", "目标值", "结果"], samples.map(function (s) {
        return row([s[0], s[1], s[3]].join(" "), s[3], [
          '<span class="mono">' + (s[0] || '（空）') + "</span>", esc(s[1]),
          '<span class="mono">' + esc(s[2]) + "</span>",
          s[3] === "成功" ? tag("通过", "green") : s[3] === "转换" ? tag("已转换", "blue") : tag("失败", "red")
        ]);
      })) +
        '<div class="note danger" style="margin-top:12px">1 条失败：物料名称为空。错误数据进入错误清单，<b>不会静默丢弃</b>（BR-BS-43）。<br>' +
        "试跑结果确认无误后，才能启用这条映射（BR-BS-44）。</div>",
      footer: '<button class="btn" data-close="modal">关闭</button><button class="btn primary" data-act="map-enable" data-id="' + id + '">确认并启用</button>'
    });
  };
  ACT["map-enable"] = function (el, id) {
    var m = S.mappings.filter(function (x) { return x.id === id; })[0];
    m.status = "enabled";
    log("映射启用", m.name, "成功", "抽样 100 条试跑通过；1 条失败进错误清单", false);
    save(); closeModal(); render();
    toast("映射已启用", m.name + " 开始生效", "success", "BR-BS-44");
  };

  // ---- audit ----
  ACT["audit-detail"] = function (el, id) {
    var a = S.audit.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    openDrawer({
      title: "日志详情 · " + a.id,
      sub: a.time + " · " + a.actor,
      body: statusTag(a.result === "成功" ? "success" : a.result === "失败" ? "failed" : "blocked") + "<div style=\"height:14px\"></div>" +
        kv([["操作人", a.actor], ["来源系统", a.system], ["操作类型", a.action],
          ["操作对象", a.object], ["结果", a.result], ["IP", a.ip],
          ["详情", a.detail || "—"]]) +
        (a.sensitive ? '<div class="note danger" style="margin-top:14px">该记录含敏感信息，列表中已脱敏。<br>' +
          "手机号：<span class=\"mono\">138****5678</span>　身份证：<span class=\"mono\">110***********1234</span></div>" +
          '<button class="btn" style="margin-top:10px" data-act="audit-origin" data-id="' + a.id + '">申请查看原值</button>' : "") +
        '<h3 style="margin:18px 0 8px;font-size:14px">留痕说明</h3>' +
        '<div class="note">日志只追加不修改；删除需安全管理员与审计员双签（BR-BS-17）。</div>'
    });
  };
  ACT["audit-origin"] = function (el, id) {
    openModal({
      title: "申请查看原值",
      sub: "敏感字段原值默认不可见",
      body: '<div class="field"><label>申请理由<span class="req">*</span></label><textarea class="input" rows="3" id="f-origin-reason" placeholder="如：配合内部审计，需核对导出记录中的手机号"></textarea></div>' +
        '<div class="note warn">申请将提交安全管理员审批；审批通过后 24 小时内可见，且本次查看会被记录（BR-BS-15）。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="audit-origin-do" data-id="' + id + '">提交申请</button>'
    });
  };
  ACT["audit-origin-do"] = function (el, id) {
    var r = val("f-origin-reason");
    if (!r) { toast("申请理由必填", "", "error"); return; }
    log("敏感数据申请", id, "待审批", "理由：" + r, true);
    save(); closeModal(); closeDrawer();
    toast("申请已提交", "等待安全管理员审批，结果会通知你", "success", "BR-BS-15");
  };
  ACT["audit-export"] = function () {
    openModal({
      title: "导出操作记录",
      sub: "导出本身也会被记录",
      body: '<div class="field"><label>时间范围</label><select class="select"><option>最近 7 天</option><option>最近 30 天</option><option>自定义</option></select></div>' +
        '<div class="field"><label>包含内容</label><div style="display:grid;gap:6px">' +
        '<label class="check"><input type="checkbox" checked> 操作记录（全部）</label>' +
        '<label class="check"><input type="checkbox" checked> 敏感操作明细（脱敏）</label>' +
        '<label class="check"><input type="checkbox"> 原值（需单独审批）</label></div></div>' +
        '<div class="note warn">报告会加带水印：导出人 / 导出时间 / 报告编号；外发需二次审批。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="audit-export-do">申请导出</button>'
    });
  };
  ACT["audit-export-do"] = function () {
    log("导出操作记录", "审计报告（最近 7 天）", "待审批", "含脱敏明细；水印：张伟/2026-10-19", true);
    save(); closeModal(); render();
    toast("导出申请已提交", "审批通过后可下载，文件带水印", "success");
  };

  // ---- rules ----
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute("data-rule")) {
      var id = t.getAttribute("data-rule");
      var r = S.rules.filter(function (x) { return x.id === id; })[0];
      if (r) {
        r.confirmed = t.checked;
        save();
        toast(r.confirmed ? "已确认" : "已取消确认", id + " " + (r.confirmed ? "进入已确认清单" : "回到待确认"), r.confirmed ? "success" : "info");
      }
    }
    if (t && t.getAttribute && t.getAttribute("data-q")) {
      var qid = t.getAttribute("data-q");
      var q = S.questions.filter(function (x) { return x.id === qid; })[0];
      if (q) {
        q.decision = t.value; save();
        toast("结论已保存", qid + " → " + (t.options[t.selectedIndex] || {}).text, "success");
      }
    }
    if (t && t.getAttribute && t.getAttribute("data-toggle")) {
      var k = t.getAttribute("data-toggle");
      UI[k] = t.checked;
    }
  });
  ACT["q-export"] = function () {
    var lines = ["# 基础支撑管理 · 待确认问题清单", "", "导出时间：" + fmtTime(), "",
      "| 编号 | 问题 | 影响 | 建议默认值 | 决策人 | 结论 |", "| --- | --- | --- | --- | --- | --- |"];
    S.questions.forEach(function (q) {
      var d = { pending: "待讨论", accept: "采纳建议", change: "需要修改", reject: "不适用" }[q.decision] || "待讨论";
      lines.push("| " + q.id + " | " + q.text + " | " + q.impact + " | " + q.suggest + " | " + q.owner + " | " + d + " |");
    });
    var blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "基础支撑管理-待确认问题清单.md";
    a.click();
    toast("已导出", "Markdown 文件已开始下载", "success");
  };

  // =========================================================
  // ROUTER
  // =========================================================
  var ROUTES = {
    overview: { title: "平台能力", render: pageOverview },
    apps: { title: "接入的应用", render: pageApps },
    identity: { title: "账号来源", render: pageIdentity },
    sessions: { title: "登录状态", render: pageSessions },
    params: { title: "系统设置", render: pageParams },
    files: { title: "文件存储", render: pageFiles },
    messages: { title: "消息通知", render: pageMessages },
    apis: { title: "系统对接", render: pageApis },
    audit: { title: "操作记录", render: pageAudit },
    rules: { title: "业务规则清单", render: pageRules },
    questions: { title: "待确认问题", render: pageQuestions },
    viz: { title: "数据可视化", render: pageViz }
  };

  function currentRoute() {
    var h = location.hash.replace(/^#\/?/, "");
    return ROUTES[h] ? h : "overview";
  }

  function render() {
    var key = currentRoute();
    renderNav(key);
    $("#crumb").innerHTML = '<span>基础支撑管理</span><span class="sep">/</span><b>' + ROUTES[key].title + "</b>";
    $("#content").innerHTML = ROUTES[key].render();
    bindFilters();
    applyFilters();
    window.scrollTo(0, 0);
    if (EMBED) {
      try { parent.postMessage({ type: "proto-route", module: "bs", route: key, title: ROUTES[key].title }, "*"); } catch (e) { }
    }
  }

  document.addEventListener("click", function (e) {
    // 点击遮罩关闭（只认遮罩本身，避免点到弹窗内按钮时误关）
    var isOverlay = e.target.classList && e.target.classList.contains("overlay") && e.target.getAttribute("data-close") === "modal";
    if (isOverlay) { closeModal(); return; }
    var isScrim = e.target.classList && e.target.classList.contains("scrim") && e.target.getAttribute("data-close") === "drawer";
    if (isScrim) { closeDrawer(); return; }
    var el = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!el) return;
    var act = el.getAttribute("data-act");
    var id = el.getAttribute("data-id");
    if (ACT[act]) {
      e.preventDefault();
      ACT[act](el, id, e);
    }
  });

  window.addEventListener("hashchange", function () { closeModal(); closeDrawer(); render(); });

  // val helper
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  function fail(id, msg, ruleId) {
    var el = document.getElementById(id);
    if (el) { el.classList.add("invalid"); el.focus(); }
    toast("提交失败", msg, "error", ruleId);
  }

  // boot
  var EMBED = /[?&]embed=1/.test(location.search);
  if (EMBED) document.body.classList.add("embed");
  if (!EMBED) {
    var hint = document.createElement("a");
    hint.className = "unified-hint";
    hint.href = "../prototype-all/index.html";
    hint.innerHTML = "<b>统一入口</b><span>一个侧边栏装两个模块 →</span>";
    document.body.appendChild(hint);
  }
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d.type === "proto-go" && d.route && ROUTES[d.route]) {
      if (location.hash !== "#/" + d.route) location.hash = "#/" + d.route;
    }
  });
  render();
})();
