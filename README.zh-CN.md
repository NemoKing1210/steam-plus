# Steam Plus

[![CI](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/steam-plus/actions/workflows/ci.yml)
[![安装用户脚本](https://img.shields.io/badge/Install-userscript-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)
[![许可证：MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE)

[English](https://github.com/NemoKing1210/steam-plus/blob/main/README.md) · [Deutsch](https://github.com/NemoKing1210/steam-plus/blob/main/README.de.md) · [Русский](https://github.com/NemoKing1210/steam-plus/blob/main/README.ru.md) · [Español](https://github.com/NemoKing1210/steam-plus/blob/main/README.es.md) · [Français](https://github.com/NemoKing1210/steam-plus/blob/main/README.fr.md) · [Português (Brasil)](https://github.com/NemoKing1210/steam-plus/blob/main/README.pt-BR.md) · **简体中文** · [日本語](https://github.com/NemoKing1210/steam-plus/blob/main/README.ja.md) · [한국어](https://github.com/NemoKing1210/steam-plus/blob/main/README.ko.md) · [Polski](https://github.com/NemoKing1210/steam-plus/blob/main/README.pl.md)

一款改进 Steam 商店和 Steam 社区的油猴脚本，提供完整的设置面板和内容翻译
——游戏简介、评测、个人资料留言、新闻和指南——直接在页面上完成。

> **状态：** 早期阶段。设置面板（常规 · 翻译 · 游戏页面 · 价格 · 外部链接 ·
> 附加内容（DLC） · 区域）+ 通过免费的 Google 接口进行内容翻译（无需 API
> 密钥）。更多 Steam 改进即将推出。当前版本和变更记录见
> [CHANGELOG.md](https://github.com/NemoKing1210/steam-plus/blob/main/CHANGELOG.md)。

> 脚本的 `@updateURL` / `@downloadURL` 元数据指向 GitHub 的 `main`
> 分支——下方的原始安装链接始终是最新构建。

## 截图

在真实 Steam 页面上运行的实际脚本。截图中的翻译目标语言设为法语。

![Steam Plus 设置面板，包含常规、翻译、游戏页面、价格、外部链接、附加内容（DLC）、区域、缓存、备份和关于脚本](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/settings-panel.png)

| | |
|---|---|
| ![游戏简介翻译显示在原文下方](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/translation.png)<br>**翻译** — 简介、评测、留言和新闻，显示在原文下方或直接替换原文 | ![区域价格对比表](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/regional-prices.png)<br>**区域价格** — 覆盖 24 个商店区域，高亮最便宜的，实时货币换算 |
| ![附加内容列表](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/add-ons.png)<br>**附加内容（DLC）** — 每个 DLC 的价格和发售日期；登录后显示拥有状态 | ![外部链接标签](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/external-links.png)<br>**外部链接** — 一键访问 SteamDB、ProtonDB、HowLongToBeat 以及自定义链接 |
| ![DLC 图片查看器](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/viewer.png)<br>**图片查看器** — 缩放、平移、旋转并浏览 DLC 图片 | ![快速搜索浮层](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/docs/screenshots/search.png)<br>**快速搜索** — 在任意商店页面跨区域搜索商店内容 |

游戏页面还支持：隐藏你从不查看的区块，以及通过匿名访客请求重新加载受区域限制
的商店页面。

## 快速安装

1. 安装用户脚本管理器（推荐 [Tampermonkey](https://www.tampermonkey.net/)、
   [Violentmonkey](https://violentmonkey.github.io/) 或
   [ScriptCat](https://scriptcat.org/)）。
2. 从 GitHub 安装脚本（原始链接见下方）。

**安装链接（GitHub——最新构建）：**

```
https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js
```

[![安装](https://img.shields.io/badge/Install-GitHub_raw-102436?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-plus/main/steam-plus.user.js)

### 从 URL 安装（管理器控制台）

| 管理器 | 路径 |
|--------|------|
| Tampermonkey | 控制台 → **实用工具** → **从 URL 安装** |
| Violentmonkey | 控制台 → **+** → **从 URL 安装** |
| Greasemonkey | 扩展菜单 → **新建用户脚本** → 粘贴原始链接 |
| ScriptCat | 安装[扩展](https://scriptcat.org/)，然后使用 GitHub 原始链接执行**从 URL 安装** |

通过管理器控制台安装时，粘贴上方的 GitHub 安装链接。

### 手动安装

1. 打开本仓库中已构建的 [`steam-plus.user.js`](https://github.com/NemoKing1210/steam-plus/blob/main/steam-plus.user.js)（或克隆后运行 `npm run build`）。
2. 复制整个文件内容。
3. 在用户脚本管理器中新建脚本并粘贴代码。
4. 保存并启用脚本。

## 更新

脚本包含指向 GitHub 原始文件的 `@updateURL` 和 `@downloadURL`
元数据。受支持的管理器会自动检查更新。

维护者的发布步骤：见 [docs/DEVELOPMENT.md § Releasing](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md#releasing)。

## 功能

**设置**（页眉 **Steam Plus** 按钮或用户脚本管理器菜单）：

- 分页面板——**常规** · **翻译** · **游戏页面** · **价格** · **外部链接** ·
  **附加内容（DLC）** · **区域**（更多分页即将推出）
- Steam 原生深色界面；所有更改在刷新后依然保留
- 界面语言：自动（浏览器）或 **10 种语言**之一——English、Русский、Deutsch、
  Español、Français、Português (Brasil)、简体中文、日本語、한국어、Polski

**翻译**（商店和社区内容）：

- **游戏简介** — 游戏页面上的完整简介以及列表中的简介片段
- **游戏评测** — 商店评测和社区中心的评测卡片
- **个人资料留言** — 个人资料、中心和共享文件中的留言串
- **新闻与活动** — 新闻/活动详情正文和中心摘要
- **指南** — 指南上方的一个「翻译」按钮可一次翻译全部内容：标题、顶部简介和
  每个章节（指南下的留言由「个人资料留言」负责）
- 默认使用免费的 Google 接口——无需 API 密钥，提供可扩展的翻译服务注册表
- 内容出现时**自动**翻译，或通过每个区块的**翻译**按钮
- 在原文**下方**显示译文，或**替换**原文并提供切回原文的按钮
- 目标语言：自动（Steam/浏览器语言）或 14 种常用语言之一
- 按范围开关；全局总开关

**游戏页面**（商店游戏页面）：

- 隐藏你从不查看的区块——截图和预告片、购买选项和捆绑包、「关于这款游戏」、
  DLC 列表、系统需求、用户评测、鉴赏家、活动和公告、详情侧边栏、系列和推荐
- 总开关加按区块开关；默认不隐藏任何内容
- 纯 CSS 隐藏，可适应 Steam 的重新渲染和页面导航

**区域价格**（商店游戏页面）：

- 直接在游戏页面上比较 24 个 Steam 商店区域的游戏价格——你的商店价格固定在
  最上方，高亮最便宜的区域，并显示相对你价格的节省金额
- 完全可配置：总开关和自动加载开关、区域选择、位置（购买选项上方 / 侧边栏 /
  简介下方）、默认行顺序及可点击的表头（点击排序，再次点击反转方向），以及
  逐项显示开关（原价、折扣徽章、节省金额、最便宜高亮、你的价格行）
- 使用 Steam 自带的格式化价格、Steam 绿色折扣徽章、1 小时缓存及手动刷新；
  免费游戏会自动隐藏该区块
- 实时货币换算（ExchangeRate-API + jsDelivr 备用源，缓存时长可配置，设置中
  可查看状态并手动清除）：每个价格自动换算为你的商店货币或任意所选货币，
  汇率来源标注在区块下方

**外部链接**（商店游戏页面）：

- 游戏页面上的其他商店和数据库快捷入口——默认提供 SteamDB、ProtonDB 和
  HowLongToBeat，可放置在购买选项上方、侧边栏或简介下方
- 完全由用户自定义：使用浏览器风格的 URL 模板添加自己的链接（`{name}`
  为游戏标题，`{appid}` 为 Steam id）、自定义网站图标、按链接开关、排序控件
  以及在新标签页打开的选项

**附加内容（DLC）**（商店游戏页面）：

- 列出**游戏的所有 DLC**，包括缩略图、发售日期、价格以及你的账户是否已
  拥有——页眉中的已拥有/总计计数、每行指向对应 DLC 商店页面的链接，以及
  「未拥有优先」排序，让你缺少的内容保持在顶部
- 默认折叠以节省空间；通过页眉的箭头展开
- 点击 DLC 图片打开**内置图片查看器**：适应屏幕、缩放（滚轮、`+`/`−`、
  双击）、拖动平移、旋转、使用 `←`/`→` 或缩略图栏浏览所有 DLC，`Esc`
  关闭；查看器可配置（缩略图栏、循环）并支持键盘操作
- 先读取页面自身的 DLC 列表（名称、价格、已渲染的图片），只向 Steam
  请求页面未提供的内容——发售日期和 Steam 折叠保持的缩略图会逐步填充并
  缓存一天，拥有状态缓存 30 分钟；关闭**DLC 图片**和**发售日期**后，
  Steam 已渲染行的页面将完全不产生请求；附加内容设置分页中提供缓存重置
- 可配置：总开关、位置（购买选项上方 / 侧边栏 / 简介下方）、行顺序、
  已拥有计数、已拥有行、价格、图片和发售日期开关

**区域限制绕过**（受限制的商店页面）：

- 通过匿名访客请求重新加载被「在你的区域不可用」拦截的 `/app/`、`/bundle/`
  和 `/sub/` 页面——不发送账户 Cookie，自动发送 Steam 语言和年龄验证
  Cookie，可选择性覆盖商店国家/地区（`cc`）
- 将访客内容注入当前文档——你已登录的页眉、样式和脚本保持不变；访客初始化
  （评测、系统需求分页、标签）会重放，商店岛屿就地水合，结构不匹配时自动
  回退到整页重写；翻译、区域价格、外部链接、DLC 内容和区块隐藏会自动应用到
  注入的内容；自动模式立即替换错误内容，手动模式先显示一个按钮，失败时显示
  带有「重试」的状态卡片
- 针对 IP 封锁可选 HTTP 代理网关（主机、端口、基本认证、三种 URL 模式）
  ——全部位于「区域」设置分页

底层机制：按翻译服务区分的带 TTL 和 LRU 清理的翻译缓存，加上限制并发的
请求队列——重复访问速度快，对翻译服务更友好。

> 翻译需要联网访问翻译服务（默认服务为 `translate.googleapis.com`）。
> 翻译内容缓存在用户脚本管理器的本地存储中。

## 支持的页面

| 网站 | URL 模式 |
|------|----------|
| Steam 商店 | `https://store.steampowered.com/*` |
| Steam 社区 | `https://steamcommunity.com/*` |

## 开发与贡献

- [docs/DEVELOPMENT.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/DEVELOPMENT.md) — 构建、本地测试、发布
- [docs/ARCHITECTURE.md](https://github.com/NemoKing1210/steam-plus/blob/main/docs/ARCHITECTURE.md) — 模块结构、数据流、扩展约定
- [CONTRIBUTING.md](https://github.com/NemoKing1210/steam-plus/blob/main/CONTRIBUTING.md) — PR 指南和约定
- [SECURITY.md](https://github.com/NemoKing1210/steam-plus/blob/main/SECURITY.md) — 如何报告安全漏洞
- [AGENTS.md](https://github.com/NemoKing1210/steam-plus/blob/main/AGENTS.md) — 面向 AI 编码代理的架构说明

```bash
npm install
npm run dev      # Vite 服务 —— 安装生成的 "dev:" 用户脚本
npm run build    # 生产构建 → dist/ + 复制到仓库根目录
npm run ci       # 与 GitHub Actions 相同的检查
```

需要 Node.js 22（见 `.nvmrc`）。

## 关联声明

本项目**与 Valve 或 Steam 无关**，是独立的社区用户脚本。

## 许可证

[MIT](https://github.com/NemoKing1210/steam-plus/blob/main/LICENSE) — 版权所有 (c) 2026 NemoKing1210
