# TabMark 布局和功能调整开发文档

## 一、需求概述

本次更新主要涉及主页面搜索框下方区域的布局和功能调整，包括移除现有功能、修复显示问题、新增核心功能。

### 1.1 核心变更

1. **移除"网站推荐"功能** - 完全删除基于浏览历史的智能推荐功能
2. **修复固定文件夹图标显示问题** - Material Icons 字体图标未正确显示
3. **新增"固定展开"功能** - 替代网站推荐，展示选定文件夹的子项
4. **优化固定主页按钮样式** - 合并布局，简化交互效果

---

## 二、详细需求说明

### 2.1 移除"网站推荐"功能

**当前状态：**
- 功能名称：快捷链接（Quick Links）
- 实现文件：`src/quick-links.js`
- 展示位置：搜索框下方，固定文件夹区域下方
- 功能说明：智能分析浏览历史（最近1个月），按访问频率和时间衰减排序，最多显示10个常访问网站

**变更要求：**
- ✅ 完全移除此功能
- ✅ 删除相关代码文件
- ✅ 清理设置项和存储数据
- ✅ 删除相关样式

**影响范围：**
- `src/quick-links.js` - 完整删除
- `src/index.html` - 删除 quick-links-wrapper 容器和脚本引用
- `src/settings.js` - 删除快捷链接设置逻辑
- `src/output.css` - 删除相关样式
- `chrome.storage` - 清理 `enableQuickLinks`、`fixedShortcuts`、`blacklist` 等键

### 2.2 修复固定文件夹图标显示问题

**当前问题：**
- 代码位置：`src/script.js:1347-1349`
- 实现方式：使用 Material Icons 字体显示 `folder` 文字
- 问题表现：图标未正确显示，显示为 "folder" 文字

```javascript
// 当前实现
const icon = document.createElement('span');
icon.className = 'material-icons';
icon.textContent = 'folder';  // 显示为文字而非图标
```

**解决方案：**
- ✅ 方案A（推荐）：改用 SVG 图标（`src/icons.js:37` 已定义）
- ✅ 方案B：添加 Material Icons CDN 引用到 `index.html`

**推荐实现：**
```javascript
// 使用 SVG 图标
import { ICONS } from './icons.js';
const icon = document.createElement('div');
icon.innerHTML = ICONS.folder;
icon.className = 'folder-icon';
```

### 2.3 新增"固定展开"功能

**功能定位：**
- 替代原"网站推荐"功能
- 位置：搜索框下方（复用 `.quick-links-wrapper` 容器）
- 目的：让用户快速访问指定文件夹中的书签和子文件夹

**核心特性：**

#### 2.3.1 文件夹选择
- 在设置中选择**一个**书签文件夹
- 将该文件夹的**直接子项**（文件夹或书签）平铺展示
- 不展示嵌套层级，只显示第一层子项

#### 2.3.2 展示形式
- **书签项**：显示网站 favicon（32x32px）+ 名称
- **文件夹项**：显示 folder 图标（SVG）+ 名称
- **布局**：圆形图标 + 下方文字，与原网站推荐样式一致

#### 2.3.3 交互行为
- **点击书签**：在当前标签页或新标签页打开（根据全局设置 `openInNewTab`）
- **点击子文件夹**：切换下方书签栏显示该文件夹内容（调用 `switchToFolder()` 函数）
- **右键菜单**：
  - 书签：在新标签页打开、在新窗口打开、在无痕模式打开、复制链接、创建二维码
  - 文件夹：打开所有书签、在新标签页打开、切换到此文件夹

#### 2.3.4 数量配置
- 设置选项：6 / 8 / 10 / 12 个
- 默认值：10 个
- 超出处理：只显示前 N 个项目，不提示截断

#### 2.3.5 设置面板
位置：设置 > 通用 > 固定展开

设置项：
1. **启用固定展开** - 复选框开关
2. **选择展开文件夹** - 下拉选择框（显示所有书签文件夹）
3. **显示数量** - 滑块选择（6/8/10/12）

**存储键设计：**
```javascript
// chrome.storage.sync
{
  "pinnedExpandEnabled": boolean,       // 是否启用（默认：false）
  "pinnedExpandFolderId": string,       // 文件夹ID（默认：null）
  "pinnedExpandCount": number           // 显示数量（默认：10）
}
```

### 2.4 优化固定主页按钮样式

**当前状态：**
- 固定主页按钮单独显示一行
- 切换时有动画和放大效果
- 样式与固定文件夹不统一

**变更要求：**

#### 2.4.1 布局调整
- ✅ 固定主页按钮并入"固定展开"同一行显示
- ✅ 作为第一个项目显示（最左侧）
- ✅ 使用相同的圆形图标布局

#### 2.4.2 样式优化
- ✅ **移除动画**：去除切换时的放大、缩放动画
- ✅ **选中状态**：只用背景色或文字颜色变化表示
- ✅ **配色方案**：跟随原网站推荐的配色
- ✅ **图标调整**：使用 folder 图标（SVG）

#### 2.4.3 实现细节
```css
/* 选中状态样式 */
.pinned-home-button.active {
  background-color: var(--primary-color);  /* 使用主题色 */
  color: white;
}

/* 移除动画 */
.pinned-home-button {
  transition: background-color 0.2s ease;  /* 只保留颜色过渡 */
  /* 移除：transform, scale 等动画属性 */
}
```

---

## 三、技术实施方案

### 3.1 实施阶段

```
阶段 1: 删除快捷链接功能 (1-2天)
  ├── 删除 src/quick-links.js
  ├── 清理 src/index.html 引用
  ├── 清理 src/settings.js 逻辑
  ├── 清理 src/output.css 样式
  └── 清理存储数据

阶段 2: 修复固定文件夹图标 (半天)
  ├── 修改 src/script.js:1347-1356
  └── 使用 SVG 图标替换 Material Icons

阶段 3: 实现固定展开功能 (2-3天)
  ├── 创建 src/pinned-expand.js
  ├── 添加设置面板到 src/index.html
  ├── 集成到 src/settings.js
  └── 实现交互逻辑

阶段 4: 优化固定主页按钮 (1天)
  ├── 合并布局到固定展开行
  ├── 调整样式移除动画
  └── 测试交互效果

阶段 5: 国际化和测试 (1天)
  ├── 更新 9 个语言的 messages.json
  ├── 全面测试功能
  └── 修复 bug
```

### 3.2 关键文件清单

| 文件 | 操作类型 | 修改内容 |
|------|---------|---------|
| `src/quick-links.js` | **删除** | 完整删除文件 |
| `src/pinned-expand.js` | **新建** | 固定展开功能核心逻辑 |
| `src/index.html` | **修改** | 删除 quick-links UI，添加 pinned-expand UI，合并固定主页按钮 |
| `src/settings.js` | **修改** | 删除快捷链接设置，添加固定展开设置管理 |
| `src/script.js` | **修改** | 修改固定文件夹图标为 SVG，清理快捷链接引用 |
| `src/output.css` | **修改** | 删除 quick-links 样式，添加 pinned-expand 样式 |
| `src/background.js` | **修改** | 添加数据清理逻辑 |
| `_locales/*/messages.json` | **修改** | 删除快捷链接相关消息，添加固定展开消息（9个语言） |

### 3.3 新模块结构（src/pinned-expand.js）

```javascript
// 核心类
class PinnedExpandManager {
  constructor()                      // 初始化管理器
  async init()                       // 初始化功能
  async loadSettings()               // 加载配置
  async renderPinnedExpand()         // 渲染固定展开内容
  async getExpandItems(folderId)     // 获取文件夹子项
  truncateItems(items, count)        // 截取指定数量
  handleBookmarkClick(bookmark)      // 处理书签点击
  handleFolderClick(folder)          // 处理文件夹点击
  getFaviconUrl(url)                 // 获取 favicon URL
}

// 导出函数
export async function initPinnedExpand()
export function togglePinnedExpandVisibility(show)
```

### 3.4 国际化消息键

#### 需要删除的键
```json
{
  "enableQuickLinks": { ... },
  "quickLinksSettings": { ... },
  "quickLinksDescription": { ... },
  "editQuickLink": { ... },
  "deleteQuickLink": { ... },
  "confirmDeleteQuickLinkMessage": { ... }
}
```

#### 需要添加的键（中文）
```json
{
  "pinnedExpandTitle": {
    "message": "固定展开",
    "description": "固定展开功能标题"
  },
  "pinnedExpandDescription": {
    "message": "选择一个书签文件夹，将其子项平铺展示在搜索框下方，方便快速访问。",
    "description": "固定展开功能说明"
  },
  "enablePinnedExpand": {
    "message": "启用固定展开",
    "description": "固定展开开关标签"
  },
  "selectExpandFolder": {
    "message": "选择展开文件夹",
    "description": "文件夹选择下拉框标签"
  },
  "expandItemCount": {
    "message": "显示数量",
    "description": "显示数量滑块标签"
  },
  "expandItemCountDescription": {
    "message": "最多显示 {0} 个项目",
    "description": "显示数量说明"
  },
  "homeFolderButton": {
    "message": "主页",
    "description": "固定主页按钮文本"
  }
}
```

**注意**：需要同时更新所有 9 个语言的 messages.json：
- zh_CN（简体中文）
- en（英语）
- ja（日语）
- ko（韩语）
- es（西班牙语）
- fr（法语）
- de（德语）
- zh_HK（繁体中文-香港）
- zh_TW（繁体中文-台湾）

---

## 四、数据迁移方案

### 4.1 迁移时机
在 `chrome.runtime.onInstalled` 事件中执行，检测 `details.reason === 'update'`

### 4.2 清理旧数据

```javascript
// src/background.js
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    // 清理 chrome.storage.sync
    chrome.storage.sync.remove([
      'enableQuickLinks',
      'fixedShortcuts',
      'blacklist'
    ]);

    // 设置新功能默认值
    chrome.storage.sync.set({
      pinnedExpandEnabled: false,    // 默认关闭
      pinnedExpandCount: 10          // 默认 10 个
    });
  }
});
```

---

## 五、潜在风险和注意事项

### 5.1 数据清理风险
- **问题**：用户已设置的固定快捷方式将被删除
- **缓解措施**：在更新日志中明确说明功能变更

### 5.2 Material Icons 字体问题
- **问题**：如果字体未正确加载，图标显示为文字
- **解决方案**：改用 SVG 图标（推荐）

### 5.3 性能问题
- **问题**：文件夹子项过多可能影响渲染性能
- **缓解措施**：
  - 严格限制显示数量（最多 12 个）
  - 使用 `DocumentFragment` 批量渲染
  - 懒加载 favicon

### 5.4 文件夹切换逻辑
- **问题**：点击固定展开中的子文件夹可能与现有书签栏切换冲突
- **解决方案**：
  - 复用 `script.js` 中的 `switchToFolder()` 函数
  - 确保更新固定文件夹的激活状态
  - 保存最后查看的文件夹到 `lastViewedFolder`

### 5.5 样式一致性
- **问题**：新样式可能与原有样式差异过大
- **解决方案**：
  - 复用 `.quick-link-item` 基础样式
  - 保持圆形设计和阴影效果
  - 只移除动画，保持其他视觉效果

---

## 六、验收标准

### 6.1 功能验收

- [ ] 网站推荐功能完全移除，不再显示
- [ ] 固定文件夹图标正确显示（SVG 图标）
- [ ] 固定展开功能正常工作：
  - [ ] 可以在设置中选择文件夹
  - [ ] 可以配置显示数量（6/8/10/12）
  - [ ] 书签和子文件夹正确显示
  - [ ] 点击书签可以打开网站
  - [ ] 点击子文件夹可以切换下方书签栏
- [ ] 固定主页按钮已并入同一行
- [ ] 选中状态只有背景色变化，无动画效果
- [ ] 样式与原网站推荐一致

### 6.2 兼容性验收

- [ ] Chrome 浏览器测试通过
- [ ] Edge 浏览器测试通过
- [ ] 深色模式显示正常
- [ ] 浅色模式显示正常

### 6.3 国际化验收

- [ ] 所有 9 个语言的界面文字正确显示
- [ ] 设置面板文字已翻译
- [ ] 无遗漏的消息键

### 6.4 性能验收

- [ ] 固定展开渲染速度 < 100ms
- [ ] 文件夹切换流畅，无卡顿
- [ ] 内存占用无明显增加

---

## 七、更新日志（建议）

### v1.246

**重大变更：**
- 移除"网站推荐"（快捷链接）功能
- 新增"固定展开"功能，支持展示指定文件夹的书签和子文件夹

**改进：**
- 修复固定文件夹图标显示问题，改用 SVG 图标
- 优化固定主页按钮样式，移除动画效果
- 统一搜索框下方区域的布局和配色

**技术细节：**
- 删除 `src/quick-links.js` 及相关代码
- 新增 `src/pinned-expand.js` 模块
- 清理存储数据：`enableQuickLinks`、`fixedShortcuts`、`blacklist`

---

## 八、相关资源

### 8.1 关键代码位置

| 功能 | 文件路径 | 行号 |
|------|----------|------|
| 固定文件夹初始化 | `src/script.js` | 1323-1409 |
| 固定文件夹图标 | `src/script.js` | 1347-1356 |
| 书签文件夹右键菜单 | `src/script.js` | 3139-3341 |
| 设置管理器 | `src/settings.js` | - |
| SVG 图标库 | `src/icons.js` | - |
| 国际化消息 | `_locales/*/messages.json` | - |

### 8.2 Chrome Extension APIs

- `chrome.bookmarks` - 读取和搜索书签
- `chrome.storage.sync` - 同步设置数据
- `chrome.tabs` - 标签页管理
- `chrome.i18n` - 国际化消息

---

## 九、开发环境

### 9.1 测试方法

由于 TabMark 是浏览器扩展且无构建步骤，直接加载到浏览器测试：

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录
5. 修改代码后点击"刷新"图标重新加载

### 9.2 调试方法

- **新标签页**：F12 打开 DevTools
- **后台脚本**：扩展页面 → "检查服务工作进程"
- **侧边栏**：右键侧边栏 → "检查"

---

## 十、后续优化（可选）

1. **固定展开高级功能**：
   - 支持拖拽排序固定展开项
   - 支持隐藏特定子项
   - 支持自定义子项图标

2. **性能优化**：
   - 实现虚拟滚动（如果显示数量增加）
   - 缓存文件夹结构减少 API 调用

3. **用户体验**：
   - 添加空状态提示（文件夹为空时）
   - 添加快捷键支持
   - 添加搜索过滤功能

---

**文档版本**：v1.0
**创建日期**：2025-12-18
**最后更新**：2025-12-18
