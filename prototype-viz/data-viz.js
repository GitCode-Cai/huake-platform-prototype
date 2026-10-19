/* 数据可视化系统 · 演示数据（全部虚构） */
(function () {
  function series(n, base, amp, seed) {
    var out = [], s = seed || 7;
    for (var i = 0; i < n; i++) {
      s = (s * 9301 + 49297) % 233280;
      out.push(+(base + (s / 233280 - 0.5) * amp).toFixed(1));
    }
    return out;
  }

  var months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  var spc = series(36, 96.2, 2.4, 11);
  spc[11] = 99.2; spc[22] = 92.1; spc[23] = 92.6; spc[30] = 91.8;

  window.VZ = {
    actor: "王分析（业务分析师）",
    cutoff: "2026-10-19 08:00",
    sources: ["生产管理系统", "质量追溯系统", "供应链与计划协同", "ERP"],

    kpis: [
      { id: "K1", domain: "财务", name: "营收", value: 12860, unit: "万元", target: 13500, delta: -4.7, better: "up",
        source: "ERP", owner: "财务部 / 周敏", formula: "已确认收入合计（含税）", updated: "今日 06:30",
        spark: series(10, 1300, 240, 3),
        drill: [{ dim: "区域", items: [{ name: "华南", value: 6120 }, { name: "华东", value: 3480 }, { name: "华北", value: 2180 }, { name: "其他", value: 1080 }] },
        { dim: "产品线", items: [{ name: "SMT 模组", value: 7200 }, { name: "组装整机", value: 4100 }, { name: "配件", value: 1560 }] }] },
      { id: "K2", domain: "生产", name: "产量", value: 312480, unit: "件", target: 320000, delta: -2.3, better: "up",
        source: "生产管理系统", owner: "制造部 / 李强", formula: "各产线完工入库数量合计", updated: "今日 07:40",
        spark: series(10, 32000, 9000, 5),
        drill: [{ dim: "产线", items: [{ name: "SMT-1", value: 128400 }, { name: "SMT-2", value: 108200 }, { name: "组装线", value: 75880 }] },
        { dim: "班次", items: [{ name: "白班", value: 178200 }, { name: "中班", value: 98000 }, { name: "夜班", value: 36280 }] }] },
      { id: "K3", domain: "供应链", name: "交付准时率", value: 96.4, unit: "%", target: 98, delta: -1.6, better: "up",
        source: "供应链与计划协同", owner: "供应链 / 赵敏", formula: "按期交付订单数 / 应交付订单数", updated: "今日 07:00",
        spark: series(10, 96, 3, 9),
        drill: [{ dim: "客户", items: [{ name: "A 客户", value: 98.2 }, { name: "B 客户", value: 95.1 }, { name: "C 客户", value: 92.4 }, { name: "其他", value: 97.0 }] },
        { dim: "延迟原因", items: [{ name: "物料缺料", value: 42 }, { name: "产能不足", value: 28 }, { name: "物流", value: 18 }, { name: "其他", value: 12 }] }] },
      { id: "K4", domain: "质量", name: "一次合格率", value: 93.2, unit: "%", target: 95, delta: -1.8, better: "up", warn: true,
        source: "质量追溯系统", owner: "质量部 / 李娜", formula: "一次检验合格数 / 检验总数", updated: "今日 06:50",
        spark: series(10, 95, 3.2, 13),
        drill: [{ dim: "产品线", items: [{ name: "SMT-1", value: 96.2 }, { name: "SMT-2", value: 91.4 }, { name: "组装线", value: 94.8 }, { name: "包装线", value: 98.1 }] },
        { dim: "工序", items: [{ name: "印刷", value: 96.1 }, { name: "贴片", value: 92.3 }, { name: "回流焊", value: 89.7 }, { name: "检测", value: 97.2 }] },
        { dim: "批次", items: [{ name: "B-20261018-07", value: 88.4, extra: "SMT-2 / 回流焊" }, { name: "B-20261018-05", value: 90.1, extra: "SMT-2 / 贴片" }, { name: "B-20261017-12", value: 91.6, extra: "SMT-2 / 回流焊" }, { name: "B-20261017-09", value: 95.8, extra: "SMT-1 / 印刷" }] }] },
      { id: "K5", domain: "供应链", name: "库存周转", value: 5.8, unit: "次", target: 6, delta: 0.3, better: "up",
        source: "供应链与计划协同", owner: "供应链 / 赵敏", formula: "销货成本 / 平均库存", updated: "今日 07:00",
        spark: series(10, 5.8, 0.8, 17),
        drill: [{ dim: "仓库", items: [{ name: "原料仓", value: 7.2 }, { name: "半成品仓", value: 5.1 }, { name: "成品仓", value: 4.6 }] },
        { dim: "物料大类", items: [{ name: "电子料", value: 6.8 }, { name: "结构件", value: 5.2 }, { name: "包材", value: 7.9 }] }] },
      { id: "K6", domain: "能耗", name: "单位能耗", value: 0.82, unit: "kWh/件", target: 0.85, delta: 3.5, better: "down",
        source: "智慧能耗管理系统", owner: "设备部 / 陈工", formula: "总用电量 / 完工数量", updated: "今日 08:00",
        spark: series(10, 0.84, 0.12, 21),
        drill: [{ dim: "产线", items: [{ name: "SMT-1", value: 0.71 }, { name: "SMT-2", value: 0.88 }, { name: "组装线", value: 0.94 }] },
        { dim: "分项", items: [{ name: "空调", value: 0.31 }, { name: "空压", value: 0.22 }, { name: "设备", value: 0.29 }] }] }
    ],

    trend: { labels: months, values: [980, 1020, 1180, 1240, 1310, 1280, 1360, 1420, 1380, 1350, 1320, 1286], unit: "万元" },

    productLines: [
      { name: "SMT-1", value: 3120, oee: 86.2 },
      { name: "SMT-2", value: 2680, oee: 78.4 },
      { name: "组装线", value: 2140, oee: 82.1 },
      { name: "包装线", value: 1620, oee: 91.3 }
    ],

    quality: {
      spc: spc,
      limits: { ucl: 98.6, cl: 96.0, lcl: 93.4 },
      anomalies: [11, 22, 23, 30],
      anomalyRules: [
        "第 12 点：超出 3σ 控制上限（99.2% > 98.6%）",
        "第 23 点：连续 2 点超 2σ（同侧）",
        "第 24 点：连续 2 点超 2σ（同侧）",
        "第 31 点：连续 7 点单侧下降"
      ],
      pareto: [
        { name: "焊点虚焊", n: 182 }, { name: "元件偏移", n: 121 }, { name: "外观划伤", n: 86 },
        { name: "尺寸超差", n: 54 }, { name: "脏污", n: 31 }, { name: "其他", n: 16 }
      ],
      fpy: { labels: ["W40", "W41", "W42", "W43", "W44", "W45", "W46", "W47", "W48", "W49", "W50", "W51"],
        values: [95.1, 95.4, 94.8, 95.6, 94.2, 94.9, 95.3, 94.1, 93.8, 93.5, 93.2, 93.2] }
    },

    production: {
      shift: { output: 18420, target: 19200, takt: 42, oee: 82.4, alarms: 2 },
      lines: [
        { name: "SMT-1", stations: [{ n: "上料", s: "run" }, { n: "印刷", s: "run" }, { n: "贴片", s: "run" }, { n: "回流焊", s: "run" }, { n: "AOI", s: "run" }, { n: "分板", s: "idle" }, { n: "测试", s: "run" }, { n: "入库", s: "run" }] },
        { name: "SMT-2", stations: [{ n: "上料", s: "run" }, { n: "印刷", s: "run" }, { n: "贴片", s: "run" }, { n: "回流焊", s: "fault" }, { n: "AOI", s: "idle" }, { n: "分板", s: "run" }, { n: "测试", s: "run" }, { n: "入库", s: "offline" }] },
        { name: "组装线", stations: [{ n: "上料", s: "run" }, { n: "装配", s: "run" }, { n: "锁付", s: "run" }, { n: "点胶", s: "idle" }, { n: "检测", s: "run" }, { n: "包装", s: "run" }, { n: "贴标", s: "run" }, { n: "入库", s: "run" }] }
      ]
    },

    sales: {
      unit: "万元",
      regions: [{ name: "华南", value: 6120 }, { name: "华东", value: 3480 }, { name: "华北", value: 2180 }, { name: "西南", value: 760 }, { name: "其他", value: 320 }],
      funnel: [{ stage: "线索", n: 1200 }, { stage: "商机", n: 640 }, { stage: "报价", n: 380 }, { stage: "中标", n: 210 }, { stage: "成交", n: 168 }],
      customers: [{ name: "广州华创电子有限公司", short: "A 客户", value: 2860 }, { name: "东莞立信精密制造有限公司", short: "B 客户", value: 2140 },
        { name: "深圳联启科技有限公司", short: "C 客户", value: 1780 }, { name: "佛山恒达实业有限公司", short: "D 客户", value: 1240 },
        { name: "惠州新宇电子有限公司", short: "E 客户", value: 980 }]
    },

    datasets: [
      { id: "DS-01", name: "质量检验明细", rows: "1,284,000", updated: "10-19 06:50", owner: "李娜", sensitivity: "内部", quality: 94, status: "已发布", fields: 26 },
      { id: "DS-02", name: "生产工单与报工", rows: "486,200", updated: "10-19 07:40", owner: "王强", sensitivity: "内部", quality: 97, status: "已发布", fields: 31 },
      { id: "DS-03", name: "销售订单", rows: "128,400", updated: "10-19 06:30", owner: "赵敏", sensitivity: "敏感", quality: 91, status: "已发布", fields: 22 },
      { id: "DS-04", name: "设备状态时序", rows: "8,640,000", updated: "10-19 08:00", owner: "陈工", sensitivity: "内部", quality: 99, status: "已发布", fields: 14 },
      { id: "DS-05", name: "能耗分项", rows: "2,160,000", updated: "10-19 08:00", owner: "陈工", sensitivity: "公开", quality: 96, status: "已停用", fields: 12 },
      { id: "DS-06", name: "客户主数据", rows: "12,800", updated: "10-18 22:00", owner: "赵敏", sensitivity: "敏感", quality: 88, status: "已发布", fields: 18 }
    ],

    qualityRules: [
      { id: "QR-01", dim: "完整性", target: "质量检验明细.检验结果", rule: "非空", hit: 128, status: "启用" },
      { id: "QR-02", dim: "唯一性", target: "质量检验明细.批次号+工序", rule: "组合唯一", hit: 6, status: "启用" },
      { id: "QR-03", dim: "一致性", target: "工单.完工数 vs 报工汇总", rule: "差异 ≤0.5%", hit: 14, status: "启用" },
      { id: "QR-04", dim: "时效性", target: "设备状态时序", rule: "延迟 ≤5 分钟", hit: 2, status: "启用" },
      { id: "QR-05", dim: "逻辑性", target: "销售订单.金额", rule: ">0 且 ≤合同额", hit: 9, status: "停用" }
    ],

    profile: [
      { field: "检验结果", nullRate: 1.2, dupRate: 0, formatErr: 0.4, note: "128 条为空" },
      { field: "批次号", nullRate: 0.1, dupRate: 0.6, formatErr: 1.8, note: "格式不统一（含短横线）" },
      { field: "客户编码", nullRate: 0, dupRate: 0, formatErr: 4.2, note: "旧编码未映射" },
      { field: "检验时间", nullRate: 0.3, dupRate: 0, formatErr: 0.2, note: "跨时区" }
    ],

    metrics: [
      { id: "M-001", name: "一次检验合格率", def: "首次检验即合格的批次占比", formula: "合格数 / 检验总数", unit: "%", owner: "质量部", version: "v3", refs: 6, status: "已发布", sensitive: false },
      { id: "M-002", name: "交付准时率", def: "按承诺日期交付的订单占比", formula: "按期交付数 / 应交付数", unit: "%", owner: "供应链", version: "v2", refs: 4, status: "已发布", sensitive: false },
      { id: "M-003", name: "设备综合效率 设备综合效率", def: "时间开动率×性能开动率×合格品率", formula: "稼动×性能×合格率", unit: "%", owner: "制造部", version: "v1", refs: 3, status: "已发布", sensitive: false },
      { id: "M-004", name: "单位产品能耗", def: "每件完工产品的综合用电量", formula: "总用电量 / 完工数", unit: "kWh/件", owner: "设备部", version: "v1", refs: 2, status: "已发布", sensitive: false },
      { id: "M-005", name: "库存周转次数", def: "一定期间内存货周转的次数", formula: "销货成本 / 平均库存", unit: "次", owner: "供应链", version: "v1", refs: 2, status: "已发布", sensitive: false },
      { id: "M-006", name: "营收", def: "已确认收入（含税）", formula: "SUMM(确认收入)", unit: "万元", owner: "财务部", version: "v4", refs: 8, status: "已发布", sensitive: true },
      { id: "M-007", name: "客户投诉率", def: "每万台产品的客户投诉数", formula: "投诉数 / 销量 × 10000", unit: "件/万台", owner: "质量部", version: "v1", refs: 1, status: "草稿", sensitive: false },
      { id: "M-008", name: "计划达成率", def: "实际产量与计划产量之比", formula: "实际产量 / 计划产量", unit: "%", owner: "制造部", version: "v2", refs: 3, status: "已发布", sensitive: false }
    ],

    alertRules: [
      { id: "AR-01", metric: "一次合格率", cond: "低于 95% 且连续 2 天", level: "高", channels: ["企业微信", "短信"], owner: "质量部" },
      { id: "AR-02", metric: "交付准时率", cond: "低于 96%", level: "中", channels: ["企业微信"], owner: "供应链" },
      { id: "AR-03", metric: "设备 设备综合效率", cond: "低于 75% 持续 2 小时", level: "高", channels: ["企业微信", "短信"], owner: "制造部" },
      { id: "AR-04", metric: "单位能耗", cond: "高于 0.85 kWh/件", level: "低", channels: ["站内信"], owner: "设备部" }
    ],

    events: [
      { id: "EV-101", rule: "AR-01", metric: "一次合格率", object: "SMT-2", value: "91.4%", time: "2026-10-19 07:00", status: "待认领", owner: "李娜", escalated: false, note: "" },
      { id: "EV-102", rule: "AR-03", metric: "设备 设备综合效率", object: "SMT-2 / 回流焊", value: "71.2%", time: "2026-10-19 06:20", status: "处理中", owner: "王强", escalated: false, note: "已停机检修" },
      { id: "EV-103", rule: "AR-02", metric: "交付准时率", object: "C 客户", value: "92.4%", time: "2026-10-18 17:10", status: "已关闭", owner: "赵敏", escalated: false, note: "物流延迟，已补发" },
      { id: "EV-104", rule: "AR-01", metric: "一次合格率", object: "SMT-1", value: "94.1%", time: "2026-10-18 08:00", status: "误报", owner: "李娜", escalated: false, note: "换线首件数据异常" },
      { id: "EV-105", rule: "AR-04", metric: "单位能耗", object: "组装线", value: "0.94", time: "2026-10-17 15:40", status: "已关闭", owner: "陈工", escalated: false, note: "空调设定错误，已调整" }
    ],

    reports: [
      { id: "RPT-01", name: "月度质量分析", rows: 12, chart: "柱状", status: "已发布", owner: "王分析", updated: "2026-10-08" },
      { id: "RPT-02", name: "产线 设备综合效率 周报", rows: 8, chart: "折线", status: "待审核", owner: "王分析", updated: "2026-10-15" }
    ],

    reportData: [
      { region: "华南", product: "SMT 模组", month: "7月", amount: 860, qty: 4200 },
      { region: "华南", product: "组装整机", month: "7月", amount: 520, qty: 1800 },
      { region: "华南", product: "SMT 模组", month: "8月", amount: 910, qty: 4500 },
      { region: "华南", product: "组装整机", month: "8月", amount: 560, qty: 1900 },
      { region: "华东", product: "SMT 模组", month: "7月", amount: 640, qty: 3100 },
      { region: "华东", product: "组装整机", month: "7月", amount: 380, qty: 1300 },
      { region: "华东", product: "SMT 模组", month: "8月", amount: 690, qty: 3300 },
      { region: "华东", product: "组装整机", month: "8月", amount: 410, qty: 1400 },
      { region: "华北", product: "SMT 模组", month: "7月", amount: 420, qty: 2000 },
      { region: "华北", product: "组装整机", month: "7月", amount: 260, qty: 900 },
      { region: "华北", product: "SMT 模组", month: "8月", amount: 460, qty: 2200 },
      { region: "华北", product: "组装整机", month: "8月", amount: 280, qty: 950 }
    ],

    screens: [
      { id: "SC-01", name: "经营总览展示屏", res: "1920 × 1080", status: "已发布", version: "v3", updated: "2026-10-12",
        comps: [
          { id: "C1", type: "kpi", title: "营收", unit: "万元", source: "指标库 / 营收", x: 3, y: 8, w: 22, h: 24 },
          { id: "C2", type: "kpi", title: "产量", unit: "件", source: "指标库 / 产量", x: 28, y: 8, w: 22, h: 24 },
          { id: "C3", type: "chart", title: "月度营收趋势", unit: "万元", source: "数据表 / 销售订单", x: 3, y: 40, w: 47, h: 44 },
          { id: "C4", type: "kpi", title: "一次合格率", unit: "%", source: "指标库 / 合格率", x: 54, y: 8, w: 22, h: 24 }
        ] },
      { id: "SC-02", name: "车间实时实时状态", res: "2560 × 1440", status: "草稿", version: "v1", updated: "2026-10-18",
        comps: [
          { id: "C1", type: "kpi", title: "当班产量", unit: "件", source: "数据表 / 报工", x: 4, y: 10, w: 24, h: 26 },
          { id: "C2", type: "chart", title: "产线节拍", unit: "秒", source: "数据表 / 设备状态", x: 32, y: 10, w: 60, h: 40 }
        ] }
    ],

    assets: {
      nodes: [
        { id: "n1", name: "生产管理系统", layer: 0, sub: "源系统" },
        { id: "n2", name: "质量追溯系统", layer: 0, sub: "源系统" },
        { id: "n3", name: "供应链协同", layer: 0, sub: "源系统" },
        { id: "n4", name: "ODS 贴源层", layer: 1, sub: "数据底座" },
        { id: "n5", name: "DWD 明细层", layer: 2, sub: "数据底座" },
        { id: "n6", name: "质量检验明细", layer: 3, sub: "数据表" },
        { id: "n7", name: "生产工单宽表", layer: 3, sub: "数据表" },
        { id: "n8", name: "经营经营总览", layer: 4, sub: "报表/展示屏" },
        { id: "n9", name: "质量专题", layer: 4, sub: "报表/展示屏" },
        { id: "n10", name: "车间实时实时状态", layer: 4, sub: "报表/展示屏" }
      ],
      edges: [
        ["n1", "n4"], ["n2", "n4"], ["n3", "n4"],
        ["n4", "n5"], ["n5", "n6"], ["n5", "n7"],
        ["n6", "n8"], ["n6", "n9"], ["n7", "n8"], ["n7", "n10"]
      ],
      detail: {
        n6: { owner: "李娜", rows: "128.4 万", sensitive: "内部", fields: 26, update: "每日 06:50", report: "6 张报表 / 1 块展示屏" },
        n8: { owner: "王分析", rows: "—", sensitive: "内部", fields: "12 个指标", update: "实时", report: "面向管理层" }
      }
    },

    exports: [
      { id: "EX-01", object: "质量月报", fields: "含手机号、客户名称", rows: 1284, applicant: "李娜", status: "待审批", time: "2026-10-19 14:38", reason: "月度质量例会", watermark: "李娜 / 2026-10-19 / EX-01" },
      { id: "EX-02", object: "客户销售明细", fields: "含合同金额", rows: 860, applicant: "赵敏", status: "已批准", time: "2026-10-18 10:12", reason: "对账", watermark: "赵敏 / 2026-10-18 / EX-02" },
      { id: "EX-03", object: "设备告警清单", fields: "无敏感字段", rows: 42, applicant: "王强", status: "已拒绝", time: "2026-10-17 16:40", reason: "备件分析", watermark: "—" }
    ],

    rules: [
      { id: "BR-VZ-37", topic: "经营总览", text: "指标卡必须有目标值与达成率，无目标不进经营总览", point: "VZ-14", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-38", topic: "经营总览", text: "数据截止时间与来源置顶；超时效显示“延迟”标识", point: "VZ-14", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-39", topic: "经营总览", text: "经营总览默认只读，展示状态不允许改配置", point: "VZ-14", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-01", topic: "标准", text: "标准分四类，每类必须有责任人与生效日期", point: "VZ-01", demo: "metrics", confirmed: true },
      { id: "BR-VZ-02", topic: "标准", text: "标准发布即产生版本；被引用项变更时给出影响提示", point: "VZ-01", demo: "metrics", confirmed: true },
      { id: "BR-VZ-03", topic: "标准", text: "同一数据项只允许一个现行标准", point: "VZ-01", demo: "metrics", confirmed: false },
      { id: "BR-VZ-05", topic: "质量", text: "质量指标覆盖完整性、准确性、一致性、及时性、唯一性五维", point: "VZ-03", demo: "datasets", confirmed: true },
      { id: "BR-VZ-06", topic: "质量", text: "质量指标必须有名称、定义、公式、周期、责任人、阈值", point: "VZ-03", demo: "datasets", confirmed: false },
      { id: "BR-VZ-07", topic: "质量", text: "支持周期与准实时两种检查方式", point: "VZ-04", demo: "datasets", confirmed: true },
      { id: "BR-VZ-08", topic: "质量", text: "同一数据表同一指标 24 小时只推一次，连续 3 次未改善升级", point: "VZ-04", demo: "alerts", confirmed: true },
      { id: "BR-VZ-09", topic: "质量", text: "质量未达标的数据表，其报表展示“质量提示”角标", point: "VZ-04", demo: "datasets", confirmed: false },
      { id: "BR-VZ-10", topic: "清洗", text: "清洗动作至少 6 类：去重、格式、空值、纠错、异常标记、字典映射", point: "VZ-05", demo: "datasets", confirmed: true },
      { id: "BR-VZ-11", topic: "清洗", text: "规则必须试跑后才允许启用，试跑展示影响行数与前后对比", point: "VZ-05", demo: "datasets", confirmed: true },
      { id: "BR-VZ-12", topic: "清洗", text: "清洗不改源数据，只作用于分析副本；规则变更留版本", point: "VZ-05", demo: "datasets", confirmed: false },
      { id: "BR-VZ-13", topic: "转换", text: "支持字段映射、格式、编码、计算衍生、合并拆分", point: "VZ-06", demo: "datasets", confirmed: false },
      { id: "BR-VZ-14", topic: "转换", text: "类型不兼容必须显式转换并提示，不允许静默丢弃", point: "VZ-06", demo: "datasets", confirmed: true },
      { id: "BR-VZ-16", topic: "元数据", text: "数据表必须有业务与技术负责人，缺失不允许发布", point: "VZ-07", demo: "datasets", confirmed: true },
      { id: "BR-VZ-17", topic: "元数据", text: "敏感字段必须标注级别，标注后展示自动脱敏", point: "VZ-07", demo: "datasets", confirmed: true },
      { id: "BR-VZ-19", topic: "分析", text: "维度支持层级钻取，层级关系由维度定义", point: "VZ-08", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-20", topic: "分析", text: "维度组合上限 6 个、度量上限 10 个，超出提示拆分", point: "VZ-08", demo: "report", confirmed: false },
      { id: "BR-VZ-21", topic: "分析", text: "自定义计算字段必须写明业务含义", point: "VZ-08", demo: "report", confirmed: false },
      { id: "BR-VZ-22", topic: "图表", text: "内置图表至少 11 类", point: "VZ-09", demo: "report", confirmed: true },
      { id: "BR-VZ-23", topic: "图表", text: "图表推荐需给出理由", point: "VZ-09", demo: "report", confirmed: false },
      { id: "BR-VZ-24", topic: "图表", text: "图表必须标注标题、单位、截止时间、来源，缺失拦截保存", point: "VZ-09", demo: "report", confirmed: true },
      { id: "BR-VZ-25", topic: "钻取", text: "最大逐层查看 5 层，到明细层改为列表", point: "VZ-10", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-26", topic: "钻取", text: "逐层查看继承当前筛选条件，不丢上下文", point: "VZ-10", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-27", topic: "钻取", text: "明细超过 500 条分页，导出受权限约束", point: "VZ-10", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-28", topic: "一起筛选", text: "一起筛选仅同仪表盘生效，跨盘跳转需显式配置", point: "VZ-11", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-29", topic: "一起筛选", text: "一起筛选字段必须同源同义，类型不一致不允许一起筛选", point: "VZ-11", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-30", topic: "一起筛选", text: "一起筛选后必须提供“清除一起筛选”入口", point: "VZ-11", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-31", topic: "预测", text: "算法至少覆盖回归、分类、聚类、时间序列", point: "VZ-12", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-32", topic: "预测", text: "训练前检查空值/样本量/异常值，不达标不允许训练", point: "VZ-12", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-33", topic: "预测", text: "发布前必须回测，展示误差指标；误差超阈值不得发布", point: "VZ-12", demo: "dashboard", confirmed: false },
      { id: "BR-VZ-34", topic: "预测", text: "预测结果必须标注模型、样本期、置信区间、生成时间", point: "VZ-13", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-35", topic: "预测", text: "预测值与实测值必须可区分（图例/颜色/线型）", point: "VZ-13", demo: "dashboard", confirmed: true },
      { id: "BR-VZ-40", topic: "实时状态", text: "设备状态色统一：绿运行/黄待机/红故障/灰离线", point: "VZ-15", demo: "production", confirmed: true },
      { id: "BR-VZ-41", topic: "实时状态", text: "刷新频率可配，超过 30 秒未更新显示“数据超时”", point: "VZ-15", demo: "production", confirmed: true },
      { id: "BR-VZ-43", topic: "质量图", text: "质量波动图 至少支持 4 类异常规则", point: "VZ-16", demo: "quality", confirmed: true },
      { id: "BR-VZ-44", topic: "质量图", text: "异常点高亮且可点击查看原始检验记录", point: "VZ-16", demo: "quality", confirmed: true },
      { id: "BR-VZ-45", topic: "质量图", text: "缺陷排名必须显示累计占比线与 80/20 参考线", point: "VZ-16", demo: "quality", confirmed: false },
      { id: "BR-VZ-46", topic: "销售", text: "金额单位统一并标注，切换单位不改变精度", point: "VZ-17", demo: "sales", confirmed: true },
      { id: "BR-VZ-47", topic: "销售", text: "客户名称遵循脱敏规则，对外展示自动简称", point: "VZ-17", demo: "sales", confirmed: true },
      { id: "BR-VZ-48", topic: "展示屏", text: "分辨率预设 1920/2560/3840，组件按比例自适应", point: "VZ-18", demo: "screen", confirmed: true },
      { id: "BR-VZ-49", topic: "展示屏", text: "组件库至少 9 类", point: "VZ-18", demo: "screen", confirmed: false },
      { id: "BR-VZ-50", topic: "展示屏", text: "发布前必须通过多分辨率预览检查，重叠/溢出不允许发布", point: "VZ-18", demo: "screen", confirmed: true },
      { id: "BR-VZ-51", topic: "展示屏", text: "展示屏发布走审核，保留历史版本可回滚", point: "VZ-18", demo: "screen", confirmed: true },
      { id: "BR-VZ-52", topic: "展示屏", text: "刷新方式支持定时轮询与实时推送", point: "VZ-19", demo: "screen", confirmed: false },
      { id: "BR-VZ-53", topic: "展示屏", text: "局部更新优先，单页刷新不得整屏闪烁", point: "VZ-19", demo: "screen", confirmed: false },
      { id: "BR-VZ-54", topic: "展示屏", text: "断网保留最后数据并显示离线，恢复后自动重连", point: "VZ-19", demo: "production", confirmed: true },
      { id: "BR-VZ-55", topic: "展示屏", text: "展示页不得弹出任何配置弹窗", point: "VZ-19", demo: "screen", confirmed: false },
      { id: "BR-VZ-56", topic: "资产", text: "数据来源关系与来源关系同源，节点可跳详情", point: "VZ-20", demo: "lineage", confirmed: true },
      { id: "BR-VZ-57", topic: "资产", text: "无责任人的资产标红提示", point: "VZ-20", demo: "lineage", confirmed: false },
      { id: "BR-VZ-58", topic: "来源关系", text: "字段级来源关系，正反向查询，默认展开上下游各 3 层", point: "VZ-21", demo: "lineage", confirmed: true },
      { id: "BR-VZ-59", topic: "来源关系", text: "来源关系以治理平台登记为准，本系统只读", point: "VZ-21", demo: "lineage", confirmed: true },
      { id: "BR-VZ-60", topic: "来源关系", text: "上游字段变更时列出受影响的报表/展示屏/订阅", point: "VZ-21", demo: "lineage", confirmed: true },
      { id: "BR-VZ-61", topic: "评分", text: "质量评分按各指标加权计算，权重可配", point: "VZ-22", demo: "datasets", confirmed: false },
      { id: "BR-VZ-62", topic: "评分", text: "按月生成排名与趋势，可逐层查看到扣分项", point: "VZ-22", demo: "datasets", confirmed: false },
      { id: "BR-VZ-64", topic: "自己做", text: "报表必须基于已发布数据表，不允许直连业务库写 SQL", point: "VZ-23", demo: "report", confirmed: true },
      { id: "BR-VZ-65", topic: "自己做", text: "报表发布需审核：统计定义、权限、性能、敏感字段", point: "VZ-23", demo: "report", confirmed: true },
      { id: "BR-VZ-66", topic: "自己做", text: "报表可另存为模板，模板变更不影响已引用报表", point: "VZ-23", demo: "report", confirmed: false },
      { id: "BR-VZ-67", topic: "自己做", text: "单报表预览上限 10 万行、导出上限 50 万行", point: "VZ-23", demo: "report", confirmed: false },
      { id: "BR-VZ-68", topic: "预警", text: "触发条件支持阈值、连续 N 期、同比突变、达成率不足", point: "VZ-24", demo: "alerts", confirmed: true },
      { id: "BR-VZ-69", topic: "预警", text: "通道至少 5 类，按紧急度组合", point: "VZ-24", demo: "alerts", confirmed: true },
      { id: "BR-VZ-70", topic: "预警", text: "同指标同对象 24 小时不重复；未认领 2 小时升级；恶化 20% 立即重推", point: "VZ-24", demo: "alerts", confirmed: true },
      { id: "BR-VZ-71", topic: "预警", text: "预警消息含指标、当前值、阈值、趋势、责任人、处理入口", point: "VZ-24", demo: "alerts", confirmed: false }
    ],

    questions: [
      { id: "Q-VZ-01", text: "与数据治理平台的边界是否按“定义在治理、展示在可视化”执行？本期是否允许轻量版并存？", impact: "工作量与双写风险", suggest: "按边界执行，轻量版只读为主", owner: "甲方/架构", decision: "pending" },
      { id: "Q-VZ-02", text: "“1000 在线”与“800 并发查询”以哪个为验收统计定义？", impact: "压测与容量", suggest: "1000 在线 + 800 并发查询", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-03", text: "首批上经营总览的核心指标清单与目标值由谁提供？", impact: "无法验收“目标达成”", suggest: "业务部门提供，30 个以内", owner: "业务", decision: "pending" },
      { id: "Q-VZ-04", text: "展示屏数量、分辨率、安装位置、是否需要拼接屏？", impact: "适配工作量", suggest: "3 块：展厅、指挥中心、车间", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-05", text: "生产实时监控是否需要 3D 数字孪生？", impact: "P1 范围与成本", suggest: "本期 2D + 简化 3D", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-06", text: "移动端形态：H5 响应式 / 企微小程序 / 原生 APP？", impact: "前端工作量", suggest: "H5 响应式", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-07", text: "是否需要外部访客展示页（脱敏、限时）？", impact: "安全与权限", suggest: "本期不做", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-08", text: "数据源清单与只读账号是否已具备？", impact: "能否开工", suggest: "需甲方提供", owner: "甲方 IT", decision: "pending" },
      { id: "Q-VZ-09", text: "敏感字段范围与导出审批流节点？", impact: "合规", suggest: "手机号/身份证/成本价", owner: "安全负责人", decision: "pending" },
      { id: "Q-VZ-10", text: "预警通道是否已采购短信/企微机器人？配额多少？", impact: "通道可用性", suggest: "站内信+企微优先", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-11", text: "分析数据保留期与归档策略？", impact: "容量", suggest: "明细 12 个月，汇总 3 年", owner: "甲方", decision: "pending" },
      { id: "Q-VZ-12", text: "智能预测的首批场景（销量/故障/质量）？", impact: "P1 是否做、做几个", suggest: "先做销量预测 1 个", owner: "业务", decision: "pending" }
    ]
  };
})();
