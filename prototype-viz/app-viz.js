/* 数据可视化系统 · 业务原型（演示用，无后端） */
(function () {
  "use strict";

  var STORE = "viz-proto-v1";
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) { var d = JSON.parse(raw); if (d && d.kpis) return d; }
    } catch (e) { }
    var d = clone(window.VZ);
    d.audit = [];
    return d;
  }
  var V = load();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(V)); } catch (e) { } }

  var UI = {
    delay: false,
    offline: false,
    link: "",
    unit: "万元",
    mask: false,
    drill: { kpi: null, path: [] },
    report: { rows: [], cols: [], values: ["amount"], chart: "表格", name: "" },
    screen: { id: "SC-01", sel: "", res: "1920 × 1080" },
    lineage: { dir: "forward", node: "" },
    msg: ""
  };

  // ---------- utils ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtTime(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function fmtDate(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function tag(t, ty) { return '<span class="tag ' + (ty || "gray") + '"><i class="dot"></i>' + esc(t) + "</span>"; }
  function rule(id) { return '<span class="rule-chip" title="规则编号，可在“业务规则清单”查看">' + id + "</span>"; }
  function kv(list) { return '<dl class="kv">' + list.map(function (x) { return "<dt>" + esc(x[0]) + "</dt><dd>" + (x[2] ? x[1] : esc(x[1])) + "</dd>"; }).join("") + "</dl>"; }
  function uid(p, list) {
    var max = 0;
    list.forEach(function (x) { var m = String(x.id).match(/(\d+)$/); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    return p + "-" + (max + 1);
  }
  function statusTag(s) {
    var map = {
      "已发布": "green", "已停用": "gray", "草稿": "gray", "待审核": "blue", "已关闭": "gray",
      "待认领": "amber", "处理中": "blue", "误报": "gray", "已批准": "green", "已拒绝": "red", "待审批": "amber",
      "启用": "green", "停用": "gray", "运行中": "green", "待机": "amber", "故障": "red", "离线": "gray"
    };
    return tag(s, map[s] || "gray");
  }
  function sensTag(s) { var m = { "公开": "gray", "内部": "blue", "敏感": "amber", "安全": "red" }; return tag(s, m[s] || "gray"); }
  function pageHead(t, d, a) {
    return '<div class="page-head"><div><h1>' + esc(t) + "</h1><p>" + d + "</p></div>" +
      (a ? '<div class="page-head__actions">' + a + "</div>" : "") + "</div>";
  }
  function card(t, sub, body, foot, extra) {
    return '<section class="card">' + (t ? '<div class="card__head"><h3>' + esc(t) + "</h3>" + (sub ? '<span class="sub">' + sub + "</span>" : "") + (extra || "") + "</div>" : "") +
      '<div class="card__body">' + body + "</div>" + (foot ? '<div class="card__foot">' + foot + "</div>" : "") + "</section>";
  }
  function ruleChips(ids) {
    return '<div class="rules-inline">' + ids.map(rule).join("") +
      '<span style="font-size:11.5px;color:#7a869c">本页涉及的业务规则，可在“业务规则清单”逐条确认</span></div>';
  }
  function table(headers, rows, id) {
    return '<div class="table-wrap"><table class="data" id="' + (id || "") + '"><thead><tr>' +
      headers.map(function (h) { var o = typeof h === "string" ? { label: h } : h; return '<th class="' + (o.cls || "") + '">' + o.label + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows.map(function (r) {
        return "<tr" + (r.attrs || "") + ">" + r.cells.map(function (c, i) {
          var o = typeof c === "string" ? { html: c } : c;
          return '<td class="' + (o.cls || (headers[i] && headers[i].cls) || "") + '">' + o.html + "</td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function row(text, status, cells) {
    return { attrs: ' data-text="' + esc(String(text).toLowerCase()) + '" data-status="' + (status || "") + '"', cells: cells };
  }

  // ---------- toast / modal / drawer ----------
  function toast(title, msg, type, rid) {
    var box = $("#toasts"), el = document.createElement("div");
    el.className = "toast " + (type || "success");
    var icon = { success: "✓", error: "✕", warn: "!", info: "i" }[type || "success"];
    el.innerHTML = '<div class="toast__title"><span>' + icon + "</span>" + esc(title) + "</div>" +
      (msg ? '<div class="toast__msg">' + esc(msg) + "</div>" : "") +
      (rid ? '<div class="toast__rule">触发规则 ' + esc(rid) + "</div>" : "");
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () {
      el.style.transition = "opacity .25s, transform .25s";
      el.style.opacity = "0"; el.style.transform = "translateX(12px)";
      setTimeout(function () { el.remove(); }, 260);
    }, 3600);
  }
  function openModal(o) {
    var root = $("#modal-root");
    root.innerHTML = '<div class="overlay" data-close="modal"><div class="modal ' + (o.wide ? "modal--lg" : "") + '" role="dialog">' +
      '<div class="modal__head"><div><h3>' + esc(o.title) + "</h3>" + (o.sub ? "<p>" + o.sub + "</p>" : "") + "</div>" +
      '<button class="modal__close" data-close="modal" aria-label="关闭">×</button></div>' +
      '<div class="modal__body">' + o.body + '</div><div class="modal__foot">' + o.footer + "</div></div></div>";
    $$("[data-close=modal]", root).forEach(function (b) {
      b.addEventListener("click", function (e) { if (e.target === b || b.classList.contains("modal__close")) closeModal(); });
    });
  }
  function closeModal() { $("#modal-root").innerHTML = ""; }
  function openDrawer(o) {
    var root = $("#drawer-root");
    root.innerHTML = '<div class="drawer-wrap"><div class="scrim" data-close="drawer"></div><aside class="drawer">' +
      '<div class="drawer__head"><div><h3>' + esc(o.title) + "</h3>" + (o.sub ? "<p>" + o.sub + "</p>" : "") + "</div>" +
      '<button class="drawer__close" data-close="drawer">×</button></div><div class="drawer__body">' + o.body + "</div></aside></div>";
    $$("[data-close=drawer]", root).forEach(function (b) { b.addEventListener("click", closeDrawer); });
  }
  function closeDrawer() { $("#drawer-root").innerHTML = ""; }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeDrawer(); }
  });
  function log(action, object, result, detail, sensitive) {
    V.audit.unshift({ id: "A-" + (V.audit.length + 1), time: fmtTime(), actor: V.actor, action: action, object: object, result: result || "成功", detail: detail || "", sensitive: !!sensitive });
    save();
  }

  // ---------- charts ----------
  function svgWrap(inner, h) {
    return '<div class="chart-box"><svg viewBox="0 0 600 ' + h + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg></div>";
  }
  function niceTicks(min, max, n) {
    var span = (max - min) || 1, raw = span / (n || 4);
    var p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / p;
    var step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    if (hi === lo) hi = lo + step;
    var vals = [];
    for (var v = lo; v <= hi + step / 2; v += step) vals.push(+v.toFixed(6));
    return { min: lo, max: hi, step: step, values: vals };
  }

  function lineChart(labels, values, o) {
    o = o || {};
    var h = o.h || 180, w = 600, pad = { l: 40, r: 12, t: 14, b: 26 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var rawMin = o.min != null ? o.min : Math.min.apply(null, values);
    var rawMax = o.max != null ? o.max : Math.max.apply(null, values);
    if (rawMin === rawMax) { rawMin -= 1; rawMax += 1; }
    if (!o.tight) { var pv = (rawMax - rawMin) * 0.08; rawMin -= pv; rawMax += pv; }
    var tk = niceTicks(rawMin, rawMax, o.ticks || 4);
    var min = tk.min, max = tk.max, span = max - min;
    function X(i) { return pad.l + (values.length <= 1 ? 0 : i / (values.length - 1) * iw); }
    function Y(v) { return pad.t + (1 - (v - min) / span) * ih; }
    var out = "";
    tk.values.forEach(function (gv) {
      var gy = Y(gv);
      out += '<line x1="' + pad.l + '" y1="' + gy + '" x2="' + (w - pad.r) + '" y2="' + gy + '" stroke="#eef1f7" stroke-width="1"/>';
      out += '<text x="' + (pad.l - 6) + '" y="' + (gy + 3) + '" font-size="9" fill="#9aa5ba" text-anchor="end">' +
        (o.dec != null ? gv.toFixed(o.dec) : num(gv)) + "</text>";
    });
    if (o.limits) {
      o.limits.forEach(function (L) {
        if (L.v < min || L.v > max) return;
        out += '<line x1="' + pad.l + '" y1="' + Y(L.v) + '" x2="' + (w - pad.r) + '" y2="' + Y(L.v) + '" stroke="' + (L.color || "#c8302e") + '" stroke-dasharray="5 4" stroke-width="1.2"/>';
        if (L.label) out += '<text x="' + (pad.l + 6) + '" y="' + (Y(L.v) - 4) + '" font-size="9" fill="' + (L.color || "#c8302e") + '">' + L.label + "</text>";
      });
    }
    var pts = values.map(function (v, i) { return X(i) + "," + Y(v); }).join(" ");
    if (o.area) {
      out += '<polygon points="' + pad.l + "," + (pad.t + ih) + " " + pts + " " + (w - pad.r) + "," + (pad.t + ih) + '" fill="rgba(47,91,215,.08)"/>';
    }
    out += '<polyline points="' + pts + '" fill="none" stroke="' + (o.color || "#2f5bd7") + '" stroke-width="2" stroke-linejoin="round"/>';
    values.forEach(function (v, i) {
      var bad = o.anomalies && o.anomalies.indexOf(i) > -1;
      out += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="' + (bad ? 4 : 2.2) + '" fill="' + (bad ? "#c8302e" : (o.color || "#2f5bd7")) + '" ' +
        (bad ? 'data-act="spc-point" data-i="' + i + '" style="cursor:pointer"' : "") + "/>";
      if (bad) {
        out += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="8" fill="none" stroke="#c8302e" stroke-opacity=".3" pointer-events="none"/>';
      }
    });
    out += '<text x="' + pad.l + '" y="' + (h - 8) + '" font-size="9" fill="#9aa5ba">' + esc(labels[0] || "") + "</text>";
    out += '<text x="' + (w - pad.r) + '" y="' + (h - 8) + '" font-size="9" fill="#9aa5ba" text-anchor="end">' + esc(labels[labels.length - 1] || "") + "</text>";
    return svgWrap(out, h);
  }

  function barChart(items, o) {
    o = o || {};
    var h = o.h || 190, w = 600, pad = { l: 44, r: 12, t: 16, b: 28 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var rawMax = Math.max.apply(null, items.map(function (x) { return x.value; })) * 1.12;
    var tk = niceTicks(0, rawMax, 4), max = tk.max;
    var bw = iw / items.length * 0.56;
    var out = "";
    tk.values.forEach(function (gv) {
      var gy = pad.t + (1 - gv / max) * ih;
      out += '<line x1="' + pad.l + '" y1="' + gy + '" x2="' + (w - pad.r) + '" y2="' + gy + '" stroke="#eef1f7"/>';
      out += '<text x="' + (pad.l - 6) + '" y="' + (gy + 3) + '" font-size="9" fill="#9aa5ba" text-anchor="end">' + (o.fmt || num)(gv) + "</text>";
    });
    items.forEach(function (it, i) {
      var cx = pad.l + iw / items.length * (i + 0.5);
      var bh = it.value / max * ih;
      var color = it.color || (o.color || "#2f5bd7");
      out += '<rect x="' + (cx - bw / 2) + '" y="' + (pad.t + ih - bh) + '" width="' + bw + '" height="' + bh + '" rx="3" fill="' + color + '" data-act="bar" data-name="' + esc(it.name) + '" style="cursor:pointer"/>';
      out += '<text x="' + cx + '" y="' + (pad.t + ih - bh - 4) + '" font-size="9" fill="#44506a" text-anchor="middle">' + (o.fmt || num)(it.value) + "</text>";
      out += '<text x="' + cx + '" y="' + (h - 10) + '" font-size="9.5" fill="#7a869c" text-anchor="middle">' + esc(it.name) + "</text>";
    });
    return svgWrap(out, h);
  }

  function paretoChart(items) {
    var h = 210, w = 600, pad = { l: 40, r: 34, t: 16, b: 30 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var max = Math.max.apply(null, items.map(function (x) { return x.n; })) * 1.1;
    var total = items.reduce(function (a, b) { return a + b.n; }, 0), cum = 0;
    var bw = iw / items.length * 0.5, out = "";
    items.forEach(function (it, i) {
      var cx = pad.l + iw / items.length * (i + 0.5);
      var bh = it.n / max * ih;
      out += '<rect x="' + (cx - bw / 2) + '" y="' + (pad.t + ih - bh) + '" width="' + bw + '" height="' + bh + '" rx="2" fill="#2f5bd7" opacity="' + (1 - i * 0.08) + '"/>';
      out += '<text x="' + cx + '" y="' + (pad.t + ih - bh - 4) + '" font-size="9" fill="#44506a" text-anchor="middle">' + it.n + "</text>";
      out += '<text x="' + cx + '" y="' + (h - 10) + '" font-size="9" fill="#7a869c" text-anchor="middle">' + esc(it.name) + "</text>";
    });
    var pts = items.map(function (it, i) {
      cum += it.n;
      var pct = cum / total * 100;
      var cx = pad.l + iw / items.length * (i + 0.5);
      return { x: cx, y: pad.t + (1 - pct / 100) * ih, pct: pct };
    });
    out += '<polyline points="' + pts.map(function (p) { return p.x + "," + p.y; }).join(" ") + '" fill="none" stroke="#b87503" stroke-width="1.8"/>';
    pts.forEach(function (p) { out += '<circle cx="' + p.x + '" cy="' + p.y + '" r="2.5" fill="#b87503"/>'; });
    out += '<line x1="' + pad.l + '" y1="' + (pad.t + ih * 0.2) + '" x2="' + (w - pad.r) + '" y2="' + (pad.t + ih * 0.2) + '" stroke="#b87503" stroke-dasharray="4 4" opacity=".5"/>';
    out += '<text x="' + (w - pad.r + 4) + '" y="' + (pad.t + ih * 0.2 + 3) + '" font-size="9" fill="#b87503">80%</text>';
    out += '<text x="' + (w - pad.r + 4) + '" y="' + (pad.t + 10) + '" font-size="9" fill="#7a869c">累计</text>';
    return svgWrap(out, h);
  }

  function spark(values, color) {
    var w = 120, h = 30, min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = max - min || 1;
    var pts = values.map(function (v, i) { return (i / (values.length - 1) * w) + "," + (h - 3 - (v - min) / span * (h - 8)); }).join(" ");
    return '<svg viewBox="0 0 ' + w + " " + h + '" style="display:block;width:100%;height:30px;margin-top:6px"><polyline points="' + pts + '" fill="none" stroke="' + (color || "#8aa4e8") + '" stroke-width="1.6"/></svg>';
  }

  // ---------- nav ----------
  var NAV = [
    { group: "数据应用", items: [
      { key: "dashboard", label: "经营总览", icon: "▤" },
      { key: "quality", label: "质量分析", icon: "◎" },
      { key: "production", label: "生产实时状态", icon: "▦" },
      { key: "sales", label: "销售分析", icon: "◔" }
    ] },
    { group: "自己做分析", items: [
      { key: "report", label: "报表制作", icon: "✎" },
      { key: "datasets", label: "数据表与质量", icon: "▣" },
      { key: "metrics", label: "指标定义", icon: "≡" }
    ] },
    { group: "展示与运营", items: [
      { key: "screen", label: "展示屏设计", icon: "▥" },
      { key: "alerts", label: "预警提醒", icon: "!" },
      { key: "exports", label: "导出审批", icon: "↧" }
    ] },
    { group: "数据资源", items: [
      { key: "lineage", label: "数据来源关系", icon: "⌘" }
    ] },
    { group: "评审工具", items: [
      { key: "rules", label: "业务规则清单", icon: "☑" },
      { key: "questions", label: "待确认问题", icon: "？" }
    ] }
  ];
  function renderNav(active) {
    var h = "";
    NAV.forEach(function (g) {
      h += '<div class="nav__group"><div class="nav__label">' + g.group + "</div>";
      g.items.forEach(function (it) {
        h += '<a class="nav__item ' + (active === it.key ? "active" : "") + '" href="#/' + it.key + '">' +
          '<span class="nav__icon">' + it.icon + "</span><span>" + it.label + "</span>" +
          (it.key === "alerts" ? '<span class="nav__badge">' + V.events.filter(function (e) { return e.status === "待认领"; }).length + "</span>" : "") + "</a>";
      });
      h += "</div>";
    });
    h += '<div class="nav__group" style="margin-top:18px;border-top:1px solid #eef1f7;padding-top:12px">' +
      '<a class="nav__item" href="../prototype/index.html"><span class="nav__icon">↩</span><span>基础支撑管理</span></a></div>';
    $("#nav").innerHTML = h;
  }

  // =========================================================
  // 1. 经营经营总览
  // =========================================================
  function pageDashboard() {
    var kpis = V.kpis.map(function (k) {
      var pct = Math.round(k.value / k.target * 100);
      var good = k.better === "up" ? k.value >= k.target : k.value <= k.target;
      var deltaCls = (k.delta > 0) === (k.better === "up") ? "up" : "down";
      return '<div class="kpi' + (UI.delay ? " delayed" : "") + '" data-act="kpi" data-id="' + k.id + '">' +
        '<div class="kpi__top"><span class="kpi__domain">' + esc(k.domain) + '</span><span class="kpi__name">' + esc(k.name) + "</span>" +
        (UI.delay ? '<span class="kpi__warn">延迟 2h</span>' : (k.warn ? '<span class="kpi__warn">未达标</span>' : "")) + "</div>" +
        '<div class="kpi__value">' + fmtVal(k.value, k.unit) + "<small>" + esc(k.unit) + "</small></div>" +
        '<div class="kpi__meta"><span>目标 ' + fmtVal(k.target, k.unit) + '</span><b class="' + deltaCls + '">' + (k.delta > 0 ? "+" : "") + k.delta + "%</b>" +
        (UI.delay ? '<span>同比 —</span>' : "<span>同比 " + (k.delta > 0 ? "+" : "") + (k.delta * 1.6).toFixed(1) + "%</span>") + "</div>" +
        '<div class="kpi__bar"><div class="cap"><span>目标达成</span><span>' + (UI.delay ? "—" : pct + "%") + "</span></div>" +
        '<div class="progress ' + (good ? "" : "warn") + '"><i style="width:' + (UI.delay ? 0 : Math.min(pct, 100)) + '%"></i></div></div>' +
        spark(k.spark, good ? "#8aa4e8" : "#e0a44a") + "</div>";
    }).join("");

    var trendVals = V.trend.values.map(function (v, i) {
      if (!UI.link) return v;
      var factor = UI.link === "SMT-1" ? 1.02 : UI.link === "SMT-2" ? 0.93 : UI.link === "组装线" ? 0.97 : 1.06;
      return Math.round(v * factor - (i % 3) * 6);
    });
    var trend = '<div class="chart-title-row"><span class="t">营收趋势</span><span class="hint">近 12 个月 · 单位：万元</span>' +
      (UI.link ? '<span class="link-chip">已筛选：' + esc(UI.link) + ' <button data-act="unlink" title="取消筛选">×</button></span>' : "") + "</div>" +
      lineChart(V.trend.labels, trendVals, { area: true, h: 165 }) +
      '<div class="chart-legend"><span><i style="background:#2f5bd7"></i>营收</span><span>数据来源：ERP · 截止 ' + esc(V.cutoff) + "</span></div>";

    var pl = barChart(V.productLines, { h: 165 });
    var alerts = V.events.slice(0, 3).map(function (e) {
      return '<div class="callout-row"><div class="grow"><div class="cell-main">' + esc(e.metric) + " · " + esc(e.object) + "</div>" +
        '<div class="cell-sub">' + esc(e.time) + " · " + esc(e.owner) + "</div></div>" + statusTag(e.status) + "</div>";
    }).join("");

    return pageHead("经营总览",
      "一屏看全局：六类核心指标、趋势和产品线贡献。点数字可以逐层查看，点柱子可以让其他图表一起筛选。",
      '<span class="cutoff' + (UI.delay ? " delayed" : "") + '"><i class="dot"></i>数据截止 ' + (UI.delay ? "06:00（延迟 2 小时）" : V.cutoff) + "</span>" +
      '<label class="switch" style="margin-left:8px"><input type="checkbox" id="delay-toggle" ' + (UI.delay ? "checked" : "") + '><span class="track"></span>模拟数据延迟</label>') +
      ruleChips(["BR-VZ-38", "BR-VZ-25", "BR-VZ-30"]) +
      '<div class="kpi-grid">' + kpis + "</div>" +
      '<div class="grid grid--sidebar" style="margin-top:14px">' +
      card("", "", trend) +
      card("产品线贡献", "点柱子可筛选趋势图", pl + '<div class="chart-legend"><span><i style="background:#2f5bd7"></i>产量（件）</span><span>设备效率见明细</span></div>') +
      "</div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("最近预警", "未认领会升级", alerts || '<div class="empty">暂无预警</div>', '<a class="btn small" href="#/alerts">去预警中心</a>') +
      card("怎么看这一屏", "经营总览的三条硬规则", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>每个指标必须有<b>目标值</b>，否则不许上屏（BR-VZ-37）</li><li>必须显示<b>数据截止时间与来源</b>；延迟要有标识（BR-VZ-38）</li>" +
        "<li>经营总览<b>只读</b>，改配置去“指标与标准”或“报表制作”（BR-VZ-39）</li></ul>") +
      "</div>";
  }
  function fmtVal(v, unit) {
    if (unit === "%" ) return v.toFixed(1);
    if (v >= 10000) return num(v);
    return String(v);
  }
  function openKpi(id) {
    var k = V.kpis.filter(function (x) { return x.id === id; })[0];
    if (!k) return;
    UI.drill = { kpi: id, path: [] };
    renderDrill();
  }
  function renderDrill() {
    var k = V.kpis.filter(function (x) { return x.id === UI.drill.kpi; })[0];
    if (!k) return;
    var body = kv([["所属领域", k.domain], ["当前值", fmtVal(k.value, k.unit) + " " + k.unit], ["目标值", fmtVal(k.target, k.unit) + " " + k.unit],
      ["计算统计定义", k.formula], ["数据来源", k.source], ["责任人", k.owner], ["更新时间", k.updated]]) +
      '<h3 style="margin:18px 0 8px;font-size:14px">逐层查看路径</h3>' +
      '<div class="note">BR-VZ-25：最多 5 层，到明细层改为列表；BR-VZ-26：逐层查看继承当前筛选条件。</div>';

    for (var lv = 0; lv <= UI.drill.path.length && lv < k.drill.length; lv++) {
      var level = k.drill[lv];
      var chosen = UI.drill.path[lv];
      body += '<div style="margin-top:14px"><div class="zone-label">第 ' + (lv + 1) + ' 层 · ' + esc(level.dim) + "</div>";
      body += '<div class="pill-list">' + level.items.map(function (it) {
        var on = chosen === it.name;
        return '<button class="btn small ' + (on ? "primary" : "") + '" data-act="drill-pick" data-level="' + lv + '" data-name="' + esc(it.name) + '">' +
          esc(it.name) + " " + (typeof it.value === "number" ? (it.value > 100 ? num(it.value) : it.value + "%") : "") + "</button>";
      }).join("") + "</div>";
      if (chosen && level.items.filter(function (x) { return x.name === chosen; })[0]) {
        var pick = level.items.filter(function (x) { return x.name === chosen; })[0];
        body += '<div class="note" style="margin-top:8px">已选 <b>' + esc(pick.name) + "</b>" + (pick.extra ? " · " + esc(pick.extra) : "") + "，继续逐层查看查看下一层。</div>";
      }
      body += "</div>";
    }
    if (UI.drill.path.length >= k.drill.length - 0) {
      var last = k.drill[k.drill.length - 1];
      var lastPick = UI.drill.path[k.drill.length - 1];
      var it = last.items.filter(function (x) { return x.name === lastPick; })[0];
      if (it) {
        body += '<h3 style="margin:18px 0 8px;font-size:14px">明细</h3>' +
          table(["对象", "值", "备注"], [row(it.name, "", [
            '<span class="mono">' + esc(it.name) + "</span>",
            (it.value > 100 ? num(it.value) : it.value + "%"),
            esc(it.extra || "—")
          ])]) +
          '<div class="note" style="margin-top:10px">BR-VZ-27：明细超过 500 条分页展示，导出受权限约束。</div>' +
          '<a class="btn small" href="#/quality">去质量分析看波动图</a>';
      }
    }
    body += '<div class="rules-inline" style="margin-top:16px">' + ["BR-VZ-25", "BR-VZ-26", "BR-VZ-27"].map(rule).join("") + "</div>";
    openDrawer({ title: k.name, sub: k.id + " · " + k.domain, body: body });
  }

  // =========================================================
  // 2. 质量分析
  // =========================================================
  function pageQuality() {
    var q = V.quality;
    var spcChart = lineChart(q.spc.map(function (_, i) { return "P" + (i + 1); }), q.spc, {
      h: 170, min: 90, max: 100, dec: 1, tight: true,
      limits: [{ v: q.limits.ucl, label: "UCL " + q.limits.ucl }, { v: q.limits.cl, label: "", color: "#7a869c" }, { v: q.limits.lcl, label: "LCL " + q.limits.lcl }],
      anomalies: q.anomalies, area: false
    });
    var fpy = lineChart(q.fpy.labels, q.fpy.values, { h: 150, min: 90, max: 97, dec: 1, tight: true, color: "#15915b" });
    var latest = V.events.filter(function (e) { return e.rule === "AR-01"; })[0];

    return pageHead("质量分析", "看质量波动、缺陷排名和直通率趋势；图上的异常点可以直接点开，查看对应的检验记录。", "") +
      ruleChips(["BR-VZ-43", "BR-VZ-44", "BR-VZ-45"]) +
      '<div class="grid grid--4" style="margin-bottom:14px">' +
      '<div class="card stat"><div class="stat__label">一次合格率</div><div class="stat__value">93.2%</div><div class="stat__delta down">低于目标 95%</div></div>' +
      '<div class="card stat"><div class="stat__label">质量异常点</div><div class="stat__value">4</div><div class="stat__delta down">需逐点确认原因</div></div>' +
      '<div class="card stat"><div class="stat__label">TOP 缺陷</div><div class="stat__value">焊点虚焊</div><div class="stat__delta">182 件 · 占比 37.2%</div></div>' +
      '<div class="card stat"><div class="stat__label">直通率（近 12 周）</div><div class="stat__value">93.2%</div><div class="stat__delta down">连续 3 周下降</div></div>' +
      "</div>" +
      card("质量波动图 · 一次合格率", "红点是异常点，点击查看规则与原始记录", spcChart +
        '<div class="chart-legend"><span><i style="background:#2f5bd7"></i>合格率</span><span><i style="background:#c8302e"></i>异常点</span><span><i style="background:#c8302e"></i>控制限 UCL/LCL</span></div>') +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("缺陷缺陷排名", "累计占比 + 80/20 参考线（BR-VZ-45）", paretoChart(V.quality.pareto) +
        '<div class="chart-legend"><span><i style="background:#2f5bd7"></i>缺陷数</span><span><i style="background:#b87503"></i>累计占比</span></div>') +
      card("直通率趋势", "近 12 周", fpy + '<div class="note warn" style="margin-top:10px">连续 3 周下降，已触发 AR-01 预警：' + (latest ? esc(latest.object) + " " + esc(latest.value) : "—") + "</div>") +
      "</div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("异常规则说明", "至少支持 4 类", '<div class="steps">' +
        [["超出 3σ 控制限", "第 12 点：99.2% > UCL 98.6%"], ["连续 2/3 点超 2σ（同侧）", "第 23、24 点"],
        ["连续 6 点递增或递减", "第 28～33 点区间"], ["连续 7 点位于中心线单侧", "第 31 点起"]].map(function (x, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + x[0] + '</div><div class="step__d">' + x[1] + "</div></div></div>";
        }).join("") + "</div>") +
      card("异常之后做什么", "不是看一眼就完了", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>点异常点 → 看<b>原始检验记录</b>（跳转质量追溯系统）</li><li>关联<b>批次与工序</b>，定位是设备、物料还是人</li>" +
        "<li>同一指标连续异常 → 自动生成<b>预警事件</b>并派给责任人</li><li>关闭预警时必须写<b>措施</b>，形成闭环</li></ul>") +
      "</div>";
  }
  function openSpcPoint(i) {
    var v = V.quality.spc[i];
    var names = ["超出 3σ 控制上限", "连续 2 点超 2σ（同侧）", "连续 7 点单侧下降", "连续 6 点递增/递减"];
    var rid = names[i % names.length];
    openDrawer({
      title: "异常点 P" + (i + 1), sub: "一次合格率 " + v + "% · 控制限 93.4%～98.6%",
      body: '<span class="tag red"><i class="dot"></i>异常</span><div style="height:12px"></div>' +
        kv([["判定规则", rid], ["当前值", v + "%"], ["中心线 CL", "96.0%"], ["控制限", "93.4% ～ 98.6%"], ["发生时间", "2026-10-18 22:14"],
          ["产品线", "SMT-2"], ["工序", "回流焊"], ["批次", "B-20261018-07"]]) +
        '<div class="note warn" style="margin-top:14px">这种异常只说明“过程有异常波动”，不等于“产品不合格”。下一步要查设备参数、物料批次和人员操作。</div>' +
        '<div class="rule-chip" style="margin:12px 0">BR-VZ-43 / BR-VZ-44</div>' +
        '<div class="btn-row"><button class="btn primary" data-act="spc-jump">查看原始检验记录</button>' +
        '<button class="btn" data-act="spc-alert">生成异常工单</button></div>'
    });
  }

  // =========================================================
  // 3. 生产实时实时状态
  // =========================================================
  function pageProduction() {
    var p = V.production;
    var lines = p.lines.map(function (ln) {
      return '<div class="line-block"><div class="line-block__head"><b>' + esc(ln.name) + "</b>" +
        '<span class="cell-sub">8 个工位</span><span style="margin-left:auto">' +
        (ln.stations.filter(function (s) { return s.s === "fault"; }).length ? tag("有故障", "red") : tag("正常", "green")) + "</span></div>" +
        '<div class="stations">' + ln.stations.map(function (s) {
          var cls = UI.offline ? "offline" : s.s;
          var label = UI.offline ? "超时" : ({ run: "运行", idle: "待机", fault: "故障", offline: "离线" })[s.s];
          return '<div class="station ' + cls + '" data-act="station" data-line="' + esc(ln.name) + '" data-name="' + esc(s.n) + '" data-status="' + s.s + '">' +
            '<div class="n">' + esc(s.n) + '</div><div class="s">' + label + "</div></div>";
        }).join("") + "</div></div>";
    }).join("");

    var shift = p.shift;
    var pct = Math.round(shift.output / shift.target * 100);

    return pageHead("生产实时状态", "看每条产线、每个工位现在是运行、待机还是故障，以及当班产量；网络断了会保留最后的画面并提示。",
      '<label class="switch"><input type="checkbox" id="offline-toggle" ' + (UI.offline ? "checked" : "") + '><span class="track"></span>模拟断网</label>' +
      '<button class="btn" data-act="prod-refresh" style="margin-left:8px">立即刷新</button>') +
      ruleChips(["BR-VZ-40", "BR-VZ-41", "BR-VZ-54"]) +
      (UI.offline ? '<div class="offline-banner">⚠ 数据连接中断 · 最后更新 14:52 · 屏幕保留最后数据，恢复后自动重连（BR-VZ-54）</div>' : "") +
      '<div class="grid grid--4" style="margin-bottom:14px">' +
      '<div class="card stat"><div class="stat__label">当班产量</div><div class="stat__value">' + num(shift.output) + '</div><div class="stat__delta">目标 ' + num(shift.target) + " · 达成 " + pct + "%</div></div>" +
      '<div class="card stat"><div class="stat__label">平均节拍</div><div class="stat__value">' + shift.takt + ' 秒</div><div class="stat__delta">标准 40 秒</div></div>' +
      '<div class="card stat"><div class="stat__label">综合效率 设备综合效率</div><div class="stat__value">' + shift.oee + '%</div><div class="stat__delta down">低于目标 85%</div></div>' +
      '<div class="card stat"><div class="stat__label">当前告警</div><div class="stat__value">' + shift.alarms + '</div><div class="stat__delta down">1 条未处理</div></div>' +
      "</div>" +
      lines +
      '<div class="grid grid--2" style="margin-top:6px">' +
      card("图例与刷新", "实时状态不是截图", '<div class="legend-inline">' +
        '<span><i style="background:#15915b"></i>运行</span><span><i style="background:#b87503"></i>待机</span>' +
        '<span><i style="background:#c8302e"></i>故障</span><span><i style="background:#7a869c"></i>离线</span></div>' +
        '<div class="note" style="margin-top:10px">刷新频率可配（默认 10 秒）；超过 30 秒未更新显示“数据超时”。当前：<b id="refresh-tip">10 秒后刷新</b></div>') +
      card("断网会发生什么", "演示重点", '<div class="note warn">打开右上角“模拟断网”：<br>' +
        "画面不会白屏，会保留最后一次数据并标注“数据连接中断 / 最后更新 14:52”；恢复后自动重连，不弹配置窗口。</div>") +
      "</div>";
  }
  function stationDrawer(line, name, status) {
    openDrawer({
      title: name + " · " + line, sub: "工位实时状态",
      body: statusTag(({ run: "运行中", idle: "待机", fault: "故障", offline: "离线" })[status]) + '<div style="height:12px"></div>' +
        kv([["所属产线", line], ["工位", name], ["设备编号", "EQ-" + (line === "SMT-1" ? "11" : line === "SMT-2" ? "22" : "33") + "-0" + (Math.floor(Math.random() * 8) + 1)],
          ["当前工单", "WO-20261019-08"], ["节拍", "42 秒"], ["当班产出", "2,860 件"], ["最后心跳", "14:57:12"]]) +
        '<div class="note" style="margin-top:12px">状态由设备采集网关上报；超过 30 秒无心跳即判为“离线”，避免把停机误看成运行。</div>'
    });
  }

  // =========================================================
  // 4. 销售分析
  // =========================================================
  function pageSales() {
    if (UI.unit === "元") UI.unit = "万元";
    var unit = UI.unit, factor = unit === "亿元" ? 0.0001 : 1;
    var f = function (v) { return unit === "亿元" ? Number(v).toFixed(2) : num(v); };
    var regions = V.sales.regions.map(function (r, i) { return { name: r.name, value: r.value * factor, color: i === 0 ? "#2f5bd7" : "#8aa4e8" }; });
    var regionBars = barChart(regions, { h: 175, fmt: f });
    var funnel = V.sales.funnel.map(function (s, i) {
      var pct = Math.round(s.n / V.sales.funnel[0].n * 100);
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>' + esc(s.stage) +
        '</span><b>' + num(s.n) + " · " + pct + '%</b></div><div class="progress"><i style="width:' + pct + "%" + (i > 2 ? ";background:#b87503" : "") + '"></i></div></div>';
    }).join("");
    var custs = V.sales.customers.map(function (c) {
      return row([c.name, c.short].join(" "), "", [
        '<div class="cell-main">' + esc(UI.mask ? c.short : c.name) + "</div>" + (UI.mask ? '<div class="cell-sub">已脱敏（BR-VZ-47）</div>' : ""),
        '<span class="num">' + f(c.value * factor) + " " + unit + "</span>"
      ]);
    });
    var total = V.sales.regions.reduce(function (a, b) { return a + b.value; }, 0);
    return pageHead("销售分析", "从区域、客户、转化过程三个角度看销售；金额单位可以切换，客户名称可以打码。",
      '<div class="seg" data-seg="unit">' + ["万元", "亿元"].map(function (u) {
        return '<button data-val="' + u + '" class="' + (UI.unit === u ? "on" : "") + '">' + u + "</button>";
      }).join("") + "</div>" +
      '<label class="switch" style="margin-left:8px"><input type="checkbox" id="mask-toggle" ' + (UI.mask ? "checked" : "") + '><span class="track"></span>客户名称脱敏</label>') +
      ruleChips(["BR-VZ-46", "BR-VZ-47"]) +
      '<div class="grid grid--4" style="margin-bottom:14px">' +
      '<div class="card stat"><div class="stat__label">本月销售额</div><div class="stat__value">' + f(total * factor) + '</div><div class="stat__delta">单位：' + unit + '</div></div>' +
      '<div class="card stat"><div class="stat__label">成交订单</div><div class="stat__value">168</div><div class="stat__delta up">环比 +6.2%</div></div>' +
      '<div class="card stat"><div class="stat__label">线索转化率</div><div class="stat__value">14.0%</div><div class="stat__delta">1200 → 168</div></div>' +
      '<div class="card stat"><div class="stat__label">TOP 客户占比</div><div class="stat__value">22.2%</div><div class="stat__delta">A 客户</div></div>' +
      "</div>" +
      '<div class="grid grid--sidebar">' +
      card("区域销售分布", "单位：" + unit, regionBars + '<div class="chart-legend"><span>点击柱子查看区域客户</span></div>') +
      card("订单漏斗", "线索 → 成交", funnel) +
      "</div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("客户排行", "金额单位：" + unit + (UI.mask ? " · 已脱敏" : ""), table(["客户", { label: "销售额", cls: "num" }], custs)) +
      card("两个容易忽略的规则", "单位与脱敏", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>金额单位必须标注，切换单位<b>不改变数值精度</b>（BR-VZ-46）</li><li>对外展示客户必须用<b>简称</b>（BR-VZ-47）</li>" +
        "<li>地图逐层查看到省/市属于 P1，本期先做区域条形</li></ul>") +
      "</div>";
  }

  // =========================================================
  // 5. 报表制作
  // =========================================================
  var FIELDS = {
    region: { name: "区域", type: "dim" }, product: { name: "产品", type: "dim" }, month: { name: "月份", type: "dim" },
    amount: { name: "销售额", type: "measure", unit: "万元" }, qty: { name: "数量", type: "measure", unit: "件" }
  };
  function pageReport() {
    var r = UI.report;
    var chips = Object.keys(FIELDS).map(function (k) {
      return '<span class="field-chip ' + (FIELDS[k].type === "measure" ? "num" : "") + '" draggable="true" data-field="' + k + '">' +
        esc(FIELDS[k].name) + '<span class="t">' + (FIELDS[k].type === "measure" ? "度量" : "维度") + "</span></span>";
    }).join("");
    function zone(k, label) {
      var items = r[k].map(function (f) {
        return '<span class="field-chip ' + (FIELDS[f].type === "measure" ? "num" : "") + '" data-act="rep-remove" data-zone="' + k + '" data-field="' + f + '" title="点击移除">' +
          esc(FIELDS[f].name) + ' <span class="t">×</span></span>';
      }).join("");
      return '<div style="margin-bottom:10px"><div class="zone-label">' + label + "</div>" +
        '<div class="drop-zone" data-zone="' + k + '">' + (items || '<span class="ph">拖拽字段到这里</span>') + "</div></div>";
    }
    var preview = renderReportPreview();

    return pageHead("报表制作", "不用等 IT，自己把字段拖进来看结果；数据只能来自已审核的数据表，不能直接连业务库写查询。",
      '<button class="btn" data-act="rep-reset">清空</button><button class="btn" data-act="rep-save">保存为报表</button>') +
      ruleChips(["BR-VZ-64", "BR-VZ-24", "BR-VZ-65"]) +
      '<div class="builder">' +
      '<div class="card"><div class="card__body">' +
      '<div class="zone-label">字段（可拖拽，也可点击）</div>' +
      '<div>' + Object.keys(FIELDS).map(function (k) {
        return '<span class="field-chip ' + (FIELDS[k].type === "measure" ? "num" : "") + '" data-act="rep-add" data-field="' + k + '">' +
          esc(FIELDS[k].name) + '<span class="t">' + (FIELDS[k].type === "measure" ? "度量" : "维度") + "</span></span>";
      }).join("") + "</div>" +
      '<div class="note" style="margin-top:10px">数据源：<b>销售订单（DS-03）</b> · 已发布 · 12 行样例<br>维度上限 6 个、度量上限 10 个。</div>' +
      "</div></div>" +
      '<div class="card"><div class="card__body">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + zone("rows", "行维度") + zone("cols", "列维度（交叉）") + "</div>" +
      zone("values", "值（度量）") +
      '<div class="toolbar-inline" style="margin:4px 0 12px"><span style="font-size:12px;color:#7a869c">图表类型</span>' +
      '<div class="seg" data-seg="rchart">' + ["表格", "柱状", "折线"].map(function (c) {
        return '<button data-val="' + c + '" class="' + (r.chart === c ? "on" : "") + '">' + c + "</button>";
      }).join("") + "</div></div>" +
      '<div class="zone-label">预览</div><div class="report-preview">' + preview + "</div>" +
      "</div></div>" +
      '<div class="card"><div class="card__body">' +
      '<div class="zone-label">已保存报表</div>' +
      (V.reports.length ? V.reports.map(function (rp) {
        return '<div class="callout-row" style="padding:8px 0"><div class="grow"><div class="cell-main">' + esc(rp.name) + '</div>' +
          '<div class="cell-sub">' + esc(rp.chart) + " · " + esc(rp.owner) + " · " + esc(rp.updated) + "</div></div>" + statusTag(rp.status) + "</div>";
      }).join("") : '<div class="empty">还没有保存的报表</div>') +
      '<div class="note warn" style="margin-top:10px">发布需审核：统计定义、权限、性能、敏感字段（BR-VZ-65）。</div>' +
      "</div></div></div>";
  }
  function reportAgg() {
    var r = UI.report;
    if (!r.values.length) return null;
    var dims = r.rows.concat(r.cols);
    if (r.cols.length > 1) return { error: "交叉表只支持 1 个列维度" };
    var map = {}, colSet = {};
    V.reportData.forEach(function (d) {
      var key = dims.map(function (f) { return d[f]; }).join(" / ") || "合计";
      var ck = r.cols.length ? d[r.cols[0]] : "";
      colSet[ck] = true;
      map[key] = map[key] || { key: key, cells: {} };
      map[key].cells[ck] = (map[key].cells[ck] || 0) + d[r.values[0]];
    });
    return { list: Object.keys(map).map(function (k) { return map[k]; }), cols: Object.keys(colSet), value: r.values[0] };
  }
  function renderReportPreview() {
    var agg = reportAgg();
    if (!agg) return '<div class="empty"><span class="big">▤</span>选一个“值”字段，报表就会出来</div>';
    if (agg.error) return '<div class="empty">' + esc(agg.error) + "</div>";
    var vname = FIELDS[agg.value].name + "（" + FIELDS[agg.value].unit + "）";
    if (UI.report.chart === "柱状") {
      var items = agg.list.map(function (g) { return { name: g.key, value: g.cells[agg.cols[0]] || g.cells[""] || 0 }; });
      return barChart(items, { h: 190 }) + '<div class="chart-legend"><span>按 ' + esc(UI.report.rows.concat(UI.report.cols).map(function (f) { return FIELDS[f].name; }).join(" / ") || "合计") + " 汇总</span></div>";
    }
    if (UI.report.chart === "折线") {
      var labels = agg.list.map(function (g) { return g.key; });
      var vals = agg.list.map(function (g) { return g.cells[agg.cols[0]] || g.cells[""] || 0; });
      return lineChart(labels, vals, { h: 190, area: true });
    }
    var head = "<th>" + esc(UI.report.rows.map(function (f) { return FIELDS[f].name; }).join(" / ") || "合计") + "</th>";
    if (agg.cols.length && agg.cols[0] !== "") head += agg.cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("");
    else head += "<th>" + esc(vname) + "</th>";
    var rowsHtml = agg.list.map(function (g) {
      var tds = "<td>" + esc(g.key) + "</td>";
      if (agg.cols.length && agg.cols[0] !== "") tds += agg.cols.map(function (c) { return '<td class="num">' + num(g.cells[c] || 0) + "</td>"; }).join("");
      else tds += '<td class="num">' + num(g.cells[""] || 0) + "</td>";
      return "<tr>" + tds + "</tr>";
    }).join("");
    return '<table class="report-table"><thead><tr>' + head + "</tr></thead><tbody>" + rowsHtml + "</tbody></table>";
  }
  function addField(zone, field) {
    var type = FIELDS[field] && FIELDS[field].type;
    if (!type) return;
    if (zone === "values" && type !== "measure") { toast("值区域只能放度量", "维度请放到行或列（BR-VZ-24 的图表标注要求）", "error"); return; }
    if (zone !== "values" && type !== "dim") { toast("行/列只能放维度", "度量请放到值区域", "error"); return; }
    var arr = UI.report[zone];
    if (arr.indexOf(field) > -1) { toast("字段已存在", "", "warn"); return; }
    if (zone === "values" && arr.length >= 10) { toast("度量超过 10 个", "BR-VZ-20：超出请拆分报表", "error", "BR-VZ-20"); return; }
    if (zone !== "values" && arr.length >= 6) { toast("维度超过 6 个", "BR-VZ-20：超出请拆分报表", "error", "BR-VZ-20"); return; }
    arr.push(field);
    render();
  }

  // =========================================================
  // 6. 数据表与质量
  // =========================================================
  function pageDatasets() {
    var rows = V.datasets.map(function (d) {
      return row([d.name, d.owner, d.status].join(" "), d.status, [
        '<div class="cell-main">' + esc(d.name) + '</div><div class="cell-sub mono">' + d.id + " · " + d.fields + " 个字段</div>",
        esc(d.owner),
        sensTag(d.sensitivity),
        '<div class="num">' + esc(d.rows) + '<div class="cell-sub">' + esc(d.updated) + "</div></div>",
        '<div style="min-width:120px"><div class="progress ' + (d.quality < 90 ? "warn" : "") + '"><i style="width:' + d.quality + '%"></i></div>' +
        '<div class="cell-sub">质量分 ' + d.quality + (d.quality < 90 ? " · 未达标" : "") + "</div></div>",
        '<div class="actions"><button class="btn small" data-act="ds-detail" data-id="' + d.id + '">详情</button>' +
        '<button class="btn small" data-act="ds-clean" data-id="' + d.id + '">清洗试跑</button></div>'
      ]);
    });
    var profile = V.profile.map(function (p) {
      return row([p.field, p.note].join(" "), "", [
        esc(p.field),
        '<span class="num">' + p.nullRate + "%</span>",
        '<span class="num">' + p.dupRate + "%</span>",
        '<span class="num">' + p.formatErr + "%</span>",
        '<span class="cell-sub">' + esc(p.note) + "</span>"
      ]);
    });
    var rules = V.qualityRules.map(function (r) {
      return row([r.id, r.dim, r.target].join(" "), r.status, [
        '<span class="mono">' + r.id + "</span>", tag(r.dim, "blue"), esc(r.target), esc(r.rule),
        '<span class="num">' + r.hit + "</span>", statusTag(r.status),
        '<div class="actions"><button class="btn small" data-act="qr-toggle" data-id="' + r.id + '">' + (r.status === "启用" ? "停用" : "启用") + "</button></div>"
      ]);
    });
    return pageHead("数据表与质量", "报表的数据都来自这里的数据表。每张表要有负责人、敏感级别和质量分；质量不达标的，用它的报表会带提示。", "") +
      ruleChips(["BR-VZ-16", "BR-VZ-11", "BR-VZ-09"]) +
      card("数据表", "6 个已登记数据表", table(["数据表", "负责人", "敏感级别", { label: "行数 / 更新", cls: "num" }, "质量分", { label: "操作", cls: "num" }], rows, "ds-table")) +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("数据质量体检", "空值 / 重复 / 格式错误（近 7 天）", table(["字段", { label: "空值率", cls: "num" }, { label: "重复率", cls: "num" }, { label: "格式错误", cls: "num" }, "说明"], profile)) +
      card("质量规则", "5 类规则，命中即生成问题清单", table(["编号", "维度", "对象", "规则", { label: "命中", cls: "num" }, "状态", { label: "操作", cls: "num" }], rules)) +
      "</div>" +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("清洗与转换", "先试跑，再启用", '<div class="note">点任意数据表的「清洗试跑」：会看到 <b>100 条抽样</b>、前后对照、影响行数与 1 条失败记录。' +
        "<br><br>BR-VZ-11：不试跑不允许启用；BR-VZ-12：清洗只作用于分析副本，不改源系统。</div>") +
      card("质量未达标会怎样", "不是只写在报告里", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>数据表质量分低于阈值 → 报表上加<b>质量提示角标</b>（BR-VZ-09）</li><li>同一指标 24 小时只提醒一次，连续 3 次未改善升级（BR-VZ-08）</li>" +
        "<li>客户档案质量分 88，已标黄</li></ul>") +
      "</div>";
  }
  function dsDetail(id) {
    var d = V.datasets.filter(function (x) { return x.id === id; })[0];
    openDrawer({
      title: d.name, sub: d.id + " · " + d.rows + " 行",
      body: sensTag(d.sensitivity) + '<div style="height:12px"></div>' +
        kv([["业务负责人", d.owner], ["技术负责人", "平台数据组"], ["字段数", d.fields], ["最近更新", d.updated],
          ["质量分", d.quality + " / 100"], ["状态", d.status]]) +
        '<h3 style="margin:18px 0 8px;font-size:14px">字段（示例）</h3>' +
        '<div class="mono" style="font-size:12px;line-height:1.9;color:#44506a">' +
        (id === "DS-01" ? "batch_no 批次号<br>process 工序<br>result 检验结果<br>inspect_time 检验时间<br>inspector 检验员（敏感）" : "id 主键<br>org_code 组织编码<br>created_at 创建时间<br>amount 金额（敏感）") + "</div>" +
        '<div class="note warn" style="margin-top:12px">敏感字段展示自动脱敏；看原值需单独授权（BR-VZ-17）。</div>' +
        '<div class="rules-inline" style="margin-top:12px">' + ["BR-VZ-16", "BR-VZ-17"].map(rule).join("") + "</div>"
    });
  }
  function cleanRun(id) {
    var d = V.datasets.filter(function (x) { return x.id === id; })[0];
    openModal({
      wide: true,
      title: "清洗试跑 · " + d.name,
      sub: "抽样 100 条 · 只读试跑，不影响生产数据",
      body: '<div class="mini-stat" style="margin-bottom:12px"><span>扫描 <b>100</b></span><span>命中 <b>6</b></span><span>影响行数 <b>128</b></span><span>失败 <b>1</b></span></div>' +
        '<table class="report-table"><thead><tr><th>源值</th><th>规则</th><th>处理后</th><th>结果</th></tr></thead><tbody>' +
        [["  138 0013 8000 ", "手机号去空格", "13800138000", "通过"],
        ["2026/10/18", "日期格式统一", "2026-10-18", "通过"],
        ["（空）", "空值填充默认值", "UNKNOWN", "通过"],
        ["MAT-001", "编码大写", "MAT-001", "通过"],
        ["B-20261018-07", "批次号格式校验", "B-20261018-07", "通过"],
        ["mat-0012", "编码映射", "MAT-0012", "转换"],
        ["", "检验结果非空", "—", "失败"]].map(function (r) {
          return row(r[0], "", ['<span class="mono">' + esc(r[0]) + "</span>", esc(r[1]), '<span class="mono">' + esc(r[2]) + "</span>",
            r[3] === "失败" ? tag("失败", "red") : r[3] === "转换" ? tag("已转换", "blue") : tag("通过", "green")]);
        }).join("") + "</tbody></table>" +
        '<div class="note danger" style="margin-top:12px">1 条失败：检验结果为空。错误数据进入错误清单，<b>不会静默丢弃</b>（BR-VZ-14）。<br>确认试跑结果后才可以启用规则（BR-VZ-11）。</div>',
      footer: '<button class="btn" data-close="modal">关闭</button><button class="btn primary" data-act="clean-enable" data-id="' + id + '">确认并启用规则</button>'
    });
  }

  // =========================================================
  // 7. 指标与标准
  // =========================================================
  function pageMetrics() {
    var rows = V.metrics.map(function (m) {
      return row([m.id, m.name, m.owner, m.status].join(" "), m.status, [
        '<div class="cell-main">' + esc(m.name) + '</div><div class="cell-sub mono">' + m.id + " · " + m.version + "</div>",
        '<div class="cell-sub">' + esc(m.def) + '</div><div class="cell-sub mono">' + esc(m.formula) + "</div>",
        '<span class="mono">' + esc(m.unit) + "</span>",
        esc(m.owner),
        '<button class="btn small ghost" data-act="metric-refs" data-id="' + m.id + '">' + m.refs + " 处</button>",
        statusTag(m.status),
        '<div class="actions"><button class="btn small" data-act="metric-change" data-id="' + m.id + '">变更</button></div>'
      ]);
    });
    return pageHead("指标定义", "同一个指标只能有一个统计定义。经营总览、报表、展示屏都必须用同一份定义，否则数字对不上。",
      '<button class="btn primary" data-act="metric-new">＋ 新建指标</button>') +
      ruleChips(["BR-VZ-02", "BR-VZ-01", "BR-VZ-21"]) +
      card("指标清单", "8 个核心指标", table(["指标", "统计定义 / 计算逻辑", "单位", "负责人", "被引用", "状态", { label: "操作", cls: "num" }], rows, "metric-table")) +
      '<div class="grid grid--3" style="margin-top:14px">' +
      card("数据标准（四类）", "标准先于指标", '<div class="steps">' +
        [["数据字典", "字段命名、类型、取值", "2026-08-01"], ["编码规则", "物料/客户/批次编码", "2026-08-15"],
        ["业务术语", "合格率、准时率等定义", "2026-09-01"], ["数据模型规范", "数仓分层与命名", "2026-09-10"]].map(function (x, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + x[0] + '</div><div class="step__d">' + x[1] + " · 生效 " + x[2] + "</div></div></div>";
        }).join("") + "</div>") +
      card("变更一个指标会怎样", "影响不是改个数字", '<div class="note warn">点任意指标的「变更」：<br>会先提示<b>被 6 张报表、2 块展示屏引用</b>，要求填写变更原因，版本号 +1，并通知责任人（BR-VZ-02）。</div>') +
      card("指标统计定义示例", "一次检验合格率", '<div class="mono" style="font-size:12px;line-height:1.9;color:#44506a;background:#f8fafd;padding:10px;border-radius:8px">' +
        "合格数 = COUNT(检验结果='合格')<br>检验总数 = COUNT(检验记录)<br>合格率 = 合格数 / 检验总数 × 100%<br><br>排除：返工后复检、首件检验</div>") +
      "</div>";
  }
  function metricRefs(id) {
    var m = V.metrics.filter(function (x) { return x.id === id; })[0];
    openDrawer({
      title: "引用情况 · " + m.name, sub: m.id + " · " + m.refs + " 处引用",
      body: table(["引用对象", "类型", "负责人"], [
        row("经营经营总览", "", ["经营经营总览", "展示屏", "王分析"]),
        row("月度质量分析", "", ["月度质量分析", "报表", "李娜"]),
        row("质量分析页", "", ["质量分析", "实时状态", "李娜"]),
        row("移动端-核心指标", "", ["移动端 核心指标", "订阅", "王分析"])
      ]) +
        '<div class="note" style="margin-top:12px">BR-VZ-02：指标变更前必须给出影响清单，并通知责任人。</div>'
    });
  }

  // =========================================================
  // 8. 展示屏设计器
  // =========================================================
  function pageScreen() {
    var sc = V.screens.filter(function (s) { return s.id === UI.screen.id; })[0];
    var sel = sc.comps.filter(function (c) { return c.id === UI.screen.sel; })[0];
    var ratio = UI.screen.res === "3840 × 1080（拼接屏）" ? "32 / 9" : "16 / 9";
    var comps = sc.comps.map(function (c) {
      var value = { "营收": "12,860", "产量": "312,480", "一次合格率": "93.2", "当班产量": "18,420" }[c.title] || "—";
      var inner = c.type === "kpi"
        ? '<div class="ct">' + esc(c.title) + '</div><div class="cv">' + value + '</div><div class="cu">' + esc(c.unit) + "</div>"
        : '<div class="ct">' + esc(c.title) + '</div><div class="mm-chart">' +
        [42, 62, 48, 78, 56, 88, 66].map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("") + "</div>";
      return '<div class="comp ' + (UI.screen.sel === c.id ? "sel" : "") + '" ' +
        'style="left:' + c.x + "%;top:" + c.y + "%;width:" + c.w + "%;height:" + c.h + '%" data-act="scr-sel" data-id="' + c.id + '">' + inner + "</div>";
    }).join("");

    var pal = ["kpi 指标卡", "chart 柱状图", "line 折线图", "table 表格", "map 地图"].map(function (p) {
      var parts = p.split(" ");
      return '<div class="palette-item" data-act="scr-add" data-type="' + parts[0] + '"><span>＋</span>' + parts[1] + "</div>";
    }).join("");

    var prop = sel ? '<div class="zone-label">板块属性</div>' +
      '<div class="field"><label>标题</label><input class="input" id="p-title" value="' + esc(sel.title) + '"></div>' +
      '<div class="field"><label>单位</label><input class="input" id="p-unit" value="' + esc(sel.unit) + '"></div>' +
      '<div class="field"><label>数据源</label><input class="input" id="p-source" value="' + esc(sel.source) + '"></div>' +
      '<div class="btn-row"><button class="btn primary small" data-act="scr-save">保存属性</button>' +
      '<button class="btn small danger" data-act="scr-del" data-id="' + sel.id + '">删除</button></div>' +
      '<div class="note" style="margin-top:10px">BR-VZ-50：标题/单位/数据源缺一不可，否则不允许发布。</div>'
      : '<div class="empty"><span class="big">◻</span>点击画布中的板块<br>在这里改属性</div>';

    return pageHead("展示屏设计", "像搭积木一样拼展示屏：加板块、改标题、换分辨率，发布前检查标题、单位、数据来源是否齐全。",
      '<button class="btn" data-act="scr-preview">预览</button><button class="btn primary" data-act="scr-publish">发布</button>') +
      ruleChips(["BR-VZ-48", "BR-VZ-50", "BR-VZ-51"]) +
      '<div class="screen-wrap">' +
      '<div class="card"><div class="card__body">' +
      '<div class="zone-label">板块库</div>' + pal +
      '<div class="zone-label" style="margin-top:14px">版本</div>' +
      '<div class="cell-sub">' + esc(sc.version) + " · " + esc(sc.updated) + " · " + sc.comps.length + " 个板块</div>" +
      '<div class="note" style="margin-top:10px">发布保留历史版本，可回滚（BR-VZ-51）。</div>' +
      "</div></div>" +
      '<div class="card"><div class="card__body">' +
      '<div class="toolbar-inline" style="margin-bottom:10px"><span style="font-size:12px;color:#7a869c">分辨率</span>' +
      '<div class="seg" data-seg="sres">' + ["1920 × 1080", "2560 × 1440", "3840 × 1080（拼接屏）"].map(function (r) {
        return '<button data-val="' + r + '" class="' + (UI.screen.res === r ? "on" : "") + '">' + r.replace("（拼接屏）", " 拼接") + "</button>";
      }).join("") + "</div>" +
      '<span style="margin-left:auto;font-size:11.5px;color:#7a869c">' + esc(sc.name) + " · " + esc(sc.status) + "</span></div>" +
      '<div class="canvas-frame"><div class="canvas" style="aspect-ratio:' + ratio + '">' + comps + "</div></div>" +
      '<div class="screen-meta"><span>画布按比例自适应，板块用百分比定位</span><span>当前 ' + esc(UI.screen.res) + "</span></div>" +
      "</div></div>" +
      '<div class="card"><div class="card__body">' + prop + "</div></div>" +
      "</div>";
  }
  function screenOf() { return V.screens.filter(function (s) { return s.id === UI.screen.id; })[0]; }
  function addComp(type) {
    var sc = screenOf();
    var id = "C" + (sc.comps.length + 1);
    var base = { id: id, type: type, title: "新板块", unit: "单位", source: "", x: 58, y: 56, w: 20, h: 30 };
    if (type === "kpi") base.title = "新指标";
    sc.comps.push(base);
    UI.screen.sel = id;
    render();
    toast("已添加板块", "记得补标题、单位和数据源，否则发布会被拦截", "info");
  }
  function publishScreen() {
    var sc = screenOf();
    var bad = sc.comps.filter(function (c) { return !c.title || !c.unit || !c.source; });
    if (bad.length) {
      openModal({
        title: "发布前校验未通过",
        sub: "BR-VZ-50：标题、单位、数据源缺一不可",
        body: '<div class="note danger">以下板块缺少必填信息：</div>' +
          '<ul style="font-size:12.5px;line-height:2">' + bad.map(function (c) {
            var miss = [];
            if (!c.title) miss.push("标题");
            if (!c.unit) miss.push("单位");
            if (!c.source) miss.push("数据源");
            return "<li><b>" + esc(c.id) + "</b> 缺：" + miss.join("、") + "</li>";
          }).join("") + "</ul>" +
          '<div class="note" style="margin-top:10px">补齐后再发布。这条规则是为了避免展示屏上线后出现“没有单位”“数据源不明”的尴尬。</div>',
        footer: '<button class="btn" data-close="modal">去补齐</button>'
      });
      return;
    }
    openModal({
      title: "提交发布审核", sub: sc.name + " · " + sc.comps.length + " 个板块",
      body: '<div class="field"><label>发布说明</label><input class="input" id="f-pub-note" placeholder="如：经营总览展示屏 v4，新增质量指标"></div>' +
        '<div class="note">审核通过后生效，历史版本保留可回滚（BR-VZ-51）。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="scr-approve">审核通过并发布</button>'
    });
  }

  // =========================================================
  // 9. 预警中心
  // =========================================================
  function pageAlerts() {
    var rules = V.alertRules.map(function (r) {
      return row([r.id, r.metric].join(" "), "", [
        '<span class="mono">' + r.id + "</span>", esc(r.metric), esc(r.cond),
        tag(r.level, r.level === "高" ? "red" : r.level === "中" ? "amber" : "gray"),
        '<div class="pill-list">' + r.channels.map(function (c) { return tag(c, "blue"); }).join("") + "</div>",
        esc(r.owner)
      ]);
    });
    var events = V.events.map(function (e) {
      return row([e.id, e.metric, e.object, e.status].join(" "), e.status, [
        '<span class="mono">' + e.id + "</span>",
        '<div class="cell-main">' + esc(e.metric) + " · " + esc(e.object) + '</div><div class="cell-sub">' + esc(e.rule) + " · " + esc(e.time) + "</div>",
        '<span class="num">' + esc(e.value) + "</span>",
        statusTag(e.status) + (e.escalated ? ' <span class="tag red" style="font-size:10px">已升级</span>' : ""),
        esc(e.owner),
        '<div class="actions">' +
        (e.status === "待认领" ? '<button class="btn small primary" data-act="ev-claim" data-id="' + e.id + '">认领</button>' : "") +
        (e.status !== "已关闭" && e.status !== "误报" ? '<button class="btn small" data-act="ev-close" data-id="' + e.id + '">关闭</button>' : "") +
        (e.status !== "已关闭" && e.status !== "误报" ? '<button class="btn small ghost" data-act="ev-false" data-id="' + e.id + '">误报</button>' : "") +
        "</div>"
      ]);
    });
    return pageHead("预警提醒", "指标超过警戒线，系统主动通知责任人；同一条不重复打扰，没人处理就上报上级，处理完必须写措施。",
      '<button class="btn" data-act="ev-fast">快进 2 小时</button><button class="btn primary" data-act="ev-trigger">模拟触发</button>') +
      ruleChips(["BR-VZ-69", "BR-VZ-70", "BR-VZ-71"]) +
      '<div class="grid grid--4" style="margin-bottom:14px">' +
      '<div class="card stat"><div class="stat__label">预警规则</div><div class="stat__value">' + V.alertRules.length + '</div><div class="stat__delta">4 个指标</div></div>' +
      '<div class="card stat"><div class="stat__label">待认领</div><div class="stat__value">' + V.events.filter(function (e) { return e.status === "待认领"; }).length + '</div><div class="stat__delta down">超 2 小时自动升级</div></div>' +
      '<div class="card stat"><div class="stat__label">处理中</div><div class="stat__value">' + V.events.filter(function (e) { return e.status === "处理中"; }).length + '</div><div class="stat__delta">平均闭环 4.2 小时</div></div>' +
      '<div class="card stat"><div class="stat__label">本月误报率</div><div class="stat__value">8%</div><div class="stat__delta">目标 ≤5%</div></div>' +
      "</div>" +
      card("预警规则", "", table(["编号", "指标", "触发条件", "级别", "通道", "责任人"], rules)) +
      '<div class="grid grid--sidebar" style="margin-top:14px">' +
      card("预警事件", "认领 → 处理 → 关闭（必须写措施）", table(["编号", "指标 / 对象", { label: "当前值", cls: "num" }, "状态", "责任人", { label: "操作", cls: "num" }], events)) +
      card("去重与升级", "演示重点", '<div class="note warn"><b>去重：</b>同一指标同一对象 24 小时内只推一次。<br><br>' +
        "<b>升级：</b>2 小时未认领自动升级到上级。<br><br><b>重推：</b>恶化超过 20% 立即重推（BR-VZ-70）。</div>" +
        '<div class="btn-row" style="margin-top:12px"><button class="btn small" data-act="ev-trigger">触发一次</button>' +
        '<button class="btn small" data-act="ev-fast">快进 2 小时</button></div>') +
      "</div>";
  }

  // =========================================================
  // 10. 数据来源关系
  // =========================================================
  function pageLineage() {
    var A = V.assets, W = 900, H = 360;
    var layers = [[], [], [], [], []];
    A.nodes.forEach(function (n) { layers[n.layer].push(n); });
    var xs = [40, 220, 390, 560, 740];
    var pos = {};
    layers.forEach(function (arr, li) {
      arr.forEach(function (n, i) {
        var h = 44, gap = 14;
        var totalH = arr.length * h + (arr.length - 1) * gap;
        pos[n.id] = { x: xs[li], y: (H - totalH) / 2 + i * (h + gap), w: 130, h: h };
      });
    });
    function related(id, dir) {
      var set = { id: true }, queue = [id];
      while (queue.length) {
        var cur = queue.shift();
        A.edges.forEach(function (e) {
          var from = dir === "forward" ? e[0] : e[1];
          var to = dir === "forward" ? e[1] : e[0];
          if (from === cur && !set[to]) { set[to] = true; queue.push(to); }
        });
      }
      return set;
    }
    var hl = UI.lineage.node ? related(UI.lineage.node, UI.lineage.dir) : {};
    var svg = "";
    A.edges.forEach(function (e) {
      var a = pos[e[0]], b = pos[e[1]];
      if (!a || !b) return;
      var x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2;
      var on = hl[e[0]] && hl[e[1]];
      svg += '<path class="edge ' + (on ? "hl" : "") + '" d="M' + x1 + "," + y1 + " C" + (x1 + 40) + "," + y1 + " " + (x2 - 40) + "," + y2 + " " + x2 + "," + y2 + '"/>';
    });
    A.nodes.forEach(function (n) {
      var p = pos[n.id];
      var noOwner = n.id === "n9";
      svg += '<g class="node ' + (hl[n.id] ? "hl" : "") + '" data-act="ln-node" data-id="' + n.id + '" style="cursor:pointer">' +
        '<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="6"/>' +
        '<text x="' + (p.x + 8) + '" y="' + (p.y + 18) + '">' + esc(n.name.length > 9 ? n.name.slice(0, 9) + "…" : n.name) + "</text>" +
        '<text class="sub" x="' + (p.x + 8) + '" y="' + (p.y + 32) + '">' + esc(n.sub) + (noOwner ? " · 无责任人" : "") + "</text>" +
        "</g>";
    });
    var layersLabel = ["源系统", "贴源层", "明细层", "数据表", "报表 / 展示屏"];
    layersLabel.forEach(function (t, i) {
      svg += '<text x="' + xs[i] + '" y="18" font-size="10" fill="#9aa5ba">' + t + "</text>";
    });

    return pageHead("数据来源关系", "这张图回答两个问题：这个数字是从哪来的？改一个字段会影响哪些报表和展示屏？",
      '<div class="seg" data-seg="ldir"><button data-val="forward" class="' + (UI.lineage.dir === "forward" ? "on" : "") + '">正向（下游）</button>' +
      '<button data-val="reverse" class="' + (UI.lineage.dir === "reverse" ? "on" : "") + '">反向（上游）</button></div>' +
      '<button class="btn" data-act="ln-impact" style="margin-left:8px">模拟上游字段变更</button>') +
      ruleChips(["BR-VZ-58", "BR-VZ-59", "BR-VZ-60"]) +
      card("数据流向", "点击节点查看详情；当前方向：" + (UI.lineage.dir === "forward" ? "正向（影响下游）" : "反向（追溯上游）"),
        '<div class="lineage-box"><svg viewBox="0 0 900 360">' + svg + "</svg></div>" +
        '<div class="chart-legend"><span>蓝色高亮：与选中节点有来源关系关系的节点与链路</span><span>节点 n9（质量分析）无责任人，已标记</span></div>') +
      '<div class="grid grid--2" style="margin-top:14px">' +
      card("来源关系能做什么", "不是画着好看", '<ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:2">' +
        "<li>报表数字不对 → 反向查到<b>哪张表、哪个字段</b>出的问题</li><li>上游改字段 → 正向列出<b>受影响的报表/展示屏/订阅</b>（BR-VZ-60）</li>" +
        "<li>字段级来源关系默认展开上下游各 3 层（BR-VZ-58）</li></ul>") +
      card("资产治理的缺口", "评审时要问的问题", '<div class="note warn">质量分析（n9）<b>没有责任人</b>。资产没有主人，出问题就没人认领。<br><br>' +
        "建议：每个数据表与报表必须指定业务负责人，否则不允许发布（BR-VZ-57）。</div>") +
      "</div>";
  }

  // =========================================================
  // 11. 导出审批
  // =========================================================
  function pageExports() {
    var rows = V.exports.map(function (e) {
      return row([e.id, e.object, e.applicant, e.status].join(" "), e.status, [
        '<span class="mono">' + e.id + "</span>",
        '<div class="cell-main">' + esc(e.object) + '</div><div class="cell-sub">' + esc(e.fields) + " · " + num(e.rows) + " 行</div>",
        esc(e.applicant) + '<div class="cell-sub">' + esc(e.time) + "</div>",
        statusTag(e.status),
        '<span class="cell-sub mono" style="font-size:10.5px">' + esc(e.watermark) + "</span>",
        '<div class="actions">' +
        (e.status === "待审批" ? '<button class="btn small primary" data-act="ex-review" data-id="' + e.id + '">审批</button>' : "") +
        (e.status === "已批准" ? '<button class="btn small" data-act="ex-download" data-id="' + e.id + '">下载</button>' : "") +
        "</div>"
      ]);
    });
    return pageHead("导出审批", "能看到数据，不等于能导出。含手机号、客户名这类敏感信息的导出要审批，下载的文件带水印。", "") +
      ruleChips(["BR-VZ-47", "BR-VZ-65"]) +
      '<div class="grid grid--sidebar">' +
      card("发起导出", "演示：含敏感字段会自动进入待审批", '<div class="field"><label>导出对象</label><select class="select" id="ex-obj">' +
        '<option>质量月报</option><option>客户销售明细</option><option>设备告警清单</option></select></div>' +
        '<div class="form-row"><div class="field"><label>时间范围</label><select class="select" id="ex-range"><option>本月</option><option>上月</option><option>本季度</option></select></div>' +
        '<div class="field"><label>格式</label><select class="select"><option>Excel</option><option>PDF</option><option>CSV</option></select></div></div>' +
        '<div class="field"><label>包含字段</label><div style="display:grid;gap:6px">' +
        '<label class="check"><input type="checkbox" id="ex-sens" checked> 客户名称 / 手机号（敏感）</label>' +
        '<label class="check"><input type="checkbox"> 金额明细</label>' +
        '<label class="check"><input type="checkbox"> 检验明细</label></div></div>' +
        '<div class="field"><label>导出理由<span class="req">*</span></label><input class="input" id="ex-reason" placeholder="如：月度质量例会汇报"></div>' +
        '<button class="btn primary" style="width:100%" data-act="ex-submit">提交导出申请</button>') +
      card("导出的四道关", "少一道都不行", '<div class="steps">' +
        [["权限校验", "先确认你有没有这个数据范围的权限"], ["敏感审批", "含敏感字段 → 安全管理员审批（BR-VZ-65）"],
        ["加水印", "导出人 / 时间 / 编号，可追溯"], ["有效期", "下载链接 7 天有效，过期不可取"]].map(function (x, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + x[0] + '</div><div class="step__d">' + x[1] + "</div></div></div>";
        }).join("") + "</div>") +
      "</div>" +
      '<h2 class="section">导出记录</h2>' +
      card("", "", table(["编号", "对象", "申请人", "状态", "水印", { label: "操作", cls: "num" }], rows, "export-table"));
  }

  // =========================================================
  // 12/13. 规则与问题
  // =========================================================
  function pageRules() {
    var done = V.rules.filter(function (r) { return r.confirmed; }).length;
    var rows = V.rules.map(function (r) {
      return row([r.id, r.topic, r.text, r.point].join(" "), r.topic, [
        '<span class="mono">' + r.id + "</span>", tag(r.topic, "blue"), esc(r.text),
        '<span class="mono">' + r.point + "</span>",
        '<label class="check"><input type="checkbox" data-rule="' + r.id + '" ' + (r.confirmed ? "checked" : "") + "></label>",
        '<a class="btn small" href="#/' + r.demo + '">去演示</a>'
      ]);
    });
    return pageHead("业务规则清单", "从 PRD 第 6 章挑出 " + V.rules.length + " 条能在原型里验证的规则。评审时逐条勾“确认”。", "") +
      '<div class="grid grid--2" style="margin-bottom:14px">' +
      card("确认进度", "勾选即保存", progressBlock(done, V.rules.length, "已确认 " + done + " / " + V.rules.length + " 条") +
        '<div style="margin-top:10px;font-size:12px;color:#7a869c">没确认的规则 = 业务还没定，开发不应该开工。</div>') +
      card("建议的评审顺序", "40 分钟能过完", '<div class="steps">' +
        [["先过经营总览（5 条）", "统计定义、目标、时效、只读"], ["再过预警（4 条）", "去重、升级、通道"],
        ["最后过边界（6 条）", "与治理平台、与基础支撑"]].map(function (x, i) {
          return '<div class="step"><span class="step__no">' + (i + 1) + '</span><div><div class="step__t">' + x[0] + '</div><div class="step__d">' + x[1] + "</div></div></div>";
        }).join("") + "</div>") +
      "</div>" +
      card("", "", table(["编号", "主题", "规则内容", "功能点", "已确认", { label: "验证", cls: "num" }], rows, "rules-table"));
  }
  function progressBlock(cur, total, text) {
    var pct = Math.round(cur / total * 100);
    return '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span>' + esc(text) + "</span><b>" + pct + "%</b></div>" +
      '<div class="progress"><i style="width:' + pct + '%"></i></div>';
  }
  function pageQuestions() {
    var decided = V.questions.filter(function (q) { return q.decision !== "pending"; }).length;
    var rows = V.questions.map(function (q) {
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
    return pageHead("待确认问题", "12 条问题不拍板，经营总览就只能做成“看起来对”的样子。", '<button class="btn primary" data-act="q-export">导出问题清单</button>') +
      '<div class="grid grid--3" style="margin-bottom:14px">' +
      '<div class="card stat"><div class="stat__label">问题总数</div><div class="stat__value">' + V.questions.length + '</div><div class="stat__delta">来自 PRD 第 11 章</div></div>' +
      '<div class="card stat"><div class="stat__label">已定</div><div class="stat__value">' + decided + '</div><div class="stat__delta">采纳 / 修改 / 不适用</div></div>' +
      '<div class="card stat"><div class="stat__label">未定</div><div class="stat__value">' + (V.questions.length - decided) + '</div><div class="stat__delta down">未定不许开工</div></div>' +
      "</div>" +
      card("", "", table(["编号", "问题", "影响", "建议默认值", "决策人", "结论"], rows, "q-table"));
  }

  // =========================================================
  // ACTIONS
  // =========================================================
  var ACT = {};

  ACT["kpi"] = function (el, id) { openKpi(id); };
  ACT["bar"] = function (el) {
    var name = el.getAttribute("data-name");
    UI.link = name;
    render();
    toast("已筛选：" + name, "趋势图已按该产品线过滤；点 × 可取消筛选（BR-VZ-30）", "success", "BR-VZ-28");
  };
  ACT["unlink"] = function () { UI.link = ""; render(); toast("已清除一起筛选", "图表恢复全量统计定义", "info", "BR-VZ-30"); };
  ACT["drill-pick"] = function (el, _id, _e) {
    var lv = Number(el.getAttribute("data-level"));
    UI.drill.path = UI.drill.path.slice(0, lv).concat([el.getAttribute("data-name")]);
    renderDrill();
  };
  ACT["spc-point"] = function (el, _id, _e) {
    var i = Number(el.getAttribute("data-i"));
    openSpcPoint(i);
  };
  ACT["spc-jump"] = function () {
    toast("跳转质量追溯系统", "携带批次号 B-20261018-07，在新窗口打开", "success", "BR-VZ-44");
  };
  ACT["spc-alert"] = function () {
    toast("异常工单已生成", "派给 SMT-2 线长，2 小时内响应", "success");
    var ev = { id: "EV-" + (100 + V.events.length + 1), rule: "AR-01", metric: "一次合格率", object: "SMT-2", value: "91.4%", time: fmtTime(), status: "待认领", owner: "李娜", escalated: false, note: "质量波动异常触发" };
    V.events.unshift(ev); save(); render();
  };
  ACT["station"] = function (el) {
    stationDrawer(el.getAttribute("data-line"), el.getAttribute("data-name"), el.getAttribute("data-status"));
  };
  ACT["prod-refresh"] = function () {
    if (UI.offline) { toast("当前离线", "恢复网络后再刷新", "warn"); return; }
    var ln = V.production.lines[Math.floor(Math.random() * 3)];
    ln.stations.forEach(function (s) {
      if (Math.random() > 0.85) s.s = ["run", "run", "idle", "fault"][Math.floor(Math.random() * 4)];
    });
    render();
    toast("已刷新", "数据时间 " + fmtTime(), "success", "BR-VZ-41");
  };
  ACT["metric-refs"] = function (el, id) { metricRefs(id); };
  ACT["metric-change"] = function (el, id) {
    var m = V.metrics.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "变更指标统计定义 · " + m.name, sub: m.id + " · 当前 " + m.version,
      body: '<div class="note danger">该指标被 <b>' + m.refs + " 处</b>引用（报表、展示屏、订阅）。变更会同时影响它们（BR-VZ-02）。</div>" +
        '<div class="field" style="margin-top:12px"><label>变更原因<span class="req">*</span></label>' +
        '<textarea class="input" id="f-mreason" rows="3" placeholder="如：统计定义改为剔除返工后复检，需同步通知引用方"></textarea></div>' +
        '<div class="field"><label>生效方式</label><select class="select"><option>次月 1 日生效（推荐）</option><option>立即生效（需重算历史）</option></select></div>' +
        '<div class="note">保存后版本号 +1，并通知所有引用方责任人。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="metric-change-do" data-id="' + id + '">确认变更</button>'
    });
  };
  ACT["metric-change-do"] = function (el, id) {
    var reason = $("#f-mreason") ? $("#f-mreason").value.trim() : "";
    if (!reason) { toast("变更原因必填", "没有原因的统计定义变更，三个月后没人说得清", "error", "BR-VZ-02"); return; }
    var m = V.metrics.filter(function (x) { return x.id === id; })[0];
    m.version = "v" + (parseInt(m.version.replace("v", ""), 10) + 1);
    log("指标变更", m.name + " → " + m.version, "成功", "原因：" + reason + "；影响 " + m.refs + " 处", true);
    save(); closeModal(); render();
    toast("已变更", m.name + " 升为 " + m.version + "，已通知引用方", "success", "BR-VZ-02");
  };
  ACT["metric-new"] = function () {
    openModal({
      title: "新建指标", sub: "统计定义、公式、责任人缺一不可",
      body: '<div class="field"><label>指标名称<span class="req">*</span></label><input class="input" id="f-mname" placeholder="如：客户投诉率"></div>' +
        '<div class="field"><label>业务定义<span class="req">*</span></label><input class="input" id="f-mdef" placeholder="一句话说清它度量什么"></div>' +
        '<div class="field"><label>计算逻辑<span class="req">*</span></label><input class="input" id="f-mformula" placeholder="如：投诉数 / 销量 × 10000"></div>' +
        '<div class="form-row"><div class="field"><label>单位</label><input class="input" id="f-munit" value="%"></div>' +
        '<div class="field"><label>责任人</label><input class="input" id="f-mowner" value="质量部"></div></div>' +
        '<div class="note">BR-VZ-06：没有定义与公式的指标不允许发布。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="metric-new-do">创建草稿</button>'
    });
  };
  ACT["metric-new-do"] = function () {
    var name = val("f-mname"), def = val("f-mdef"), formula = val("f-mformula");
    if (!name || !def || !formula) { toast("信息不完整", "名称、定义、公式必填（BR-VZ-06）", "error", "BR-VZ-06"); return; }
    V.metrics.unshift({ id: "M-" + pad(V.metrics.length + 1), name: name, def: def, formula: formula, unit: val("f-munit") || "%", owner: val("f-mowner") || "—", version: "v1", refs: 0, status: "草稿", sensitive: false });
    save(); closeModal(); render();
    toast("已创建", name + " 进入草稿，需评审后发布", "success");
  };

  ACT["ds-detail"] = function (el, id) { dsDetail(id); };
  ACT["ds-clean"] = function (el, id) { cleanRun(id); };
  ACT["clean-enable"] = function (el, id) {
    log("清洗规则启用", id, "成功", "抽样 100 条试跑通过；1 条失败进错误清单", false);
    save(); closeModal();
    toast("规则已启用", "只作用于分析副本，不改源系统（BR-VZ-12）", "success", "BR-VZ-11");
  };
  ACT["qr-toggle"] = function (el, id) {
    var r = V.qualityRules.filter(function (x) { return x.id === id; })[0];
    r.status = r.status === "启用" ? "停用" : "启用";
    save(); render();
    toast("已" + r.status, r.id + " " + r.dim + "规则", "info");
  };

  ACT["rep-add"] = function (el) {
    var field = el.getAttribute("data-field");
    addField(FIELDS[field].type === "measure" ? "values" : "rows", field);
  };
  ACT["rep-remove"] = function (el) {
    var zone = el.getAttribute("data-zone"), field = el.getAttribute("data-field");
    UI.report[zone] = UI.report[zone].filter(function (f) { return f !== field; });
    render();
  };
  ACT["rep-reset"] = function () {
    UI.report = { rows: [], cols: [], values: ["amount"], chart: "表格", name: "" };
    render();
    toast("已清空", "回到初始状态", "info");
  };
  ACT["rep-save"] = function () {
    var r = UI.report;
    if (!r.values.length) { toast("没有值字段", "报表至少要有一个度量", "error", "BR-VZ-24"); return; }
    openModal({
      title: "保存报表", sub: "保存后为草稿，发布需审核",
      body: '<div class="field"><label>报表名称<span class="req">*</span></label><input class="input" id="f-rname" placeholder="如：区域销售额对比"></div>' +
        '<div class="note">BR-VZ-24：图表必须标注标题、单位、截止时间、来源；BR-VZ-65：发布需审核统计定义、权限、性能、敏感字段。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="rep-save-do">保存草稿</button>'
    });
  };
  ACT["rep-save-do"] = function () {
    var name = val("f-rname");
    if (!name) { toast("报表名称必填", "", "error"); return; }
    V.reports.unshift({ id: uid("RPT", V.reports), name: name, rows: UI.report.rows.length, chart: UI.report.chart, status: "草稿", owner: "王分析", updated: fmtDate() });
    save(); closeModal(); render();
    toast("已保存", name + " 为草稿；发布需要管理员审核（BR-VZ-65）", "success", "BR-VZ-65");
  };

  ACT["scr-add"] = function (el, _id) { addComp(el.getAttribute("data-type")); };
  ACT["scr-sel"] = function (el, id) { UI.screen.sel = id; render(); };
  ACT["scr-save"] = function () {
    var sc = screenOf();
    var c = sc.comps.filter(function (x) { return x.id === UI.screen.sel; })[0];
    if (!c) return;
    c.title = val("p-title") || c.title;
    c.unit = val("p-unit");
    c.source = val("p-source");
    save(); render();
    toast("属性已保存", c.id + " " + c.title, "success");
  };
  ACT["scr-del"] = function (el, id) {
    var sc = screenOf();
    sc.comps = sc.comps.filter(function (c) { return c.id !== id; });
    UI.screen.sel = "";
    save(); render();
    toast("板块已删除", "", "info");
  };
  ACT["scr-preview"] = function () {
    var sc = screenOf();
    var comps = sc.comps.map(function (c) {
      var value = { "营收": "12,860", "产量": "312,480", "一次合格率": "93.2", "当班产量": "18,420" }[c.title] || "—";
      var inner = c.type === "kpi"
        ? '<div class="ct">' + esc(c.title) + '</div><div class="cv">' + value + '</div><div class="cu">' + esc(c.unit) + "</div>"
        : '<div class="ct">' + esc(c.title) + '</div><div class="mm-chart">' + [42, 62, 48, 78, 56, 88, 66].map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("") + "</div>";
      return '<div class="comp" style="left:' + c.x + "%;top:" + c.y + "%;width:" + c.w + "%;height:" + c.h + '%">' + inner + "</div>";
    }).join("");
    openModal({
      wide: true, title: "展示屏预览 · " + sc.name, sub: UI.screen.res + " · 只读展示，无任何配置入口",
      body: '<div class="canvas-frame"><div class="canvas" style="aspect-ratio:' + (UI.screen.res.indexOf("3840") > -1 ? "32 / 9" : "16 / 9") + '">' + comps + "</div></div>" +
        '<div class="note" style="margin-top:12px">BR-VZ-55：展示页不得弹出任何配置弹窗，避免现场误操作。</div>',
      footer: '<button class="btn primary" data-close="modal">关闭预览</button>'
    });
  };
  ACT["scr-publish"] = publishScreen;
  ACT["scr-approve"] = function () {
    var sc = screenOf();
    sc.status = "已发布"; sc.version = "v" + (parseInt(sc.version.replace("v", ""), 10) + 1); sc.updated = fmtDate();
    log("展示屏发布", sc.name + " → " + sc.version, "成功", "审核通过；历史版本可回滚", false);
    save(); closeModal(); render();
    toast("已发布", sc.name + " 升为 " + sc.version, "success", "BR-VZ-51");
  };

  ACT["ev-trigger"] = function () {
    var rule = V.alertRules[0];
    var candidates = ["SMT-2", "组装线", "包装线"];
    var target = null;
    for (var i = 0; i < candidates.length; i++) {
      var busy = V.events.some(function (e) {
        return e.rule === rule.id && e.object === candidates[i] && (e.status === "待认领" || e.status === "处理中");
      });
      if (!busy) { target = candidates[i]; break; }
    }
    if (!target) {
      toast("已去重，不重复推送", "同一指标同一对象 24 小时内只推一次（BR-VZ-70）", "warn", "BR-VZ-70");
      return;
    }
    var ev = { id: "EV-" + (100 + V.events.length + 1), rule: rule.id, metric: rule.metric, object: target, value: "91.4%", time: fmtTime(), status: "待认领", owner: "李娜", escalated: false, note: "" };
    V.events.unshift(ev); save(); render();
    toast("预警已推送", "对象：" + target + "；企业微信 + 短信 → 李娜（BR-VZ-71）", "success", "BR-VZ-69");
  };
  ACT["ev-claim"] = function (el, id) {
    var e = V.events.filter(function (x) { return x.id === id; })[0];
    e.status = "处理中"; e.owner = V.actor.split("（")[0];
    save(); render();
    toast("已认领", "请在 4 小时内填写原因并关闭", "success");
  };
  ACT["ev-close"] = function (el, id) {
    openModal({
      title: "关闭预警", sub: "必须填写处理措施",
      body: '<div class="field"><label>处理措施<span class="req">*</span></label><textarea class="input" id="f-evnote" rows="3" placeholder="如：更换回流焊温区热电偶，复测连续 3 批合格"></textarea></div>' +
        '<div class="note">关闭后 7 天内同指标不重复推送，除非恶化超过 20%。</div>',
      footer: '<button class="btn" data-close="modal">取消</button><button class="btn primary" data-act="ev-close-do" data-id="' + id + '">确认关闭</button>'
    });
  };
  ACT["ev-close-do"] = function (el, id) {
    var note = val("f-evnote");
    if (!note) { toast("处理措施必填", "没有措施的关闭等于没处理", "error", "BR-VZ-70"); return; }
    var e = V.events.filter(function (x) { return x.id === id; })[0];
    e.status = "已关闭"; e.note = note;
    save(); closeModal(); render();
    toast("已关闭", "处理措施已记录，进入闭环", "success");
  };
  ACT["ev-false"] = function (el, id) {
    var e = V.events.filter(function (x) { return x.id === id; })[0];
    e.status = "误报";
    save(); render();
    toast("已标记误报", "误报率会进入月度统计", "warn");
  };
  ACT["ev-fast"] = function () {
    var n = 0;
    V.events.forEach(function (e) { if (e.status === "待认领" && !e.escalated) { e.escalated = true; n++; } });
    save(); render();
    if (n) toast("已快进 2 小时", n + " 条未认领预警升级至上级（BR-VZ-70）", "warn", "BR-VZ-70");
    else toast("没有可升级的预警", "待认领的才会升级", "info");
  };

  ACT["ln-node"] = function (el, id) {
    UI.lineage.node = id;
    render();
    var n = V.assets.nodes.filter(function (x) { return x.id === id; })[0];
    var d = V.assets.detail[id] || {};
    openDrawer({
      title: n.name, sub: n.sub + " · " + id,
      body: (id === "n9" ? tag("无责任人", "red") + '<div style="height:12px"></div>' : "") +
        kv([["负责人", d.owner || "（未指定）"], ["数据量", d.rows || "—"], ["敏感级别", d.sensitive || "—"],
          ["字段/指标", d.fields || "—"], ["更新频率", d.update || "—"], ["下游应用", d.report || "—"]]) +
        '<div class="note" style="margin-top:12px">BR-VZ-59：来源关系以数据治理平台登记为准，本系统只读展示。</div>' +
        '<div class="rules-inline" style="margin-top:12px">' + ["BR-VZ-58", "BR-VZ-59"].map(rule).join("") + "</div>"
    });
  };
  ACT["ln-impact"] = function () {
    openModal({
      wide: true,
      title: "上游字段变更影响分析", sub: "假设 DWD 明细层「检验结果」字段类型变更",
      body: '<div class="note warn">变更会影响以下 6 个对象，请通知责任人确认（BR-VZ-60）：</div>' +
        table(["对象", "类型", "责任人", "影响说明"], [
          row("质量检验明细", "", ["质量检验明细", "数据表", "李娜", "字段类型变更，需重跑清洗规则"]),
          row("经营经营总览", "", ["经营经营总览", "展示屏", "王分析", "合格率指标可能失真"]),
          row("质量分析", "", ["质量分析", "实时状态", "李娜", "质量波动图需重算"]),
          row("月度质量分析", "", ["月度质量分析", "报表", "李娜", "历史对比统计定义变化"]),
          row("移动端 核心指标", "", ["移动端 核心指标", "订阅", "王分析", "推送统计定义需同步"]),
          row("数据质量评分卡", "", ["质量评分卡", "报表", "数据组", "评分权重需复核"])
        ]),
      footer: '<button class="btn" data-close="modal">关闭</button><button class="btn primary" data-act="ln-export">导出影响清单</button>'
    });
  };
  ACT["ln-export"] = function () {
    log("影响分析导出", "检验结果字段变更影响清单", "成功", "6 个对象；含责任人", false);
    save(); closeModal();
    toast("已导出", "影响清单已生成，可发给各责任人确认", "success", "BR-VZ-60");
  };

  ACT["ex-submit"] = function () {
    var obj = $("#ex-obj").value, reason = val("ex-reason");
    var sens = $("#ex-sens").checked;
    if (!reason) { toast("导出理由必填", "审批人要判断你为什么要这些数据", "error", "BR-VZ-65"); return; }
    var id = uid("EX", V.exports);
    V.exports.unshift({
      id: id, object: obj, fields: sens ? "含客户名称 / 手机号" : "无敏感字段", rows: 1200,
      applicant: V.actor.split("（")[0], status: sens ? "待审批" : "已批准", time: fmtTime(), reason: reason,
      watermark: (sens ? "—" : V.actor.split("（")[0] + " / " + fmtDate() + " / " + id)
    });
    save(); render();
    toast(sens ? "已提交审批" : "已批准", sens ? "含敏感字段，等待安全管理员审批（BR-VZ-65）" : "无敏感字段，可直接下载", sens ? "warn" : "success", "BR-VZ-65");
  };
  ACT["ex-review"] = function (el, id) {
    var e = V.exports.filter(function (x) { return x.id === id; })[0];
    openModal({
      title: "审批导出申请 · " + e.id, sub: e.object + " · " + e.applicant,
      body: kv([["导出对象", e.object], ["字段", e.fields], ["行数", num(e.rows)], ["理由", e.reason]]) +
        '<div class="field" style="margin-top:12px"><label>审批意见</label><textarea class="input" id="f-exnote" rows="3" placeholder="拒绝请写清原因"></textarea></div>',
      footer: '<button class="btn" data-close="modal">取消</button>' +
        '<button class="btn danger" data-act="ex-reject" data-id="' + id + '">拒绝</button>' +
        '<button class="btn primary" data-act="ex-approve" data-id="' + id + '">批准</button>'
    });
  };
  ACT["ex-approve"] = function (el, id) {
    var e = V.exports.filter(function (x) { return x.id === id; })[0];
    e.status = "已批准"; e.watermark = e.applicant + " / " + fmtDate() + " / " + e.id;
    log("导出审批", e.id + " " + e.object, "通过", "水印已生成", true);
    save(); closeModal(); render();
    toast("已批准", "文件下载时加带水印", "success", "BR-VZ-65");
  };
  ACT["ex-reject"] = function (el, id) {
    var e = V.exports.filter(function (x) { return x.id === id; })[0];
    var note = val("f-exnote");
    if (!note) { toast("拒绝必须写原因", "", "error", "BR-VZ-65"); return; }
    e.status = "已拒绝"; e.watermark = "—";
    log("导出审批", e.id + " " + e.object, "拒绝", note, true);
    save(); closeModal(); render();
    toast("已拒绝", note, "warn");
  };
  ACT["ex-download"] = function (el, id) {
    var e = V.exports.filter(function (x) { return x.id === id; })[0];
    log("导出下载", e.id + " " + e.object, "成功", "水印：" + e.watermark, true);
    save();
    toast("开始下载", "文件水印：" + e.watermark, "success");
  };

  ACT["q-export"] = function () {
    var lines = ["# 数据可视化系统 · 待确认问题清单", "", "导出时间：" + fmtTime(), "",
      "| 编号 | 问题 | 影响 | 建议默认值 | 决策人 | 结论 |", "| --- | --- | --- | --- | --- | --- |"];
    V.questions.forEach(function (q) {
      var d = { pending: "待讨论", accept: "采纳建议", change: "需要修改", reject: "不适用" }[q.decision] || "待讨论";
      lines.push("| " + q.id + " | " + q.text + " | " + q.impact + " | " + q.suggest + " | " + q.owner + " | " + d + " |");
    });
    var blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "数据可视化系统-待确认问题清单.md";
    a.click();
    toast("已导出", "Markdown 已开始下载", "success");
  };

  // =========================================================
  // bindings / router
  // =========================================================
  var ROUTES = {
    dashboard: { t: "经营总览", r: pageDashboard },
    quality: { t: "质量分析", r: pageQuality },
    production: { t: "生产实时状态", r: pageProduction },
    sales: { t: "销售分析", r: pageSales },
    report: { t: "报表制作", r: pageReport },
    datasets: { t: "数据表与质量", r: pageDatasets },
    metrics: { t: "指标定义", r: pageMetrics },
    screen: { t: "展示屏设计", r: pageScreen },
    alerts: { t: "预警提醒", r: pageAlerts },
    lineage: { t: "数据来源关系", r: pageLineage },
    exports: { t: "导出审批", r: pageExports },
    rules: { t: "业务规则清单", r: pageRules },
    questions: { t: "待确认问题", r: pageQuestions }
  };
  function routeKey() {
    var h = location.hash.replace(/^#\/?/, "");
    return ROUTES[h] ? h : "dashboard";
  }
  function render() {
    var key = routeKey();
    renderNav(key);
    $("#crumb").innerHTML = "<span>数据可视化</span><span class=\"sep\">/</span><b>" + ROUTES[key].t + "</b>";
    $("#content").innerHTML = ROUTES[key].r();
    bind();
    window.scrollTo(0, 0);
    if (EMBED) {
      try { parent.postMessage({ type: "proto-route", module: "viz", route: key, title: ROUTES[key].t }, "*"); } catch (e) { }
    }
  }

  function bind() {
    // 通用开关
    var d = $("#delay-toggle");
    if (d) d.addEventListener("change", function () {
      UI.delay = d.checked; render();
      toast(UI.delay ? "已模拟数据延迟" : "已恢复实时", UI.delay ? "指标卡显示延迟标识，同比不再展示（BR-VZ-38）" : "数据截止时间恢复", UI.delay ? "warn" : "success", "BR-VZ-38");
    });
    var of = $("#offline-toggle");
    if (of) of.addEventListener("change", function () {
      UI.offline = of.checked; render();
      toast(UI.offline ? "已模拟断网" : "连接已恢复", UI.offline ? "保留最后数据并显示“数据超时”（BR-VZ-54）" : "自动重连并补数，无需手动刷新", UI.offline ? "warn" : "success", "BR-VZ-54");
    });
    var m = $("#mask-toggle");
    if (m) m.addEventListener("change", function () {
      UI.mask = m.checked; render();
      if (UI.mask) toast("客户名称已脱敏", "对外展示用简称（BR-VZ-47）", "info", "BR-VZ-47");
    });
    // 分段控件
    $$("[data-seg]").forEach(function (wrap) {
      var key = wrap.getAttribute("data-seg");
      $$("button", wrap).forEach(function (b) {
        b.addEventListener("click", function () {
          var v = b.getAttribute("data-val");
          if (key === "unit") { UI.unit = v; render(); toast("单位已切换", "当前：" + v + "（BR-VZ-46）", "info", "BR-VZ-46"); }
          else if (key === "rchart") { UI.report.chart = v; render(); }
          else if (key === "sres") { UI.screen.res = v; render(); }
          else if (key === "ldir") { UI.lineage.dir = v; render(); }
        });
      });
    });
    // 拖拽
    $$(".field-chip[draggable]").forEach(function (ch) {
      ch.addEventListener("dragstart", function (e) { e.dataTransfer.setData("text/plain", ch.getAttribute("data-field")); });
    });
    $$(".drop-zone").forEach(function (z) {
      z.addEventListener("dragover", function (e) { e.preventDefault(); z.classList.add("over"); });
      z.addEventListener("dragleave", function () { z.classList.remove("over"); });
      z.addEventListener("drop", function (e) {
        e.preventDefault(); z.classList.remove("over");
        var f = e.dataTransfer.getData("text/plain");
        if (f) addField(z.getAttribute("data-zone"), f);
      });
    });
    // 规则勾选 & 问题结论
    $$("input[data-rule]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var r = V.rules.filter(function (x) { return x.id === cb.getAttribute("data-rule"); })[0];
        r.confirmed = cb.checked; save();
        toast(r.confirmed ? "已确认" : "已取消确认", r.id, r.confirmed ? "success" : "info");
      });
    });
    $$("select[data-q]").forEach(function (s) {
      s.addEventListener("change", function () {
        var q = V.questions.filter(function (x) { return x.id === s.getAttribute("data-q"); })[0];
        q.decision = s.value; save();
        toast("结论已保存", q.id + " → " + (s.options[s.selectedIndex] || {}).text, "success");
      });
    });
    // 密码/数字等无
  }

  function val(id) { var el = document.getElementById(id); return el ? String(el.value || "").trim() : ""; }

  document.addEventListener("click", function (e) {
    var isOverlay = e.target.classList && e.target.classList.contains("overlay") && e.target.getAttribute("data-close") === "modal";
    if (isOverlay) { closeModal(); return; }
    var isScrim = e.target.classList && e.target.classList.contains("scrim") && e.target.getAttribute("data-close") === "drawer";
    if (isScrim) { closeDrawer(); return; }
    var el = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!el) return;
    var act = el.getAttribute("data-act"), id = el.getAttribute("data-id");
    if (ACT[act]) { e.preventDefault(); ACT[act](el, id, e); }
  });
  window.addEventListener("hashchange", function () { closeModal(); closeDrawer(); render(); });

  // 生产实时状态刷新提示
  setInterval(function () {
    var tip = document.getElementById("refresh-tip");
    if (!tip) return;
    UI.refreshLeft = (UI.refreshLeft == null ? 10 : UI.refreshLeft) - 1;
    if (UI.refreshLeft <= 0) UI.refreshLeft = 10;
    tip.textContent = UI.refreshLeft + " 秒后刷新";
  }, 1000);

  var EMBED = /[?&]embed=1/.test(location.search);
  if (EMBED) document.body.classList.add("embed");
  if (!EMBED) {
    var hint = document.createElement("a");
    hint.className = "unified-hint";
    hint.href = "../prototype-all/index.html#/viz/dashboard";
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
