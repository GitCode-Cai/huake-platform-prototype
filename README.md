# 企业数字化平台 · 业务原型与需求文档

制造业数据服务平台的**纯前端业务原型**（基础支撑管理 + 数据可视化系统），不需要任何构建工具，打开即用。

> 声明：全部为演示数据，无后端、无真实数据、不含客户生产数据。

---

## 在线访问

部署在 GitHub Pages（项目站点，子路径 `/huake-platform-prototype/`）：

- 统一入口（推荐）：https://gitcode-cai.github.io/huake-platform-prototype/
- 基础支撑管理：https://gitcode-cai.github.io/huake-platform-prototype/prototype/index.html
- 数据可视化系统：https://gitcode-cai.github.io/huake-platform-prototype/prototype-viz/index.html

打开 `index.html` 会自动跳到统一外壳 `prototype-all/index.html`。

---

## 目录

| 路径 | 说明 |
|---|---|
| `index.html` | 入口，自动跳转到统一外壳 |
| `prototype-all/` | **统一外壳**：一个可折叠侧边栏装两个模块 |
| `prototype/` | 基础支撑管理（9 个页面，独立可用） |
| `prototype-viz/` | 数据可视化系统（11 个页面，独立可用） |
| `.github/workflows/pages.yml` | GitHub Pages 自动部署 |
| `favicon.svg` | 站点图标 |

> 配套的 PRD、规范书解析与条款台账属内部资料，未纳入本仓库。

---

## 本地打开

不需要任何构建工具、不需要起服务，双击 `index.html` 即可（`file://` 直接可用）。

如果要模拟线上子路径，也可以起一个静态服务器：

```bash
python -m http.server 8000
# 打开 http://127.0.0.1:8000/
```

---

## 技术说明

- 纯 HTML / CSS / 原生 JS，无框架、无打包、无依赖。
- 路由用 hash（`#/bs/...`、`#/viz/...`），因此 GitHub Pages 子路径下刷新不会 404。
- 所有资源引用均为相对路径，可部署在域名任意子目录。
- 数据存 `localStorage`，刷新不丢，清缓存即重置为演示数据。
- 外壳用 iframe 内嵌两个模块（`?embed=1` + `postMessage` 通信），切换模块会重新加载内容区（约 0.2 秒）。

---

## 部署方式

推送到 `main` 分支后，GitHub Actions 自动发布（`Settings → Pages → Source: GitHub Actions`）。

```bash
git add .
git commit -m "docs: 更新"
git push origin main
```
