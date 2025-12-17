# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TabMark is a Chrome/Edge browser extension (Manifest V3) that transforms bookmarks into a customizable new tab page with AI-powered search. It supports Chinese, English, and 7 other languages.

**Website**: www.ainewtab.app

## Development Workflow

### Testing the Extension

Since this is a browser extension with no build step, load it directly in Chrome/Edge:

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project root directory
4. Reload the extension after making changes

### Key Files & Commands

- **No build process**: This project uses plain JavaScript ES modules with pre-compiled Tailwind CSS (`src/output.css`)
- **No test suite**: Manual testing only
- **Localization files**: Located in `_locales/{locale}/messages.json` (支持 zh_CN, en, ja, ko, es, fr, de, zh_HK, zh_TW)

## Architecture

### Extension Structure

```
TabMark Extension
├── New Tab Page (chrome_url_overrides)
│   └── src/index.html + src/script.js (主页面)
├── Side Panel (side_panel API)
│   └── src/sidepanel.html + src/sidepanel-manager.js
├── Background Service Worker
│   └── src/background.js (消息路由、标签页管理、命令处理)
└── Content Scripts (注入到所有网页)
    ├── src/content.js (浮动球功能)
    └── src/sidepanel-navigation.js (侧边栏导航)
```

### Key Components

**Core Pages:**
- `src/index.html`: New tab override page, includes sidebar with bookmark folders and main content area
- `src/script.js`: Main logic for new tab page - bookmark rendering, search, drag-and-drop sorting
- `src/sidepanel.html`: Side panel UI (Alt+B / Command+B)
- `src/sidepanel-manager.js`: Side panel bookmark management

**Background:**
- `src/background.js`: Service worker handling:
  - Message routing between content scripts, pages, and side panel
  - Tab creation with deduplication (`createTab` function with `openingTabs` Set)
  - Command handling (`open_side_panel`)
  - Extension lifecycle (onInstalled)

**Content Scripts:**
- `src/content.js`: Floating ball on web pages - displays search shortcuts and bookmarks
- `src/sidepanel-navigation.js`: Handles navigation within side panel pages

**Feature Modules (ES Modules):**
- `src/search-engine-dropdown.js`: `SearchEngineManager` class - manages 10+ search engines (Google, Bing, ChatGPT, Kimi, 豆包, etc.), handles dropdown UI and search URL generation
- `src/settings.js`: `SettingsManager` class - theme, wallpaper, floating ball, quick links, link opening behavior
- `src/wallpaper.js`: Wallpaper management - 10 presets + custom upload, Bing daily wallpaper
- `src/icons.js`: Exports `ICONS` object with SVG icons for all search engines and UI elements
- `src/feature-tips.js`: Onboarding tips and feature discovery
- `src/gesture-navigation.js`: Mouse wheel navigation for bookmarks
- `src/quick-links.js`: Browser shortcuts (history, downloads, passwords, extensions)
- `src/welcome.js`: Welcome message and onboarding
- `src/localization.js`: i18n helper - `getLocalizedMessage()` function

**Third-party Libraries (committed to repo):**
- `src/lodash.min.js`: Utility functions (debounce, throttle, etc.)
- `src/Sortable.min.js`: Drag-and-drop sorting for bookmarks
- `src/qrcode.min.js`: QR code generation

### Important Patterns

1. **Storage Usage:**
   - `chrome.storage.local`: Large data (bookmarks cache, wallpaper data)
   - `chrome.storage.sync`: User settings (synced across devices)
   - Key storage keys: `defaultBookmarkId`, `openInNewTab`, `sidepanelOpenInNewTab`, `sidepanelOpenInSidepanel`, `themeMode`, `backgroundImage`

2. **Message Passing:**
   - All cross-context communication goes through `chrome.runtime.sendMessage()` / `chrome.runtime.onMessage`
   - Common actions: `navigateHome`, `navigateSettings`, `fetchBookmarks`, `openInNewTab`, `openAllBookmarks`, `openSidePanel`
   - Content scripts → Background → Pages/Side panel

3. **Internationalization:**
   - Use `getLocalizedMessage(key)` from `localization.js` for all user-facing text
   - HTML elements with `data-i18n` attribute are auto-localized on page load
   - Add new messages to all `_locales/{locale}/messages.json` files

4. **Chrome Extension APIs:**
   - `chrome.bookmarks`: Read and search bookmarks
   - `chrome.tabs`: Tab management
   - `chrome.sidePanel`: Side panel control
   - `chrome.commands`: Keyboard shortcuts (Alt+B / Command+B)
   - `chrome.storage`: Persistent storage
   - `chrome.history`: History search for suggestions

5. **Module Imports:**
   - Use ES module imports (`import { ... } from './module.js'`) in all new code
   - Always include `.js` extension in import paths
   - Entry points use `type="module"` in `<script>` tags

## Coding Standards

### Variable Naming & Comments
- **变量名**: Use English (e.g., `bookmarkTreeNodes`, `defaultSearchEngine`, `contextMenu`)
- **代码注释**: Use Chinese (e.g., `// 当扩展安装或更新时触发`, `// 创建二维码函数`)

### Chrome Extension Best Practices
- **Avoid duplicate tabs**: Use the `openingTabs` Set pattern in `background.js:57-91` to prevent rapid-fire duplicate tab creation
- **Message handlers**: Always use `sendResponse()` and return `true` for async operations
- **Storage throttling**: Batch storage writes using the `STORAGE_WRITE_INTERVAL` pattern (see `script.js:26`)
- **Content script isolation**: Check if selected text is within extension's Shadow DOM before processing (see `content.js:6-18`)

### UI Patterns
- **Tailwind CSS**: Use utility classes from `output.css` (pre-compiled, no build step needed)
- **Dark mode**: All UI supports light/dark themes via `themeMode` setting and CSS variables
- **Accessibility**: Use semantic HTML and `data-i18n` for screen readers

## Common Tasks

### Adding a New Search Engine
1. Add icon SVG to `src/icons.js` ICONS object
2. Update `SearchEngineManager` in `src/search-engine-dropdown.js`:
   - Add to `this.searchEngines` array with name, iconKey, url pattern
   - Update `getSearchUrl()` if special URL handling needed
3. Add localized name to all `_locales/{locale}/messages.json` files

### Adding a New Setting
1. Add UI in `src/index.html` (or `src/sidepanel.html`)
2. Add checkbox/control and handler in `src/settings.js` SettingsManager class:
   - Add to `loadSavedSettings()`
   - Add to `initEventListeners()`
   - Save to `chrome.storage.sync`
3. Add default value in `src/background.js` onInstalled handler
4. Add i18n keys to all `_locales/{locale}/messages.json`

### Modifying the Context Menu
- Bookmark context menu: See `script.js` (右键菜单logic for bookmarks)
- Folder context menu: See `script.js` (bookmarkFolderContextMenu)
- Context menu HTML is dynamically generated, not in index.html

### Debugging Tips
- Use `console.log()` liberally - logs appear in different DevTools depending on context:
  - Background: Extensions page → "Inspect service worker"
  - New tab page: Regular DevTools (F12)
  - Side panel: Right-click side panel → "Inspect"
  - Content scripts: Page's DevTools → Console (filter by extension ID)
- Check `chrome.runtime.lastError` after all async Chrome API calls
- Use `chrome://extensions` → "Errors" button to see extension errors

## Known Constraints

- **Chrome Web Store policy**: Chrome版本 cannot simultaneously modify new tab page and search functionality, so Chrome store version may lag behind (see README)
- **Edge Add-ons**: No such restriction, can publish full feature set
- **Manifest V3**: Must use service worker (不能使用 persistent background page), event-driven architecture required
- **No build system**: If you need to modify Tailwind CSS, you must set up the build process yourself (currently output.css is pre-compiled)

## Chrome Store Status (as of 2024)

- Chrome Web Store: v1.243 (actually v1.241, rolled back from v1.242)
- Edge Add-ons: v1.245 (under review)
- GitHub: v1.245 (latest)
