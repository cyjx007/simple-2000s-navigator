

/**
 * 导航页面 - 主界面逻辑
 * 优化版本：精简代码，移除重复逻辑
 */

// ===== 工具函数 =====
const $ = id => document.getElementById(id);

// ===== 搜索栏 =====
const searchEngines = {
    google: {
        url: 'https://www.google.com/search',
        icon: 'https://www.google.com/favicon.ico'
    },
    bing: {
        url: 'https://www.bing.com/search',
        icon: 'https://www.bing.com/favicon.ico'
    },
    baidu: {
        url: 'https://www.baidu.com/s',
        icon: 'https://www.baidu.com/favicon.ico'
    }
};

// ===== 加载状态管理 =====
const LoadingManager = {
    init() {
        this.overlay = $('loadingOverlay');
        this.textElement = this.overlay?.querySelector('.loading-text');
    },
    show(text = '正在处理中...') {
        if (this.overlay && this.textElement) {
            this.textElement.textContent = text;
            this.overlay.classList.remove('is-hidden');
        }
    },
    hide() {
        if (this.overlay) this.overlay.classList.add('is-hidden');
    }
};

// ===== 可访问性管理 =====
const AccessibilityManager = {
    lastFocusedElement: null,
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },
    handleKeyDown(e) {
        // 快捷键已取消
    },
    openModal(modalId) {
        const modal = $(modalId);
        if (!modal) return;
        this.lastFocusedElement = document.activeElement;
        modal.classList.remove('is-hidden');
        document.body.style.overflow = 'hidden';
    },
    closeModal(modalId) {
        const modal = $(modalId);
        if (!modal) return;
        modal.classList.add('is-hidden');
        if (this.lastFocusedElement) {
            setTimeout(() => this.lastFocusedElement.focus(), 100);
        }
        document.body.style.overflow = '';
    }
};

const ModalManager = {
    modals: {},
    init() {
        this.modals = {
            settings: { id: 'settingsPanel', openFn: openSettings, closeFn: closeSettings },
            addLink: { id: 'addLinkModal', openFn: openAddLinkModal, closeFn: closeAddLinkModal },
            editLink: { id: 'editLinkModal', openFn: openEditLinkModal, closeFn: closeEditLinkModal },
            categoryManage: { id: 'categoryManageModal', openFn: openCategoryManageModal, closeFn: closeCategoryManageModal },
            weatherSettings: { id: 'weatherSettingsModal', openFn: openWeatherSettingsModal, closeFn: closeWeatherSettingsModal },
            searchEngine: { id: 'searchEngineModal' }
        };
    },
    open(modalName, ...args) {
        const modal = this.modals[modalName];
        if (modal) {
            if (modal.openFn) {
                modal.openFn(...args);
            }
            AccessibilityManager.openModal(modal.id);
        }
    },
    close(modalName) {
        const modal = this.modals[modalName];
        if (modal) {
            if (modal.closeFn) {
                modal.closeFn();
            }
            AccessibilityManager.closeModal(modal.id);
        }
    }
};

// 更新日历显示
function updateCalendar() {
  const calendarLabel = document.getElementById('calendar-label');
  if (calendarLabel) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // 天干地支年份计算
    const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    const ganZhiYear = gan[ganIndex] + zhi[zhiIndex];

    // 获取星期
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[now.getDay()];

    // 简化显示
    calendarLabel.textContent = `${year}年${month}月${day}日(${ganZhiYear}年 星期${weekday})`;
  }
}

// 天气管理
const WeatherManager = {
  weatherElement: null,
  lastUpdate: 0,
  updateInterval: 30 * 60 * 1000, // 30分钟更新一次

  init() {
    this.weatherElement = document.getElementById('weather-info');
    if (this.weatherElement) {
      // 添加点击事件
      this.weatherElement.addEventListener('click', () => {
        ModalManager.open('weatherSettings');
      });

      this.updateWeather();
      // 每30分钟更新一次天气
      setInterval(() => this.updateWeather(), this.updateInterval);
    }
  },

  getSettings() {
    const data = DataManager.getData();
    return data.weatherSettings || { cityCode: '', apiKey: '' };
  },

  saveSettings(settings) {
    const data = DataManager.getData();
    data.weatherSettings = settings;
    DataManager.saveData(data);
  },

  async updateWeather() {
    try {
      const settings = this.getSettings();

      // 检查是否配置了API Key
      if (!settings.apiKey) {
        this.weatherElement.textContent = '请先配置高德API Key';
        return;
      }

      // 构建高德天气API URL
      const baseUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';
      const params = new URLSearchParams({
        key: settings.apiKey,
        city: settings.cityCode || '110000', // 默认北京
        extensions: 'base' // 只获取实况天气
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === '1' && data.lives && data.lives.length > 0) {
        const weatherData = data.lives[0];
        const province = weatherData.province || '';
        const city = weatherData.city || '未知';
        const weather = weatherData.weather || '未知';
        const temperature = weatherData.temperature || '未知';
        const winddirection = weatherData.winddirection || '';
        const windpower = weatherData.windpower || '';
        const humidity = weatherData.humidity || '';

        // 构建更丰富的天气信息
        let weatherText = `${province}${city} ${weather} ${temperature}°C`;

        // 添加风力信息（如果有）
        if (winddirection && windpower) {
          weatherText += ` ${winddirection}风${windpower}级`;
        }

        // 添加湿度信息（如果有）
        if (humidity) {
          weatherText += ` 湿度${humidity}%`;
        }

        this.weatherElement.textContent = weatherText;
        this.lastUpdate = Date.now();
      } else {
        const errorInfo = data.info || '未知错误';
        this.weatherElement.textContent = `天气获取失败: ${errorInfo}`;
      }
    } catch (error) {
      console.error('获取天气失败:', error);
      this.weatherElement.textContent = '天气获取失败';
    }
  }
};

// 更新同步按钮显示状态
function updateSyncButtonsVisibility() {
  const settings = CloudflareSync.getSettings();
  const syncButtons = document.querySelectorAll('.sync-btn');
  const loginBtn = document.getElementById('loginBtn');

  if (settings.verified) {
    // 已验证，显示同步按钮，隐藏登录按钮
    syncButtons.forEach(btn => btn.style.display = 'inline-block');
    if (loginBtn) loginBtn.style.display = 'none';
  } else {
    // 未验证，隐藏同步按钮，显示登录按钮
    syncButtons.forEach(btn => btn.style.display = 'none');
    if (loginBtn) loginBtn.style.display = 'inline-block';
  }
}

// 登录按钮处理
async function login() {
  const loginBtn = document.getElementById('loginBtn');
  const syncStatus = document.getElementById('syncStatus');

  loginBtn.disabled = true;
  loginBtn.textContent = '登录中...';
  syncStatus.textContent = '';

  try {
    // 显示加载状态
    LoadingManager.show('正在验证登录信息...');

    // 获取用户输入的最新配置
    const workerUrl = document.getElementById('workerUrl').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();

    // 临时设置配置用于验证
    const originalWorkerUrl = CloudflareSync.workerUrl;
    const originalApiToken = CloudflareSync.apiToken;
    CloudflareSync.workerUrl = workerUrl;
    CloudflareSync.apiToken = apiToken;

    // 调用验证配置
    const verifyResult = await CloudflareSync.verifyConfig();

    if (verifyResult.success) {
      // 登录成功，保存配置
      const settings = {
        workerUrl: workerUrl,
        apiToken: apiToken,
        verified: true
      };
      CloudflareSync.saveSettings(settings);

      // 更新同步按钮显示状态
      updateSyncButtonsVisibility();

      // 更新配置状态显示
      updateConfigStatus(settings);

      syncStatus.textContent = '✓ 登录成功';
      syncStatus.style.color = 'green';
    } else {
      // 登录失败，恢复原有配置
      CloudflareSync.workerUrl = originalWorkerUrl;
      CloudflareSync.apiToken = originalApiToken;

      syncStatus.textContent = '✗ ' + verifyResult.message;
      syncStatus.style.color = 'red';
    }
  } catch (error) {
    syncStatus.textContent = '✗ 登录失败: ' + error.message;
    syncStatus.style.color = 'red';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '登录';
    LoadingManager.hide();
  }
}

// 设置面板控制
function openSettings() {
  // 加载已保存的设置
  const settings = CloudflareSync.getSettings();
  document.getElementById('workerUrl').value = settings.workerUrl || '';
  document.getElementById('apiToken').value = settings.apiToken || '';

  // 更新配置状态显示
  updateConfigStatus(settings);

  // 更新同步按钮显示状态
  updateSyncButtonsVisibility();

  // 使用可访问性管理器打开模态框
  AccessibilityManager.openModal('settingsPanel');
}

// 更新配置状态显示
function updateConfigStatus(settings) {
  const configStatus = document.getElementById('configStatus');
  const configStatusText = document.getElementById('configStatusText');
  const syncInfo = document.getElementById('syncInfo');
  const downloadBtn = document.getElementById('downloadFromCloudBtn');
  const uploadBtn = document.getElementById('uploadToCloudBtn');

  const hasCredentials = settings.workerUrl && settings.apiToken;
  const isVerified = settings.verified === true;

  if (isVerified) {
    // 已验证配置状态
    configStatus.classList.remove('is-hidden');
    configStatus.classList.remove('config-status--pending', 'config-status--unconfigured');
    configStatus.classList.add('config-status--verified');
    configStatusText.innerHTML = '✓ <strong>已配置云端同步</strong><br>Worker URL: ' + settings.workerUrl;

    // 显示同步信息
    syncInfo.classList.remove('is-hidden');
    updateSyncInfo();

    // 启用同步按钮
    downloadBtn.disabled = false;
    uploadBtn.disabled = false;
  } else if (hasCredentials) {
    // 有凭据但未验证状态
    configStatus.classList.remove('is-hidden');
    configStatus.classList.remove('config-status--verified', 'config-status--unconfigured');
    configStatus.classList.add('config-status--pending');
    configStatusText.innerHTML = '⚠️ <strong>配置待验证</strong><br>已填写配置信息，请点击同步按钮验证配置';

    // 隐藏同步信息
    syncInfo.classList.add('is-hidden');

    // 启用同步按钮用于验证
    downloadBtn.disabled = false;
    uploadBtn.disabled = false;
  } else {
    // 未配置状态
    configStatus.classList.remove('is-hidden');
    configStatus.classList.remove('config-status--verified', 'config-status--pending');
    configStatus.classList.add('config-status--unconfigured');
    configStatusText.innerHTML = '⚠️ <strong>未配置云端同步</strong><br>请填写 Worker URL 和 API Token 以启用云端数据同步功能';

    // 隐藏同步信息
    syncInfo.classList.add('is-hidden');

    // 禁用同步按钮
    downloadBtn.disabled = true;
    uploadBtn.disabled = true;
  }
}

// 更新同步信息
function updateSyncInfo() {
  const data = DataManager.getData();
  const lastSyncTime = document.getElementById('lastSyncTime');
  const syncStatusInfo = document.getElementById('syncStatusInfo');

  if (data.meta && data.meta.lastUpdate) {
    const lastUpdate = new Date(data.meta.lastUpdate);
    const now = new Date();
    const diffMs = now - lastUpdate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeText = '';
    if (diffMins < 1) {
      timeText = '刚刚';
    } else if (diffMins < 60) {
      timeText = diffMins + '分钟前';
    } else if (diffHours < 24) {
      timeText = diffHours + '小时前';
    } else {
      timeText = diffDays + '天前';
    }

    lastSyncTime.textContent = '最后更新: ' + timeText + ' (' + lastUpdate.toLocaleString('zh-CN') + ')';
  } else {
    lastSyncTime.textContent = '最后更新: 从未同步';
  }

  // 检查是否需要同步
  const needSync = localStorage.getItem(DataManager.SYNC_KEY) === 'true';
  if (needSync) {
    syncStatusInfo.innerHTML = '<span style="color: #ff9800;">●</span> 本地数据有更新，等待同步';
  } else {
    syncStatusInfo.innerHTML = '<span style="color: #4caf50;">●</span> 数据已同步';
  }
}

function closeSettings() {
  // 获取当前保存的设置
  const currentSettings = CloudflareSync.getSettings();

  // 获取输入框的值
  const newWorkerUrl = document.getElementById('workerUrl').value.trim();
  const newApiToken = document.getElementById('apiToken').value.trim();

  // 检查是否修改了配置
  const configChanged = currentSettings.workerUrl !== newWorkerUrl ||
                       currentSettings.apiToken !== newApiToken;

  // 保存设置
  const settings = {
    workerUrl: newWorkerUrl,
    apiToken: newApiToken
  };

  if (configChanged) {
    // 配置已修改，清除验证状态
    settings.verified = false;
  } else {
    // 配置未修改，保持原有验证状态
    settings.verified = currentSettings.verified;
  }

  CloudflareSync.saveSettings(settings);

  // 更新配置状态显示
  updateConfigStatus(settings);

  // 使用可访问性管理器关闭模态框
  AccessibilityManager.closeModal('settingsPanel');
}

// 导出数据
function exportData() {
  const data = DataManager.getData();
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nav_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

}

// 导入数据
function importData() {
  const input = document.getElementById('importDataInput');
  input.click();
}

// 处理文件选择
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      // 验证数据格式
      if (!importedData.categories || !importedData.links || !importedData.meta) {
        alert('数据格式不正确，请确保导入的是有效的导航数据文件。');
        return;
      }

      // 确认导入
      if (confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
        // 保存导入的数据
        DataManager.saveData(importedData);

        // 自动同步到云端
        CloudflareSync.autoSync();

        // 更新页面显示
        renderCommonLinks();
        renderCategoryLinks();

        alert('数据导入成功！');
      }
    } catch (error) {
      alert('导入失败：' + error.message + '\n请确保文件格式正确。');
    }
  };
  reader.readAsText(file);

  // 清空input，以便可以重复选择同一文件
  event.target.value = '';
}

// 清理本地数据
function resetData() {
  if (confirm('确定要清理本地数据吗？\n这将删除所有分类和链接，恢复到初始状态。\n此操作不可撤销！')) {
    if (confirm('再次确认：清理后所有数据将丢失，确定要继续吗？')) {
      // 重置数据为默认状态
      DataManager.resetData();

      // 清除同步标记
      localStorage.removeItem(DataManager.SYNC_KEY);

      // 清除Cloudflare设置（包括登录状态）
      localStorage.removeItem('nav_settings');

      // 清空输入框
      document.getElementById('workerUrl').value = '';
      document.getElementById('apiToken').value = '';

      // 更新同步按钮显示状态（显示登录按钮，隐藏同步按钮）
      updateSyncButtonsVisibility();

      // 更新配置状态显示
      updateConfigStatus({ verified: false });

      // 更新页面显示
      renderCommonLinks();
      renderCategoryLinks();

      // 更新同步信息
      updateSyncInfo();


    }
  }
}

// 下载云端数据（覆盖本地）
async function downloadFromCloud() {
  const downloadBtn = document.getElementById('downloadFromCloudBtn');
  const syncStatus = document.getElementById('syncStatus');

  downloadBtn.disabled = true;
  downloadBtn.textContent = '下载中...';
  syncStatus.textContent = '';

  // 显示加载状态
  LoadingManager.show('正在从云端同步数据...');

  try {
    // 获取用户输入的最新配置
    const workerUrl = document.getElementById('workerUrl').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();

    // 检查配置
    if (!workerUrl || !apiToken) {
      syncStatus.textContent = '✗ 请先填写 Worker URL 和 API Token';
      syncStatus.style.color = 'red';
      return;
    }

    // 临时设置配置用于验证
    const originalWorkerUrl = CloudflareSync.workerUrl;
    const originalApiToken = CloudflareSync.apiToken;
    CloudflareSync.workerUrl = workerUrl;
    CloudflareSync.apiToken = apiToken;

    // 先尝试验证配置（如果还未验证）
    const settings = CloudflareSync.getSettings();
    if (!settings.verified) {
      syncStatus.textContent = '正在验证配置...';
      const verifyResult = await CloudflareSync.verifyConfig();
      if (!verifyResult.success) {
        // 恢复原有配置
        CloudflareSync.workerUrl = originalWorkerUrl;
        CloudflareSync.apiToken = originalApiToken;
        syncStatus.textContent = '✗ 配置验证失败: ' + verifyResult.message;
        syncStatus.style.color = 'red';
        return;
      }
    }

    // 从云端下载数据
    const response = await fetch(`${CloudflareSync.workerUrl}/api/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CloudflareSync.apiToken}`
      }
    });

    if (response.ok) {
      const cloudData = await response.json();

      // 保存云端数据到本地（强制覆盖）
      DataManager.saveData(cloudData);

      // 如果验证成功，保存配置
      const settings = CloudflareSync.getSettings();
      if (!settings.verified) {
        CloudflareSync.saveSettings({
          workerUrl: workerUrl,
          apiToken: apiToken,
          verified: true
        });
        updateConfigStatus(CloudflareSync.getSettings());
      }

      // 更新页面显示
      renderCommonLinks();
      renderCategoryLinks();

      // 更新同步信息
      updateSyncInfo();

      syncStatus.textContent = '✓ 已从云端同步数据';
      syncStatus.style.color = 'green';
    } else if (response.status === 404) {
      syncStatus.textContent = '⚠ 云端没有数据，请先同步到云端';
      syncStatus.style.color = 'orange';
    } else if (response.status === 401) {
      syncStatus.textContent = '✗ API Token无效，请检查Token设置';
      syncStatus.style.color = 'red';
    } else {
      const error = await response.text().catch(() => '未知错误');
      syncStatus.textContent = `✗ 下载失败 (${response.status}): ${error}`;
      syncStatus.style.color = 'red';
    }
  } catch (error) {
    console.error('下载错误:', error);
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      syncStatus.textContent = '✗ 网络连接失败，请检查网络连接和Worker URL';
    } else {
      syncStatus.textContent = '✗ 下载失败: ' + error.message;
    }
    syncStatus.style.color = 'red';
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '下载云端数据';
    LoadingManager.hide();
  }
}

// 上传到云端（上传本地到云端）
async function uploadToCloud() {
  const uploadBtn = document.getElementById('uploadToCloudBtn');
  const syncStatus = document.getElementById('syncStatus');

  uploadBtn.disabled = true;
  uploadBtn.textContent = '上传中...';
  syncStatus.textContent = '';

  // 显示加载状态
  LoadingManager.show('正在同步到云端...');

  try {
    // 获取用户输入的最新配置
    const workerUrl = document.getElementById('workerUrl').value.trim();
    const apiToken = document.getElementById('apiToken').value.trim();

    // 检查配置
    if (!workerUrl || !apiToken) {
      syncStatus.textContent = '✗ 请先填写 Worker URL 和 API Token';
      syncStatus.style.color = 'red';
      return;
    }

    // 临时设置配置用于验证
    const originalWorkerUrl = CloudflareSync.workerUrl;
    const originalApiToken = CloudflareSync.apiToken;
    CloudflareSync.workerUrl = workerUrl;
    CloudflareSync.apiToken = apiToken;

    // 先尝试验证配置（如果还未验证）
    const settings = CloudflareSync.getSettings();
    if (!settings.verified) {
      syncStatus.textContent = '正在验证配置...';
      const verifyResult = await CloudflareSync.verifyConfig();
      if (!verifyResult.success) {
        // 恢复原有配置
        CloudflareSync.workerUrl = originalWorkerUrl;
        CloudflareSync.apiToken = originalApiToken;
        syncStatus.textContent = '✗ 配置验证失败: ' + verifyResult.message;
        syncStatus.style.color = 'red';
        return;
      }
    }

    // 上传本地数据到云端
    const uploadResult = await CloudflareSync.uploadData();
    if (uploadResult.success) {
      // 如果验证成功，保存配置
      const settings = CloudflareSync.getSettings();
      if (!settings.verified) {
        CloudflareSync.saveSettings({
          workerUrl: workerUrl,
          apiToken: apiToken,
          verified: true
        });
        updateConfigStatus(CloudflareSync.getSettings());
      }

      // 更新同步信息
      updateSyncInfo();

      syncStatus.textContent = '✓ ' + uploadResult.message;
      syncStatus.style.color = 'green';

      // 显示成功提示
      const data = DataManager.getData();
      if (data.meta && data.meta.lastUpdate) {
        const lastUpdate = new Date(data.meta.lastUpdate);
        const timeStr = lastUpdate.toLocaleString('zh-CN');
      }
    } else {
      syncStatus.textContent = '✗ ' + uploadResult.message;
      syncStatus.style.color = 'red';
    }
  } catch (error) {
    syncStatus.textContent = '✗ 上传失败: ' + error.message;
    syncStatus.style.color = 'red';
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = '上传到云端';
    LoadingManager.hide();
  }
}

// 添加链接模态框控制
function openAddLinkModal() {
  // 加载分类列表
  loadCategoriesToSelect();
  // 使用可访问性管理器打开模态框
  AccessibilityManager.openModal('addLinkModal');
}

function closeAddLinkModal() {
  // 使用可访问性管理器关闭模态框
  AccessibilityManager.closeModal('addLinkModal');
  // 清空表单
  document.getElementById('linkNameInput').value = '';
  document.getElementById('linkUrlInput').value = '';
  // 重置分类选择为默认值（常用网站）
  const categorySelect = document.getElementById('linkCategorySelect');
  if (categorySelect) {
    categorySelect.value = '1'; // 常用网站ID为1
  }
}

// 分类管理模态框控制
function openCategoryManageModal() {
  renderCategoryList();
  // 使用可访问性管理器打开模态框
  AccessibilityManager.openModal('categoryManageModal');
}

function closeCategoryManageModal() {
  // 使用可访问性管理器关闭模态框
  AccessibilityManager.closeModal('categoryManageModal');
  // 清空表单
  document.getElementById('newCategoryNameInput').value = '';
}

// 天气设置弹窗控制
function openWeatherSettingsModal() {
  // 加载已保存的设置
  const settings = WeatherManager.getSettings();
  document.getElementById('weatherCityCodeInput').value = settings.cityCode || '';
  document.getElementById('weatherApiKeyInput').value = settings.apiKey || '';
  // 使用可访问性管理器打开模态框
  AccessibilityManager.openModal('weatherSettingsModal');
}

function closeWeatherSettingsModal() {
  // 使用可访问性管理器关闭模态框
  AccessibilityManager.closeModal('weatherSettingsModal');
  // 清空表单
  document.getElementById('weatherCityCodeInput').value = '';
  document.getElementById('weatherApiKeyInput').value = '';
}

// 保存天气设置
async function saveWeatherSettings() {
  const cityCode = document.getElementById('weatherCityCodeInput').value.trim();
  const apiKey = document.getElementById('weatherApiKeyInput').value.trim();

  if (!apiKey) {
    alert('请输入高德API Key');
    return;
  }

  // 保存设置
  WeatherManager.saveSettings({ cityCode: cityCode, apiKey: apiKey });

  // 同步天气设置到云端
  try {
    await syncWeatherSettingsToCloud({ cityCode: cityCode, apiKey: apiKey });
  } catch (error) {
    console.log('天气设置同步失败:', error);
    // 不影响正常功能，只是记录错误
  }

  // 立即更新天气
  WeatherManager.updateWeather();

  // 关闭弹窗
  closeWeatherSettingsModal();
}

// 重置天气设置
function resetWeatherSettings() {
  // 清除设置
  WeatherManager.saveSettings({ cityCode: '', apiKey: '' });

  // 立即更新天气（使用默认设置）
  WeatherManager.updateWeather();

  // 关闭弹窗
  closeWeatherSettingsModal();
}

// 渲染分类列表
function renderCategoryList() {
  const data = DataManager.getData();
  const container = document.getElementById('categoryListContainer');
  if (!container) return;

  container.innerHTML = '';

  // 排除常用网站分类（ID为1），按order排序
  const categories = data.categories
    .filter(cat => cat.id !== 1)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (categories.length === 0) {
    const emptyHint = document.createElement('div');
    emptyHint.style.padding = '20px';
    emptyHint.style.textAlign = 'center';
    emptyHint.style.color = '#999';
    emptyHint.textContent = '暂无分类，请添加新分类';
    container.appendChild(emptyHint);
    return;
  }

  categories.forEach(category => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-list-item';
    categoryItem.dataset.categoryId = category.id;

    // 分类名称（可编辑）
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = category.name;
    nameInput.className = 'settings-input';
    nameInput.dataset.originalName = category.name;

    // 保存重命名
    nameInput.addEventListener('blur', function() {
      const newName = this.value.trim();
      const originalName = this.dataset.originalName;

      if (newName && newName !== originalName) {
        renameCategory(category.id, newName);
      } else if (!newName) {
        this.value = originalName;
        alert('分类名称不能为空');
      }
    });

    // 回车保存
    nameInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });

    // 删除按钮 - 使用事件委托，不再需要 onclick
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'settings-btn delete-category-btn';
    deleteBtn.textContent = '删除';

    categoryItem.appendChild(nameInput);
    categoryItem.appendChild(deleteBtn);
    container.appendChild(categoryItem);
  });
}

// 添加新分类
function addNewCategory() {
  const categoryName = document.getElementById('newCategoryNameInput').value.trim();

  if (!categoryName) {
    alert('请输入分类名称');
    return;
  }

  const data = DataManager.getData();

  // 检查分类名称是否已存在
  const existingCategory = data.categories.find(cat => cat.name === categoryName);
  if (existingCategory) {
    alert('该分类名称已存在，请使用其他名称');
    return;
  }

  // 创建新分类
  const newCategory = {
    id: DataManager.getNextId(data.categories),
    name: categoryName,
    icon: '',
    order: data.categories.filter(cat => cat.id !== 1).length + 1
  };
  data.categories.push(newCategory);
  DataManager.saveData(data);

  // 自动同步到云端
  CloudflareSync.autoSync().catch(error => {
    console.log('自动同步失败:', error);
  });

  // 更新页面显示
  renderCategoryLinks();
  renderCategoryList();

  // 清空输入框
  document.getElementById('newCategoryNameInput').value = '';
}

// 重命名分类
function renameCategory(categoryId, newName) {
  if (!newName || newName.trim() === '') {
    alert('分类名称不能为空');
    return;
  }

  const data = DataManager.getData();

  // 检查新名称是否已存在（排除当前分类）
  const existingCategory = data.categories.find(cat => cat.name === newName && cat.id !== categoryId);
  if (existingCategory) {
    alert('该分类名称已存在，请使用其他名称');
    return;
  }

  // 更新分类名称
  const category = data.categories.find(cat => cat.id === categoryId);
  if (category) {
    category.name = newName.trim();
    DataManager.saveData(data);

    // 自动同步到云端
    CloudflareSync.autoSync();

    // 更新页面显示
    renderCategoryLinks();
    renderCategoryList();
  }
}

// 加载分类到选择框
function loadCategoriesToSelect() {
  const data = DataManager.getData();
  const categorySelect = document.getElementById('linkCategorySelect');

  // 清空分类选择
  categorySelect.innerHTML = '';

  // 添加常用网站选项（ID为1）
  const commonOption = document.createElement('option');
  commonOption.value = '1';
  commonOption.textContent = '常用网站';
  commonOption.selected = true; // 默认选中常用网站
  categorySelect.appendChild(commonOption);

  // 添加其他分类选项
  const categories = data.categories.filter(cat => cat.id !== 1).sort((a, b) => (a.order || 0) - (b.order || 0));

  categories.forEach(category => {
    const categoryOption = document.createElement('option');
    categoryOption.value = category.id;
    categoryOption.textContent = category.name;
    categorySelect.appendChild(categoryOption);
  });
}

// 保存链接
function saveLink() {
  const name = document.getElementById('linkNameInput').value.trim();
  const url = document.getElementById('linkUrlInput').value.trim();
  const categoryId = parseInt(document.getElementById('linkCategorySelect').value);

  if (!name || !url) {
    alert('请填写网站名称和URL');
    return;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    alert('URL必须以http://或https://开头');
    return;
  }

  if (!categoryId) {
    alert('请选择要添加到的分类');
    return;
  }

  const data = DataManager.getData();

  // 创建新链接
  const newLink = {
    id: DataManager.getNextId(data.links),
    name: name,
    url: url,
    category_id: categoryId,
    order: data.links.filter(l => l.category_id === categoryId).length + 1,
    color: 'default' // 默认颜色
  };

  data.links.push(newLink);
  DataManager.saveData(data);

  // 自动同步到云端
  CloudflareSync.autoSync();

  // 更新页面显示
  renderCommonLinks();
  renderCategoryLinks();

  // 关闭模态框
  closeAddLinkModal();
}

// 渲染常用网站
function renderCommonLinks() {
  const data = DataManager.getData();
  const container = document.getElementById('common-links-content');
  if (!container) return;

  // 获取常用网站（分类ID为1）
  const commonLinks = data.links.filter(link => link.category_id === 1);

  container.innerHTML = '';
  const linksContainer = document.createElement('div');
  linksContainer.className = 'category-module__links';

  commonLinks.forEach(link => {
    const linkDiv = document.createElement('div');
    linkDiv.className = 'inline-block category-module__link';
    linkDiv.dataset.linkId = link.id;

    const linkA = document.createElement('a');
    linkA.href = link.url;
    linkA.textContent = link.name;

    // 根据颜色设置链接颜色
    if (link.color === 'red') {
      linkA.style.color = '#e74c3c';
    } else if (link.color === 'blue') {
      linkA.style.color = '#3498db';
    } else {
      linkA.style.color = '#000000'; // 默认黑色
    }

    // 右键菜单
    linkDiv.addEventListener('contextmenu', function(e) {
      showContextMenu(e, link.id);
    });

    linkDiv.appendChild(linkA);
    linksContainer.appendChild(linkDiv);
  });

  container.appendChild(linksContainer);
}

// 渲染分类模块（每个分类显示为一个独立模块，类似常用网站模块）
function renderCategoryLinks() {
  const data = DataManager.getData();
  const container = document.getElementById('category-modules-container');
  if (!container) return;

  container.innerHTML = '';

  // 排除常用网站分类（ID为1），按order排序
  const categories = data.categories
    .filter(cat => cat.id !== 1)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  categories.forEach(category => {
    const categoryLinks = data.links.filter(link => link.category_id === category.id);

    // 创建分类模块容器（类似常用网站模块的结构）
    const categoryModule = document.createElement('div');
    categoryModule.className = 'category-module category-module__box';
    categoryModule.dataset.categoryId = category.id;

    // 为每个分类模块随机分配主题颜色
    const themes = ['theme-yellow', 'theme-blue', 'theme-red', 'theme-green', 'theme-purple'];
    // 使用分类ID作为种子，确保同一分类总是相同主题
    const themeIndex = category.id % themes.length;
    const themeClass = 'category-module__box--' + themes[themeIndex];
    categoryModule.classList.add(themeClass);

    // 模块标题区域
    const titleSection = document.createElement('div');
    titleSection.className = 'category-module__header';
    const titleDiv = document.createElement('div');
    titleDiv.className = 'inline-block category-module__title-wrapper category-module__title-wrapper--active';
    const titleLink = document.createElement('a');
    titleLink.className = 'category-module__title';
    titleLink.name = 'title';
    titleLink.textContent = category.name;

    // 右键菜单：删除分类
    titleLink.oncontextmenu = function(e) {
      e.preventDefault();
      if (categoryLinks.length > 0) {
        if (confirm(`该分类下有 ${categoryLinks.length} 个链接，确定要删除整个分类模块吗？`)) {
          deleteCategory(category.id);
        }
      } else {
        if (confirm('确定要删除这个分类模块吗？')) {
          deleteCategory(category.id);
        }
      }
    };

    titleDiv.appendChild(titleLink);
    titleSection.appendChild(titleDiv);
    categoryModule.appendChild(titleSection);

    // 链接内容区域
    const contentSection = document.createElement('div');
    const linksContainer = document.createElement('div');
    linksContainer.className = 'category-module__content';

    if (categoryLinks.length > 0) {
      const linksDiv = document.createElement('div');
      linksDiv.className = 'category-module__links';

      categoryLinks.forEach((link, index) => {
        const linkDiv = document.createElement('div');
        linkDiv.className = 'inline-block category-module__link';
        linkDiv.dataset.linkId = link.id;

        const linkA = document.createElement('a');
        linkA.href = link.url;
        linkA.textContent = link.name;

        // 根据颜色设置链接颜色
        if (link.color === 'red') {
          linkA.style.color = '#e74c3c';
        } else if (link.color === 'blue') {
          linkA.style.color = '#3498db';
        } else {
          linkA.style.color = '#000000'; // 默认黑色
        }

        // 右键菜单：编辑/删除链接
        linkDiv.addEventListener('contextmenu', function(e) {
          showContextMenu(e, link.id);
        });

        linkDiv.appendChild(linkA);
        linksDiv.appendChild(linkDiv);

        // 在第32个链接（索引31）之后添加分隔线
        if (index === 31 && categoryLinks.length > 32) {
          const hr = document.createElement('hr');
          hr.style.width = '100%';
          hr.style.border = 'none';
          hr.style.margin = '10px 0';
          hr.style.clear = 'both';

          // 根据模块主题设置HR颜色
          if (categoryModule.classList.contains('category-module__box--theme-yellow')) {
            hr.style.borderTop = '1px solid #f0d680';
          } else if (categoryModule.classList.contains('category-module__box--theme-blue')) {
            hr.style.borderTop = '1px solid #94d6eb';
          } else if (categoryModule.classList.contains('category-module__box--theme-red')) {
            hr.style.borderTop = '1px solid #f0c1c1';
          } else if (categoryModule.classList.contains('category-module__box--theme-green')) {
            hr.style.borderTop = '1px solid #b2db65';
          } else if (categoryModule.classList.contains('category-module__box--theme-purple')) {
            hr.style.borderTop = '1px solid #f4caca';
          } else {
            hr.style.borderTop = '1px solid #ddd'; // 默认颜色
          }

          linksDiv.appendChild(hr);
        }
      });

      linksContainer.appendChild(linksDiv);
    } else {
      // 空分类显示提示
      const emptyHint = document.createElement('div');
      emptyHint.className = 'category-module__content';
      emptyHint.style.padding = '10px';
      emptyHint.style.color = '#999';
      emptyHint.style.fontStyle = 'italic';
      emptyHint.textContent = '（暂无链接，点击"增加链接"添加）';
      linksContainer.appendChild(emptyHint);
    }

    contentSection.appendChild(linksContainer);
    categoryModule.appendChild(contentSection);
    container.appendChild(categoryModule);
  });
}

// 删除分类
function deleteCategory(categoryId) {
  const data = DataManager.getData();
  // 删除分类下的所有链接
  data.links = data.links.filter(l => l.category_id !== categoryId);
  // 删除分类
  data.categories = data.categories.filter(c => c.id !== categoryId);
  DataManager.saveData(data);
  CloudflareSync.autoSync();
  renderCommonLinks();
  renderCategoryLinks();
}

// 当前编辑的链接ID
let currentEditLinkId = null;

// 显示右键菜单
function showContextMenu(e, linkId) {
  e.preventDefault();
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.classList.add('is-visible');
  contextMenu.style.left = e.pageX + 'px';
  contextMenu.style.top = e.pageY + 'px';
  contextMenu.dataset.linkId = linkId;
}

// 隐藏右键菜单
function hideContextMenu() {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.classList.remove('is-visible');
}

// 打开编辑链接模态框
function openEditLinkModal(linkId) {
  const data = DataManager.getData();
  const link = data.links.find(l => l.id === linkId);
  if (!link) return;

  currentEditLinkId = linkId;
  document.getElementById('editLinkNameInput').value = link.name;
  document.getElementById('editLinkUrlInput').value = link.url;
  // 使用可访问性管理器打开模态框
  AccessibilityManager.openModal('editLinkModal');
  hideContextMenu();
}

// 关闭编辑链接模态框
function closeEditLinkModal() {
  // 使用可访问性管理器关闭模态框
  AccessibilityManager.closeModal('editLinkModal');
  currentEditLinkId = null;
  document.getElementById('editLinkNameInput').value = '';
  document.getElementById('editLinkUrlInput').value = '';
}

// 保存编辑的链接
function saveEditLink() {
  if (!currentEditLinkId) return;

  const name = document.getElementById('editLinkNameInput').value.trim();
  let url = document.getElementById('editLinkUrlInput').value.trim();

  if (!name) {
    alert('请输入链接名称');
    return;
  }

  if (!url) {
    alert('请输入链接地址');
    return;
  }

  // 处理URL格式，如果没有协议则添加https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const data = DataManager.getData();
  const link = data.links.find(l => l.id === currentEditLinkId);
  if (link) {
    link.name = name;
    link.url = url;
    DataManager.saveData(data);
    CloudflareSync.autoSync();
    renderCommonLinks();
    renderCategoryLinks();
  }

  closeEditLinkModal();
}

// 删除链接
function deleteLink(linkId) {
  if (confirm('确定要删除这个链接吗？')) {
    const data = DataManager.getData();
    data.links = data.links.filter(l => l.id !== linkId);
    DataManager.saveData(data);
    CloudflareSync.autoSync();
    renderCommonLinks();
    renderCategoryLinks();
  }
  hideContextMenu();
}

// 显示颜色选择子菜单
function showColorSubmenu(linkId) {
  // 隐藏主菜单
  hideContextMenu();

  // 创建颜色子菜单
  const colorMenu = document.createElement('div');
  colorMenu.id = 'colorSubmenu';
  colorMenu.className = 'context-menu color-submenu is-visible';
  colorMenu.innerHTML = `
    <div class="context-menu__item color-option" data-color="red">🔴 红色</div>
    <div class="context-menu__item color-option" data-color="blue">🔵 蓝色</div>
    <div class="context-menu__item color-option" data-color="default">⚪ 默认</div>
  `;

  // 定位子菜单 - 使用固定位置而不是相对于主菜单
  colorMenu.style.left = '300px';
  colorMenu.style.top = '200px';
  colorMenu.style.position = 'fixed';
  colorMenu.style.zIndex = '10001';

  // 添加到页面
  document.body.appendChild(colorMenu);

  // 添加事件监听器
  colorMenu.addEventListener('click', function(e) {
    if (e.target.classList.contains('color-option')) {
      const color = e.target.dataset.color;
      changeLinkColor(linkId, color);
      document.body.removeChild(colorMenu);
    }
  });

  // 点击其他地方关闭子菜单
  setTimeout(() => {
    document.addEventListener('click', function closeSubmenu(e) {
      if (!colorMenu.contains(e.target)) {
        if (document.body.contains(colorMenu)) {
          document.body.removeChild(colorMenu);
        }
        document.removeEventListener('click', closeSubmenu);
      }
    });
  }, 10);
}

// 切换链接颜色
function changeLinkColor(linkId, color) {
  const data = DataManager.getData();
  const link = data.links.find(l => l.id === linkId);
  if (link) {
    link.color = color;
    DataManager.saveData(data);
    CloudflareSync.autoSync();
    renderCommonLinks();
    renderCategoryLinks();
  }
}

// ===== 事件绑定工具 =====
function bindEvents() {
  const events = {
    'categoryManageBtn': ['click', openCategoryManageModal],
    'addLinkBtn': ['click', openAddLinkModal],
    'settingsBtn': ['click', openSettings],
    'loginBtn': ['click', login],
    'settingsClose': ['click', closeSettings],
    'downloadFromCloudBtn': ['click', downloadFromCloud],
    'uploadToCloudBtn': ['click', uploadToCloud],
    'exportDataBtn': ['click', exportData],
    'importDataBtn': ['click', importData],
    'resetDataBtn': ['click', resetData],
    'importDataInput': ['change', handleFileImport],
    'addLinkClose': ['click', closeAddLinkModal],
    'cancelLinkBtn': ['click', closeAddLinkModal],
    'saveLinkBtn': ['click', saveLink],
    'categoryManageClose': ['click', closeCategoryManageModal],
    'addNewCategoryBtn': ['click', addNewCategory],
    'editLinkClose': ['click', closeEditLinkModal],
    'cancelEditLinkBtn': ['click', closeEditLinkModal],
    'saveEditLinkBtn': ['click', saveEditLink],
    'editLinkBtn': ['click', () => openEditLinkModal(parseInt($('contextMenu').dataset.linkId))],
    'colorLinkBtn': ['click', () => showColorSubmenu(parseInt($('contextMenu').dataset.linkId))],
    'deleteLinkBtn': ['click', () => deleteLink(parseInt($('contextMenu').dataset.linkId))],
    'weatherSettingsClose': ['click', closeWeatherSettingsModal],
    'saveWeatherSettingsBtn': ['click', saveWeatherSettings],
    'resetWeatherSettingsBtn': ['click', resetWeatherSettings],
    'searchEngineSelector': ['click', () => AccessibilityManager.openModal('searchEngineModal')],
    'searchEngineClose': ['click', () => AccessibilityManager.closeModal('searchEngineModal')]
  };

  Object.entries(events).forEach(([id, [event, handler]]) => {
    const el = $(id);
    if (el) el.addEventListener(event, handler);
  });

  // 特殊事件绑定
  $('newCategoryNameInput')?.addEventListener('keypress', e => e.key === 'Enter' && addNewCategory());

  // 模态框外部点击关闭
  const modalCloseMap = {
    'settingsPanel': () => closeSettings(),
    'addLinkModal': () => closeAddLinkModal(),
    'editLinkModal': () => closeEditLinkModal(),
    'categoryManageModal': () => closeCategoryManageModal(),
    'weatherSettingsModal': () => closeWeatherSettingsModal()
  };

  Object.keys(modalCloseMap).forEach(id => {
    const modal = $(id);
    if (modal) {
      // 在内容区域阻止事件冒泡，防止误触关闭
      const content = modal.querySelector('.settings-panel-content');
      if (content) {
        content.addEventListener('click', function(e) {
          e.stopPropagation();
        });
      }

      // 在模态框背景上监听点击关闭
      modal.addEventListener('click', function(e) {
        // 只有当点击的是模态框背景本身时才关闭
        if (e.target === modal) {
          modalCloseMap[id]();
        }
      });
    }
  });

  // 搜索引擎切换控制
  const searchEngineSelector = $('searchEngineSelector');
  const searchForm = $('searchForm');

  if (searchEngineSelector && searchForm) {
    // 获取搜索引擎列表
    const engineKeys = Object.keys(searchEngines);

    // 点击选择器循环切换搜索引擎
    searchEngineSelector.addEventListener('click', function(e) {
      e.stopPropagation();

      const currentIcon = searchEngineSelector.querySelector('.search-engine-icon');
      const currentEngine = currentIcon.dataset.engine || 'google';

      // 找到当前搜索引擎的索引
      let currentIndex = engineKeys.indexOf(currentEngine);
      if (currentIndex === -1) currentIndex = 0;

      // 切换到下一个搜索引擎
      const nextIndex = (currentIndex + 1) % engineKeys.length;
      const nextEngine = engineKeys[nextIndex];
      const { url, icon } = searchEngines[nextEngine];

      // 更新表单action和图标
      searchForm.action = url;
      currentIcon.src = icon;
      currentIcon.dataset.engine = nextEngine;
    });
  }

  // 右键菜单隐藏
  document.addEventListener('click', e => {
    if (!e.target.closest('#contextMenu') && !e.target.closest('[data-link-id]')) hideContextMenu();
  });

  // 分类删除事件委托
  $('categoryListContainer')?.addEventListener('click', e => {
    if (e.target.matches('.delete-category-btn')) {
      const categoryId = parseInt(e.target.closest('.category-list-item').dataset.categoryId);
      const links = DataManager.getData().links.filter(l => l.category_id === categoryId);
      if (links.length === 0 || confirm(`该分类下有 ${links.length} 个链接，确定要删除整个分类吗？`)) {
        deleteCategory(categoryId);
        renderCategoryList();
      }
    }
  });

  // 配置输入框监听
  ['workerUrl', 'apiToken'].forEach(id => {
    $(id)?.addEventListener('input', () => updateConfigStatus({
      workerUrl: $('workerUrl').value.trim(),
      apiToken: $('apiToken').value.trim()
    }));
  });


}

// 同步天气设置到云端
async function syncWeatherSettingsToCloud(weatherSettings) {
  // 检查云端同步是否已配置
  const cloudSettings = CloudflareSync.getSettings();
  if (!cloudSettings.verified || !cloudSettings.workerUrl || !cloudSettings.apiToken) {
    // 云端同步未配置，跳过同步
    return;
  }

  try {
    // 获取当前数据
    const data = DataManager.getData();

    // 将天气设置添加到数据中
    data.weatherSettings = weatherSettings;
    data.weatherSettings.lastUpdate = new Date().toISOString();

    // 上传到云端
    const response = await fetch(`${cloudSettings.workerUrl}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cloudSettings.apiToken}`
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // 更新本地同步标记
      localStorage.setItem(DataManager.SYNC_KEY, 'false');
      console.log('天气设置已同步到云端');
    } else {
      console.log('天气设置同步失败:', response.status);
    }
  } catch (error) {
    console.log('天气设置同步错误:', error);
  }
}

// 从云端恢复天气设置
function restoreWeatherSettingsFromCloud() {
  const data = DataManager.getData();
  if (data.weatherSettings) {
    WeatherManager.saveSettings(data.weatherSettings);
    console.log('已从云端恢复天气设置');
  }
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
  LoadingManager.init();
  AccessibilityManager.init();
  ModalManager.init();
  CloudflareSync.init();
  WeatherManager.init();

  // 从云端恢复天气设置
  restoreWeatherSettingsFromCloud();

  updateCalendar();
  setInterval(updateCalendar, 60000);

  bindEvents();
  renderCommonLinks();
  renderCategoryLinks();

  // 初始化弹窗拖拽
  ['settingsPanel', 'addLinkModal', 'editLinkModal', 'categoryManageModal', 'weatherSettingsModal'].forEach(id => {
    makeDraggable(id, `${id}Header`);
  });
});
