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

  // 获取固定主页文件夹列表
  async getDefaultFolders() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('defaultFolders', (result) => {
        const defaultFolders = result.defaultFolders || { items: [] };
        // 按 order 排序
        if (defaultFolders.items) {
          defaultFolders.items.sort((a, b) => a.order - b.order);
        }
        resolve(defaultFolders);
      });
    });
  }

  // 渲染固定展开内容
  async renderPinnedExpand() {
    // 1. 检查是否启用固定展开
    if (!this.enabled || !this.folderId) {
      this.container.style.display = 'none';
      if (typeof window.initPinnedFolders === 'function') {
        // 强制执行 initPinnedFolders，跳过 pinnedExpandEnabled 检查
        await window.initPinnedFolders(true);
      }
      return;
    }

    try {
      // 2. 获取固定主页文件夹列表
      const defaultFoldersData = await this.getDefaultFolders();
      const defaultFolders = defaultFoldersData.items || [];

      // 3. 获取固定展开的子项
      const expandItems = await this.getExpandItems(this.folderId);

      // 4. 计算数量分配（固定主页优先，但也要截断）
      const foldersToShow = defaultFolders.slice(0, this.count);
      const remainingSlots = Math.max(0, this.count - foldersToShow.length);
      const expandItemsToShow = expandItems.slice(0, remainingSlots);

      // 5. 清空容器
      this.pinnedFoldersContainer.innerHTML = '';

      // 6. 渲染固定主页文件夹
      console.log('[PinnedExpand] 渲染固定主页文件夹:', foldersToShow.length, '个');
      foldersToShow.forEach((folder) => {
        const folderElement = this.createPinnedFolderElement(folder);
        this.pinnedFoldersContainer.appendChild(folderElement);
        console.log('[PinnedExpand] 已添加固定主页文件夹:', folder.name, 'ID:', folder.id);
      });

      // 7. 渲染固定展开的子项
      console.log('[PinnedExpand] 渲染固定展开子项:', expandItemsToShow.length, '个');
      expandItemsToShow.forEach((item) => {
        const itemElement = this.createItemElement(item);
        this.pinnedFoldersContainer.appendChild(itemElement);
        console.log('[PinnedExpand] 已添加固定展开子项:', item.title, '类型:', item.type);
      });

      // 8. 显示容器并激活当前文件夹
      this.container.style.display = 'flex';
      console.log('[PinnedExpand] 容器已显示，总共', foldersToShow.length + expandItemsToShow.length, '个项目');
      await this.activateCurrentFolder();

      // 9. 重新初始化滚轮切换功能
      if (typeof window.initWheelSwitching === 'function') {
        window.initWheelSwitching();
        console.log('[PinnedExpand] 滚轮切换功能已初始化');
      }

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
    // 首先尝试从默认文件夹配置中获取第一个文件夹
    chrome.storage.sync.get('defaultFolders', (syncResult) => {
      const defaultFolders = syncResult.defaultFolders?.items || [];

      if (defaultFolders.length > 0) {
        // 如果有默认文件夹配置，切换到第一个默认文件夹
        const firstDefaultFolder = defaultFolders[0];
        if (typeof window.switchToFolder === 'function') {
          window.switchToFolder(firstDefaultFolder.id);
          return;
        }
      }

      // 如果没有默认文件夹配置，尝试从 localStorage 获取
      const defaultBookmarkId = localStorage.getItem('defaultBookmarkId');
      if (defaultBookmarkId && typeof window.switchToFolder === 'function') {
        window.switchToFolder(defaultBookmarkId);
        return;
      }

      // 如果都没有，切换到书签栏（ID 为 '1'）
      if (typeof window.switchToFolder === 'function') {
        window.switchToFolder('1');
      } else {
        console.error('switchToFolder function not found');
      }
    });
  }

  // 创建固定主页文件夹元素
  createPinnedFolderElement(folder) {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'pinned-folder-item-container';
    itemContainer.dataset.folderId = folder.id;
    itemContainer.dataset.itemType = 'pinned-folder';
    itemContainer.dataset.order = folder.order;

    const itemElement = document.createElement('div');
    itemElement.className = 'pinned-folder-item';

    const icon = document.createElement('div');
    icon.className = 'folder-icon';
    icon.innerHTML = ICONS.folder;

    itemElement.appendChild(icon);

    const nameSpan = document.createElement('span');
    nameSpan.textContent = folder.name;

    itemContainer.appendChild(itemElement);
    itemContainer.appendChild(nameSpan);

    // 点击事件：切换到该文件夹
    itemContainer.addEventListener('click', () => {
      this.handlePinnedFolderClick(folder);
    });

    return itemContainer;
  }

  // 处理固定主页文件夹点击
  async handlePinnedFolderClick(folder) {
    console.log('Fixed folder clicked:', folder.name, folder.id);
    if (typeof window.switchToFolder === 'function') {
      await window.switchToFolder(folder.id);
    } else {
      console.error('switchToFolder function not found');
    }
  }

  // 激活当前查看的文件夹
  async activateCurrentFolder() {
    return new Promise((resolve) => {
      // 从 sync 获取 defaultFolders，从 local 获取 lastViewedFolder（与 switchToFolder 保持一致）
      chrome.storage.sync.get(['defaultFolders'], (syncData) => {
        chrome.storage.local.get(['lastViewedFolder'], (localData) => {
          const defaultFolders = syncData.defaultFolders?.items || [];
          const lastViewedFolder = localData.lastViewedFolder;

          let folderToActivate;

          if (lastViewedFolder && defaultFolders.some(f => f.id === lastViewedFolder)) {
            folderToActivate = lastViewedFolder;
          } else if (defaultFolders.length > 0) {
            folderToActivate = defaultFolders[0].id;
          }

          if (folderToActivate) {
            const activeItem = this.pinnedFoldersContainer.querySelector(
              `.pinned-folder-item-container[data-folder-id="${folderToActivate}"]`
            );
            if (activeItem) {
              activeItem.classList.add('active');
            }
          }

          resolve();
        });
      });
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
    console.log('Bookmark clicked:', bookmark.title, bookmark.url);
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
    console.log('Expand folder clicked:', folder.title, folder.id);
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
      // 禁用固定展开时，重新初始化固定主页功能
      if (typeof window.initPinnedFolders === 'function') {
        window.initPinnedFolders();
      }
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
