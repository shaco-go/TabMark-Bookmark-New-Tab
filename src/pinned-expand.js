// 固定展开功能模块
import { ICONS } from './icons.js';

// 固定展开管理器类
class PinnedExpandManager {
  constructor() {
    this.container = document.querySelector('.pinned-folders-wrapper');
    this.pinnedFoldersContainer = document.getElementById('pinned-folders');
    this.enabled = false;
    this.folderId = null;
    this.count = 10; // 默认显示10个
  }

  // 初始化
  async init() {
    await this.loadSettings();
    if (this.enabled && this.folderId) {
      await this.renderPinnedExpand();
    }
  }

  // 加载设置
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['pinnedExpandEnabled', 'pinnedExpandFolderId', 'pinnedExpandCount'],
        (result) => {
          this.enabled = result.pinnedExpandEnabled || false;
          this.folderId = result.pinnedExpandFolderId || null;
          this.count = result.pinnedExpandCount || 10;
          resolve();
        }
      );
    });
  }

  // 渲染固定展开内容
  async renderPinnedExpand() {
    if (!this.enabled || !this.folderId) {
      this.container.style.display = 'none';
      return;
    }

    try {
      const items = await this.getExpandItems(this.folderId);
      const truncatedItems = this.truncateItems(items, this.count);

      // 清空容器
      this.pinnedFoldersContainer.innerHTML = '';

      // 添加固定主页按钮作为第一个项目
      this.addHomeButton();

      // 渲染固定展开项目
      truncatedItems.forEach((item) => {
        const itemElement = this.createItemElement(item);
        this.pinnedFoldersContainer.appendChild(itemElement);
      });

      this.container.style.display = 'flex';
    } catch (error) {
      console.error('Error rendering pinned expand:', error);
      this.container.style.display = 'none';
    }
  }

  // 添加固定主页按钮
  addHomeButton() {
    const homeContainer = document.createElement('div');
    homeContainer.className = 'pinned-folder-item-container pinned-home-button';
    homeContainer.dataset.isHome = 'true';

    const homeItem = document.createElement('div');
    homeItem.className = 'pinned-folder-item';

    const homeIcon = document.createElement('div');
    homeIcon.className = 'folder-icon';
    homeIcon.innerHTML = ICONS.home;

    homeItem.appendChild(homeIcon);

    const homeName = document.createElement('span');
    homeName.textContent = chrome.i18n.getMessage('homeFolderButton') || '主页';

    homeContainer.appendChild(homeItem);
    homeContainer.appendChild(homeName);

    // 点击事件：切换到默认书签文件夹
    homeContainer.addEventListener('click', () => {
      this.handleHomeClick();
    });

    this.pinnedFoldersContainer.appendChild(homeContainer);
  }

  // 处理主页按钮点击
  handleHomeClick() {
    // 获取默认书签文件夹并切换
    chrome.storage.local.get(['defaultBookmarkId'], (result) => {
      const defaultId = result.defaultBookmarkId;
      if (defaultId && typeof window.switchToFolder === 'function') {
        window.switchToFolder(defaultId);
      } else {
        // 如果没有设置默认文件夹，切换到书签栏
        chrome.bookmarks.getTree((tree) => {
          const bookmarksBar = tree[0].children.find(
            (node) => node.id === '1'
          );
          if (bookmarksBar && typeof window.switchToFolder === 'function') {
            window.switchToFolder(bookmarksBar.id);
          }
        });
      }
    });
  }

  // 创建项目元素
  createItemElement(item) {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'pinned-folder-item-container';
    itemContainer.dataset.itemId = item.id;
    itemContainer.dataset.itemType = item.type; // 'folder' 或 'bookmark'

    const itemElement = document.createElement('div');
    itemElement.className = 'pinned-folder-item';

    const icon = document.createElement('div');
    icon.className = 'folder-icon';

    if (item.type === 'folder') {
      // 文件夹使用 folder 图标
      icon.innerHTML = ICONS.folder;
    } else {
      // 书签使用 favicon
      const img = document.createElement('img');
      img.src = this.getFaviconUrl(item.url);
      img.alt = item.title;
      img.loading = 'lazy';
      img.addEventListener('error', function () {
        this.src = '../images/placeholder-icon.svg';
      });
      icon.appendChild(img);
    }

    itemElement.appendChild(icon);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.title;

    itemContainer.appendChild(itemElement);
    itemContainer.appendChild(nameSpan);

    // 添加点击事件
    if (item.type === 'folder') {
      itemContainer.addEventListener('click', () => {
        this.handleFolderClick(item);
      });
    } else {
      itemContainer.addEventListener('click', () => {
        this.handleBookmarkClick(item);
      });
    }

    return itemContainer;
  }

  // 获取文件夹子项
  async getExpandItems(folderId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.getChildren(folderId, (children) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const items = children.map((child) => ({
          id: child.id,
          title: child.title,
          url: child.url,
          type: child.url ? 'bookmark' : 'folder',
        }));

        resolve(items);
      });
    });
  }

  // 截取指定数量的项目
  truncateItems(items, count) {
    return items.slice(0, count);
  }

  // 处理书签点击
  handleBookmarkClick(bookmark) {
    chrome.storage.sync.get(['openInNewTab'], (result) => {
      const openInNewTab = result.openInNewTab !== false;

      if (openInNewTab) {
        window.open(bookmark.url, '_blank');
      } else {
        window.location.href = bookmark.url;
      }
    });
  }

  // 处理文件夹点击
  handleFolderClick(folder) {
    // 切换下方书签栏显示该文件夹内容
    if (typeof window.switchToFolder === 'function') {
      window.switchToFolder(folder.id);
    } else {
      console.error('switchToFolder function not found');
    }
  }

  // 获取 favicon URL
  getFaviconUrl(url) {
    const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
    faviconUrl.searchParams.set('pageUrl', url);
    faviconUrl.searchParams.set('size', '32');
    faviconUrl.searchParams.set('cache', '1');
    return faviconUrl.toString();
  }

  // 切换显示状态
  toggleVisibility(show) {
    if (show && this.folderId) {
      this.renderPinnedExpand();
    } else {
      this.container.style.display = 'none';
    }
  }

  // 更新设置
  async updateSettings(settings) {
    if (settings.hasOwnProperty('enabled')) {
      this.enabled = settings.enabled;
    }
    if (settings.hasOwnProperty('folderId')) {
      this.folderId = settings.folderId;
    }
    if (settings.hasOwnProperty('count')) {
      this.count = settings.count;
    }

    await this.renderPinnedExpand();
  }
}

// 导出初始化函数
export async function initPinnedExpand() {
  const manager = new PinnedExpandManager();
  await manager.init();

  // 将管理器实例挂载到 window 对象，供其他模块使用
  window.pinnedExpandManager = manager;

  return manager;
}

// 导出切换显示函数
export function togglePinnedExpandVisibility(show) {
  if (window.pinnedExpandManager) {
    window.pinnedExpandManager.toggleVisibility(show);
  }
}
