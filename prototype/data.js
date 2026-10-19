/* 演示数据：全部为虚构示例，用于业务逻辑走查，不代表真实系统数据 */
window.DB = {
  actor: "张伟（平台管理员）",

  // 能力目录 C-01 ~ C-10
  capabilities: [
    { code: "C-01", name: "一次登录，处处通行", sla: "认证响应 ≤1 秒", users: "全部应用", today: 1832, status: "ok" },
    { code: "C-02", name: "账号自动同步", sla: "变更 15 分钟内生效", users: "系统管理", today: 27, status: "ok" },
    { code: "C-03", name: "系统接入登记", sla: "审核 ≤1 工作日", users: "集成方", today: 2, status: "warn" },
    { code: "C-04", name: "文件存取", sla: "2GB 内 ≤5 分钟", users: "全部应用", today: 486, status: "ok" },
    { code: "C-05", name: "通知发送", sla: "5 秒内发出", users: "全部应用", today: 1284, status: "ok" },
    { code: "C-06", name: "数据搬运", sla: "按任务约定", users: "全部应用", today: 96, status: "ok" },
    { code: "C-07", name: "系统对接管理", sla: "按接口约定", users: "全部应用", today: 86420, status: "ok" },
    { code: "C-08", name: "运行设置", sla: "变更 10 秒内生效", users: "全部应用", today: 14, status: "ok" },
    { code: "C-09", name: "操作记录", sla: "写入 ≤1 秒", users: "全部应用", today: 4210, status: "ok" },
    { code: "C-10", name: "关键记录存证", sla: "存证 ≤3 秒", users: "关键业务", today: 318, status: "warn" }
  ],

  apps: [
    {
      id: "APP-1001", name: "质量追溯系统", owner: "张工 / 质量部", status: "running",
      scopes: ["统一认证", "文件存取", "通知发送", "接口调用"], callback: "https://quality.corp.local/sso/callback",
      qps: 200, callsToday: 31200, callQuota: 500000, createdAt: "2026-08-12", credentialExpiry: "2027-08-12",
      lastCall: "2026-10-19 14:41:22", successRate: 99.96, note: "首批接入，已过观察期"
    },
    {
      id: "APP-1002", name: "生产管理系统", owner: "李主管 / 制造部", status: "running",
      scopes: ["统一认证", "通知发送", "数据搬运"], callback: "https://mes.corp.local/auth/cb",
      qps: 300, callsToday: 28740, callQuota: 400000, createdAt: "2026-08-15", credentialExpiry: "2027-08-15",
      lastCall: "2026-10-19 14:39:08", successRate: 99.88, note: ""
    },
    {
      id: "APP-1003", name: "数据可视化系统", owner: "王分析 / 数字化部", status: "running",
      scopes: ["统一认证", "文件存取", "通知发送"], callback: "https://bi.corp.local/sso/callback",
      qps: 150, callsToday: 12480, callQuota: 300000, createdAt: "2026-09-02", credentialExpiry: "2027-09-02",
      lastCall: "2026-10-19 14:37:55", successRate: 99.91, note: ""
    },
    {
      id: "APP-1004", name: "供应链与计划协同", owner: "赵经理 / 供应链", status: "observing",
      scopes: ["统一认证", "接口调用", "数据搬运"], callback: "https://scm.corp.local/sso/cb",
      qps: 120, callsToday: 6180, callQuota: 300000, createdAt: "2026-10-09", credentialExpiry: "2027-10-09",
      lastCall: "2026-10-19 14:22:10", successRate: 99.42, note: "观察期至 2026-11-08"
    },
    {
      id: "APP-1005", name: "智慧能耗管理系统", owner: "陈工 / 设备部", status: "pending",
      scopes: ["统一认证", "数据搬运"], callback: "https://energy.corp.local/auth/callback",
      qps: 60, callsToday: 0, callQuota: 100000, createdAt: "2026-10-18", credentialExpiry: "—",
      lastCall: "—", successRate: 0, note: "待平台管理员审核（已等待 1 天）"
    },
    {
      id: "APP-1006", name: "智能门禁控制服务", owner: "刘工 / 行政部", status: "disabled",
      scopes: ["统一认证"], callback: "https://access.corp.local/cb",
      qps: 30, callsToday: 0, callQuota: 50000, createdAt: "2026-07-01", credentialExpiry: "2026-09-30",
      lastCall: "2026-07-19 09:12:00", successRate: 0, note: "90 天零调用，已自动停用"
    }
  ],

  identity: [
    { id: "IDP-01", name: "企业 AD（LDAP）", type: "AD / LDAP", status: "connected", lastSync: "2026-10-19 08:00:12", added: 3, changed: 12, disabled: 2, users: 1268, note: "主身份源，权威数据" },
    { id: "IDP-02", name: "HR 人事系统", type: "HR 接口", status: "connected", lastSync: "2026-10-19 07:30:04", added: 1, changed: 6, disabled: 1, users: 1268, note: "组织与岗位以 HR 为准" },
    { id: "IDP-03", name: "企业微信", type: "OAuth2 扫码", status: "connected", lastSync: "2026-10-19 14:00:33", added: 0, changed: 2, disabled: 0, users: 1180, note: "仅用于扫码登录与消息通道" }
  ],

  conflicts: [
    { id: "CF-01", type: "工号重复", a: "AD：工号 G10238 / 李娜 / 质量部", b: "HR：工号 G10238 / 李娜 / 制造部", time: "2026-10-19 08:00", owner: "待裁定" },
    { id: "CF-02", type: "姓名同音", a: "AD：王强 / 工号 G10566", b: "HR：王强 / 工号 G10567", time: "2026-10-19 07:30", owner: "待裁定" }
  ],

  sessions: [
    { id: "SS-8821", user: "张伟", dept: "数字化部", app: "质量追溯系统", ip: "10.12.8.21", device: "Chrome / Windows 11", loginAt: "2026-10-19 08:31", lastActive: "2026-10-19 14:41", status: "active" },
    { id: "SS-8822", user: "李娜", dept: "质量部", app: "质量追溯系统", ip: "10.12.9.66", device: "Edge / Windows 10", loginAt: "2026-10-19 09:02", lastActive: "2026-10-19 14:38", status: "active" },
    { id: "SS-8823", user: "王强", dept: "制造部", app: "生产管理系统", ip: "10.12.9.88", device: "Chrome / Windows 11", loginAt: "2026-10-19 07:55", lastActive: "2026-10-19 14:40", status: "active" },
    { id: "SS-8824", user: "赵敏", dept: "供应链", app: "供应链与计划协同", ip: "10.12.11.4", device: "Safari / macOS", loginAt: "2026-10-19 10:12", lastActive: "2026-10-19 14:20", status: "active" },
    { id: "SS-8825", user: "陈晨", dept: "设备部", app: "数据可视化系统", ip: "203.0.113.77", device: "未知 / Android", loginAt: "2026-10-19 13:47", lastActive: "2026-10-19 14:05", status: "suspicious" }
  ],

  params: [
    { key: "auth.login.maxFail", name: "登录失败锁定次数", group: "认证策略", value: "5", oldValue: "5", type: "数值", sensitivity: "内部", scope: "全部应用", updatedBy: "张伟", updatedAt: "2026-09-18 10:22", history: 3 },
    { key: "auth.token.ttl", name: "令牌有效期（分钟）", group: "认证策略", value: "120", oldValue: "120", type: "数值", sensitivity: "内部", scope: "全部应用", updatedBy: "张伟", updatedAt: "2026-08-30 09:10", history: 2 },
    { key: "msg.quiet.hours", name: "消息免打扰时段", group: "消息策略", value: "22:00-08:00", oldValue: "22:00-08:00", type: "文本", sensitivity: "公开", scope: "全部应用", updatedBy: "系统默认", updatedAt: "2026-07-01 00:00", history: 1 },
    { key: "file.max.size", name: "单文件大小上限（MB）", group: "文件策略", value: "2048", oldValue: "2048", type: "数值", sensitivity: "内部", scope: "全部应用", updatedBy: "张伟", updatedAt: "2026-09-05 16:40", history: 2 },
    { key: "api.rate.limit", name: "单应用默认 QPS", group: "接口策略", value: "200", oldValue: "200", type: "数值", sensitivity: "敏感", scope: "全部应用", updatedBy: "安全管理员", updatedAt: "2026-09-22 11:05", history: 4 },
    { key: "security.tls.min", name: "最低传输加密版本", group: "安全策略", value: "TLS 1.2", oldValue: "TLS 1.2", type: "枚举", sensitivity: "安全", scope: "全部应用", updatedBy: "安全管理员", updatedAt: "2026-08-11 15:30", history: 2 },
    { key: "audit.retention.days", name: "审计日志留存（天）", group: "审计策略", value: "180", oldValue: "180", type: "数值", sensitivity: "内部", scope: "全平台", updatedBy: "审计员", updatedAt: "2026-08-01 09:00", history: 1 },
    { key: "integration.retry.max", name: "集成任务最大重试次数", group: "集成策略", value: "3", oldValue: "3", type: "数值", sensitivity: "公开", scope: "全部应用", updatedBy: "系统默认", updatedAt: "2026-07-01 00:00", history: 1 }
  ],

  fileQuotas: [
    { app: "质量追溯系统", used: 312, total: 500, unit: "GB" },
    { app: "生产管理系统", used: 358, total: 400, unit: "GB" },
    { app: "数据可视化系统", used: 46, total: 200, unit: "GB" },
    { app: "供应链与计划协同", used: 88, total: 200, unit: "GB" }
  ],

  files: [
    { id: "F-9001", name: "2026-10-成品检验报告.pdf", app: "质量追溯系统", size: "12.4 MB", version: 3, status: "available", owner: "李娜", updatedAt: "2026-10-19 11:20", link: false },
    { id: "F-9002", name: "回流焊工艺图纸.dwg", app: "生产管理系统", size: "88.1 MB", version: 1, status: "available", owner: "王强", updatedAt: "2026-10-18 16:05", link: false },
    { id: "F-9003", name: "供应商资质包.zip", app: "供应链与计划协同", size: "340 MB", version: 2, status: "archived", owner: "赵敏", updatedAt: "2026-08-02 09:40", link: false },
    { id: "F-9004", name: "车间现场照片.jpg", app: "生产管理系统", size: "4.2 MB", version: 1, status: "available", owner: "王强", updatedAt: "2026-10-19 10:03", link: true },
    { id: "F-9005", name: "框架合同扫描件.pdf", app: "供应链与计划协同", size: "9.8 MB", version: 1, status: "available", owner: "赵敏", updatedAt: "2026-09-28 14:12", link: true }
  ],

  templates: [
    { id: "TPL-01", name: "质量异常预警", channels: ["企业微信", "短信"], status: "approved", owner: "质量部" },
    { id: "TPL-02", name: "审批待办提醒", channels: ["站内信"], status: "approved", owner: "平台" },
    { id: "TPL-03", name: "报表订阅推送", channels: ["邮件"], status: "approved", owner: "数字化部" },
    { id: "TPL-04", name: "系统维护通知", channels: ["站内信", "邮件"], status: "pending", owner: "运维" },
    { id: "TPL-05", name: "供应商对账提醒", channels: ["短信"], status: "approved", owner: "供应链" }
  ],

  messages: [
    { id: "MSG-7011", template: "质量异常预警", user: "李娜", channel: "企业微信", status: "success", time: "2026-10-19 14:31", note: "主通道" },
    { id: "MSG-7012", template: "质量异常预警", user: "李娜", channel: "短信", status: "success", time: "2026-10-19 14:31", note: "双通道" },
    { id: "MSG-7013", template: "审批待办提醒", user: "王强", channel: "站内信", status: "success", time: "2026-10-19 13:58", note: "" },
    { id: "MSG-7014", template: "报表订阅推送", user: "王分析", channel: "邮件", status: "failed", time: "2026-10-19 08:00", note: "邮箱拒收，已重试 3 次" },
    { id: "MSG-7015", template: "供应商对账提醒", user: "赵敏", channel: "短信", status: "success", time: "2026-10-18 17:20", note: "通道降级后成功" },
    { id: "MSG-7016", template: "系统维护通知", user: "全体", channel: "—", status: "blocked", time: "2026-10-18 16:00", note: "模板待审核，已拦截" }
  ],

  apis: [
    { id: "API-2001", name: "查询物料主数据", version: "v1.2", status: "published", owner: "张工", scope: "业务系统（只读）", qps: 200, successRate: 99.97, p95: 82, callsToday: 24810 },
    { id: "API-2002", name: "推送检验结果", version: "v2.0", status: "published", owner: "李工", scope: "质量域（写）", qps: 100, successRate: 99.92, p95: 118, callsToday: 18620 },
    { id: "API-2003", name: "查询实时库存", version: "v1.0", status: "published", owner: "赵经理", scope: "供应链（只读）", qps: 150, successRate: 99.88, p95: 96, callsToday: 14300 },
    { id: "API-2004", name: "组织人员同步", version: "v1.1", status: "published", owner: "平台", scope: "系统管理（写）", qps: 20, successRate: 99.99, p95: 210, callsToday: 240 },
    { id: "API-2005", name: "设备状态上报", version: "v1.0", status: "draft", owner: "陈工", scope: "设备域（写）", qps: 500, successRate: 0, p95: 0, callsToday: 0 },
    { id: "API-2006", name: "历史订单查询", version: "v1.0", status: "offline", owner: "赵经理", scope: "只读", qps: 50, successRate: 0, p95: 0, callsToday: 0 }
  ],

  callLogs: [
    { id: "CALL-88", api: "查询物料主数据", app: "生产管理系统", time: "2026-10-19 14:41:02", cost: 76, result: "成功", code: "200", sensitive: false },
    { id: "CALL-87", api: "推送检验结果", app: "质量追溯系统", time: "2026-10-19 14:40:51", cost: 132, result: "成功", code: "200", sensitive: true },
    { id: "CALL-86", api: "查询实时库存", app: "供应链与计划协同", time: "2026-10-19 14:39:47", cost: 94, result: "成功", code: "200", sensitive: false },
    { id: "CALL-85", api: "推送检验结果", app: "质量追溯系统", time: "2026-10-19 14:38:12", cost: 89, result: "失败", code: "40021", sensitive: true },
    { id: "CALL-84", api: "组织人员同步", app: "系统管理", time: "2026-10-19 14:00:03", cost: 218, result: "成功", code: "200", sensitive: true },
    { id: "CALL-83", api: "查询物料主数据", app: "数据可视化系统", time: "2026-10-19 13:58:44", cost: 61, result: "成功", code: "200", sensitive: false },
    { id: "CALL-82", api: "查询实时库存", app: "数据可视化系统", time: "2026-10-19 13:57:30", cost: 240, result: "限流", code: "429", sensitive: false },
    { id: "CALL-81", api: "推送检验结果", app: "未知来源", time: "2026-10-19 13:31:10", cost: 12, result: "鉴权失败", code: "401", sensitive: true }
  ],

  mappings: [
    { id: "MAP-01", name: "检验结果 → 质量数据仓", source: "质量追溯系统", target: "分析数据集", fields: 18, version: "v3", status: "enabled" },
    { id: "MAP-02", name: "库存快照 → 供应链数据集", source: "供应链与计划协同", target: "分析数据集", fields: 9, version: "v1", status: "enabled" },
    { id: "MAP-03", name: "物料主数据 → 全平台", source: "ERP", target: "主数据", fields: 24, version: "v2", status: "paused" }
  ],

  audit: [
    { id: "LOG-3011", time: "2026-10-19 14:38:12", actor: "李娜", action: "导出报表", object: "质量月报（含手机号）", system: "质量追溯系统", result: "成功", ip: "10.12.9.66", sensitive: true, detail: "导出 1,284 行；审批单 AP-2026-1032；水印：李娜/2026-10-19" },
    { id: "LOG-3012", time: "2026-10-19 14:31:05", actor: "系统", action: "消息发送", object: "质量异常预警 × 2", system: "消息中心", result: "成功", ip: "10.12.8.10", sensitive: false, detail: "企业微信 + 短信双通道；接收人李娜" },
    { id: "LOG-3013", time: "2026-10-19 13:47:20", actor: "陈晨", action: "登录", object: "数据可视化系统", system: "认证中心", result: "成功", ip: "203.0.113.77", sensitive: false, detail: "异地 IP 首次登录，已标记为可疑会话" },
    { id: "LOG-3014", time: "2026-10-19 11:05:44", actor: "张伟", action: "设置变更", object: "api.rate.limit 200 → 300", system: "参数中心", result: "成功", ip: "10.12.8.21", sensitive: true, detail: "审批人：安全管理员；灰度：全部应用；生效耗时 6 秒" },
    { id: "LOG-3015", time: "2026-10-19 10:12:03", actor: "赵敏", action: "文件下载", object: "供应商资质包.zip v2", system: "文件存取", result: "成功", ip: "10.12.11.4", sensitive: false, detail: "文件大小 340MB；归档状态下载" },
    { id: "LOG-3016", time: "2026-10-19 09:12:30", actor: "未知来源", action: "接口调用", object: "推送检验结果 v2.0", system: "接口网关", result: "鉴权失败", ip: "198.51.100.9", sensitive: true, detail: "缺少应用凭证；已触发越权告警（第 1 次）" },
    { id: "LOG-3017", time: "2026-10-18 17:20:11", actor: "系统", action: "通道降级", object: "短信 → 企业微信", system: "消息中心", result: "成功", ip: "10.12.8.10", sensitive: false, detail: "短信通道连续失败 5 次，自动切换；恢复需管理员确认" },
    { id: "LOG-3018", time: "2026-10-18 16:00:02", actor: "平台", action: "消息拦截", object: "系统维护通知", system: "消息中心", result: "拦截", ip: "10.12.8.10", sensitive: false, detail: "模板未审核（BR-BS-39），拒绝发送" },
    { id: "LOG-3019", time: "2026-10-18 15:30:40", actor: "安全管理员", action: "密钥轮换", object: "APP-1001 应用密钥", system: "系统接入登记", result: "成功", ip: "10.12.8.30", sensitive: true, detail: "双密钥并行过渡；旧密钥 7 天后失效" },
    { id: "LOG-3020", time: "2026-10-18 09:41:18", actor: "张伟", action: "应用审核", object: "供应链与计划协同", system: "系统接入登记", result: "通过", ip: "10.12.8.21", sensitive: false, detail: "进入 30 天观察期；配额 300,000 次/日" }
  ],

  rules: [
    { id: "BR-BS-01", topic: "认证", text: "令牌有效期默认 2 小时，可配 5 分钟～8 小时，支持静默续期", point: "BS-01", demo: "sessions", confirmed: true },
    { id: "BR-BS-02", topic: "认证", text: "单点登出在 5 秒内使全部应用会话失效", point: "BS-01", demo: "sessions", confirmed: false },
    { id: "BR-BS-03", topic: "认证", text: "同一账号并发会话上限默认 3 个，超限踢最早会话并提示", point: "BS-04", demo: "sessions", confirmed: false },
    { id: "BR-BS-04", topic: "认证", text: "身份源不可用时，按开关降级本地账号登录，并记录降级事件", point: "BS-01", demo: "identity", confirmed: true },
    { id: "BR-BS-05", topic: "身份源", text: "账号以身份源为准，平台侧只读，不允许人工修改", point: "BS-02", demo: "identity", confirmed: true },
    { id: "BR-BS-06", topic: "身份源", text: "离职或停用必须在 15 分钟内同步生效，失败 30 分钟内告警", point: "BS-02", demo: "identity", confirmed: true },
    { id: "BR-BS-07", topic: "身份源", text: "同步冲突进入待处理清单，由管理员裁定，不允许自动覆盖", point: "BS-02", demo: "identity", confirmed: false },
    { id: "BR-BS-08", topic: "系统接入登记", text: "回调地址必须白名单校验，禁止通配符；变更需重新审核", point: "BS-03", demo: "apps", confirmed: true },
    { id: "BR-BS-09", topic: "系统接入登记", text: "权限范围按最小化原则申请，超出默认范围需安全管理员审批", point: "BS-03", demo: "apps", confirmed: true },
    { id: "BR-BS-10", topic: "系统接入登记", text: "应用凭证有效期 12 个月，90 天零调用自动停用并通知", point: "BS-03", demo: "apps", confirmed: false },
    { id: "BR-BS-11", topic: "系统接入登记", text: "申请必须填写应用名称、负责人、用途、所需能力、回调地址", point: "BS-03", demo: "apps", confirmed: true },
    { id: "BR-BS-12", topic: "会话", text: "支持注销单个会话、注销某用户全部会话、注销某应用全部会话", point: "BS-04", demo: "sessions", confirmed: false },
    { id: "BR-BS-13", topic: "会话", text: "强制下线在 30 秒内生效，并向被下线用户提示原因", point: "BS-04", demo: "sessions", confirmed: true },
    { id: "BR-BS-14", topic: "审计", text: "必采字段：操作人、时间、来源系统、操作类型、操作对象、结果、IP", point: "BS-05", demo: "audit", confirmed: true },
    { id: "BR-BS-15", topic: "审计", text: "密码、身份证、银行卡禁止入日志；手机号等需脱敏", point: "BS-05", demo: "audit", confirmed: true },
    { id: "BR-BS-16", topic: "审计", text: "日志留存不少于 6 个月，到期归档，不允许直接删除", point: "BS-05", demo: "audit", confirmed: false },
    { id: "BR-BS-17", topic: "审计", text: "日志只追加不修改；删除需安全管理员与审计员双签", point: "BS-05", demo: "audit", confirmed: false },
    { id: "BR-BS-18", topic: "参数", text: "参数分四级敏感度，敏感与安全级变更需审批（安全级双人）", point: "BS-06", demo: "params", confirmed: true },
    { id: "BR-BS-19", topic: "参数", text: "参数生效时延不超过 10 秒，支持按应用、环境、比例灰度", point: "BS-06", demo: "params", confirmed: true },
    { id: "BR-BS-20", topic: "参数", text: "变更保留改前值、改后值、申请人、审批人、时间，支持一键回滚", point: "BS-06", demo: "params", confirmed: true },
    { id: "BR-BS-21", topic: "参数", text: "参数读取失败时使用默认值并告警，不允许导致系统不可用", point: "BS-06", demo: "params", confirmed: false },
    { id: "BR-BS-22", topic: "文件", text: "单文件上限默认 2GB，格式白名单由业务方申请、平台配置", point: "BS-07", demo: "files", confirmed: true },
    { id: "BR-BS-23", topic: "文件", text: "按应用分配配额，达到 80% 预警，100% 拒绝上传", point: "BS-07", demo: "files", confirmed: true },
    { id: "BR-BS-24", topic: "文件", text: "相同内容不重复存储（秒传），但保留各自业务引用关系", point: "BS-07", demo: "files", confirmed: false },
    { id: "BR-BS-25", topic: "文件", text: "文件版本保留最近 10 版，历史版本可下载、可回溯", point: "BS-07", demo: "files", confirmed: false },
    { id: "BR-BS-26", topic: "文件", text: "上传即做安全扫描，未通过的文件隔离并通知上传人", point: "BS-07", demo: "files", confirmed: true },
    { id: "BR-BS-27", topic: "文件", text: "180 天未访问转归档，清理前 30 天通知", point: "BS-07", demo: "files", confirmed: false },
    { id: "BR-BS-28", topic: "文件", text: "外链分享需设有效期与提取码，且可随时撤销", point: "BS-07", demo: "files", confirmed: true },
    { id: "BR-BS-29", topic: "消息", text: "模板必须审核，模板变更需重新审核", point: "BS-09", demo: "messages", confirmed: true },
    { id: "BR-BS-30", topic: "消息", text: "变量缺失、接收人无效、模板停用，直接拒绝并说明原因", point: "BS-09", demo: "messages", confirmed: true },
    { id: "BR-BS-31", topic: "消息", text: "默认 22:00～08:00 不发普通消息，紧急消息需标记并留痕", point: "BS-09", demo: "messages", confirmed: true },
    { id: "BR-BS-32", topic: "消息", text: "同一模板同一用户 5 分钟内最多 1 条；同类消息 24 小时内合并", point: "BS-09", demo: "messages", confirmed: true },
    { id: "BR-BS-33", topic: "消息", text: "失败最多重试 3 次，间隔 1/5/15 分钟，仍失败进入待补发并告警", point: "BS-09", demo: "messages", confirmed: false },
    { id: "BR-BS-34", topic: "消息", text: "主通道连续失败 5 次或成功率低于 90%，自动切换备用通道", point: "BS-10", demo: "messages", confirmed: true },
    { id: "BR-BS-35", topic: "消息", text: "到达率低于 95% 触发告警；恢复后不自动切回，需管理员确认", point: "BS-10", demo: "messages", confirmed: false },
    { id: "BR-BS-36", topic: "集成", text: "路由规则按优先级匹配，命中即停止；未命中进入默认通道或待处理队列", point: "BS-12", demo: "apis", confirmed: false },
    { id: "BR-BS-37", topic: "集成", text: "转换失败必须给出第几条、哪个字段、什么原因，不允许只报失败", point: "BS-13", demo: "apis", confirmed: true },
    { id: "BR-BS-38", topic: "接口", text: "每个接口必须有名称、业务说明、请求方权限范围、错误码清单、负责人", point: "BS-14", demo: "apis", confirmed: true },
    { id: "BR-BS-39", topic: "接口", text: "接口分版本管理，旧版本至少保留 6 个月，下线提前 30 天通知", point: "BS-14", demo: "apis", confirmed: true },
    { id: "BR-BS-40", topic: "接口", text: "未登记接口不允许被调用；白名单例外需安全审批", point: "BS-14", demo: "apis", confirmed: false },
    { id: "BR-BS-41", topic: "接口", text: "接口必须支持幂等，由接口定义方声明幂等键", point: "BS-14", demo: "apis", confirmed: false },
    { id: "BR-BS-42", topic: "映射", text: "支持 1:1、1:N、N:1 映射，以及常量、函数、条件转换", point: "BS-15", demo: "apis", confirmed: true },
    { id: "BR-BS-43", topic: "映射", text: "类型或长度不兼容必须显式转换，失败数据进错误清单而非丢弃", point: "BS-15", demo: "apis", confirmed: true },
    { id: "BR-BS-44", topic: "映射", text: "映射变更时提示受影响的集成任务与接口；支持抽样 100 条试跑", point: "BS-15", demo: "apis", confirmed: false },
    { id: "BR-BS-45", topic: "鉴权", text: "调用必须携带应用凭证与访问令牌；无凭证、过期、越权一律拒绝", point: "BS-18", demo: "apis", confirmed: true },
    { id: "BR-BS-46", topic: "鉴权", text: "授权粒度：应用 → 接口 → 数据范围；支持 IP 白名单与频率限制", point: "BS-18", demo: "apis", confirmed: true },
    { id: "BR-BS-47", topic: "鉴权", text: "密钥 90 天轮换，支持双密钥并行过渡，旧密钥到期自动失效", point: "BS-18", demo: "apps", confirmed: false },
    { id: "BR-BS-48", topic: "鉴权", text: "连续 10 次越权自动封禁应用 30 分钟，并记录告警", point: "BS-18", demo: "audit", confirmed: false },
    { id: "BR-BS-49", topic: "审计", text: "调用审计记录调用方、接口、时间、耗时、结果、请求标识、来源 IP", point: "BS-19", demo: "audit", confirmed: true },
    { id: "BR-BS-50", topic: "审计", text: "异常调用（高频失败、超大返回、非工作时间批量）自动标记并告警", point: "BS-19", demo: "audit", confirmed: false },
    { id: "BR-BS-51", topic: "安全", text: "对外传输必须加密（TLS 1.2 及以上），禁止明文传输敏感数据", point: "BS-20", demo: "params", confirmed: true },
    { id: "BR-BS-52", topic: "安全", text: "敏感字段存储必须加密，密码不可逆存储，密钥不得出现在日志中", point: "BS-20", demo: "params", confirmed: true },
    { id: "BR-BS-53", topic: "模型", text: "一个物理资产对应一个主模型，允许附加多个展示模型", point: "BS-21", demo: "overview", confirmed: false },
    { id: "BR-BS-54", topic: "模型", text: "资产变更或报废时映射自动失效并通知使用方", point: "BS-21", demo: "overview", confirmed: false },
    { id: "BR-BS-55", topic: "存证", text: "只对关键业务摘要与哈希上链，原始明细不上链", point: "BS-24", demo: "overview", confirmed: false },
    { id: "BR-BS-56", topic: "存证", text: "上链失败不阻塞业务，进入重试队列；连续失败告警", point: "BS-24", demo: "overview", confirmed: false }
  ],

  questions: [
    { id: "Q-BS-01", text: "权威身份源是哪一套（AD / HR / 企微 / 钉钉）？首批接入应用几个？", impact: "认证方案与工作量", suggest: "AD + 企微，首批 3 个", owner: "甲方 IT", decision: "pending" },
    { id: "Q-BS-02", text: "是否需要与现有统一认证平台对接（若有）？", impact: "协议适配", suggest: "需要则按 OIDC 对接", owner: "甲方 IT", decision: "pending" },
    { id: "Q-BS-03", text: "消息通道是否已采购？短信条数与企微机器人配额？", impact: "通道可用性", suggest: "站内信+企微优先，短信按需", owner: "甲方", decision: "pending" },
    { id: "Q-BS-04", text: "单文件大小上限、格式白名单、总存储配额？", impact: "文件方案", suggest: "2GB、常用办公与图纸格式", owner: "甲方", decision: "pending" },
    { id: "Q-BS-05", text: "审计日志留存期与是否要求防篡改（存证）？", impact: "存储与合规", suggest: "≥6 个月，关键日志存证", owner: "安全负责人", decision: "pending" },
    { id: "Q-BS-06", text: "是否需要国密算法（SM2/SM3/SM4）？", impact: "加密方案", suggest: "按等保/密评要求确认", owner: "安全负责人", decision: "pending" },
    { id: "Q-BS-07", text: "是否多租户（集团多分公司隔离）？", impact: "模型复杂度大幅变化", suggest: "本期单租户 + 组织隔离", owner: "甲方", decision: "pending" },
    { id: "Q-BS-08", text: "数据库最终选型（达梦 / MySQL）？", impact: "适配与迁移", suggest: "按信创要求确认", owner: "甲方/架构", decision: "pending" },
    { id: "Q-BS-09", text: "接口只对内，还是需要开放给第三方（含计费）？", impact: "网关与安全等级", suggest: "本期仅对内", owner: "甲方", decision: "pending" },
    { id: "Q-BS-10", text: "区块链：上链范围、链的部署形态、节点由谁提供？", impact: "BS-24 是否本期做", suggest: "关键质量与追溯摘要上链", owner: "甲方", decision: "pending" },
    { id: "Q-BS-11", text: "密钥托管方式（平台自管 / 硬件密钥 / 云 KMS）？", impact: "安全方案", suggest: "平台自管 + 定期轮换", owner: "安全负责人", decision: "pending" },
    { id: "Q-BS-12", text: "设置变更审批流节点与时限？", impact: "流程配置", suggest: "普通一级、安全双人，4 小时内", owner: "甲方", decision: "pending" }
  ],

  vizScreens: [
    "经营驾驶舱（6 大领域指标）", "质量专题（SPC / 柏拉图）", "生产实时看板", "销售分析",
    "自助报表编辑器", "数据集管理", "指标与标准管理", "预警中心",
    "大屏设计器", "资产地图 / 血缘", "导出审批", "移动端报表"
  ],

  stats: { apps: 6, online: 5, messages: 1284, calls: 86420, success: 99.87, alerts: 2 }
};
