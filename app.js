/**
 * 导航页面 - 数据管理和同步模块
 * 优化版本：精简代码，移除重复逻辑
 */

// ===== 数据管理 =====
const DataManager = {
    STORAGE_KEY: 'nav_data',
    SYNC_KEY: 'nav_sync',

    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : this.getDefaultData();
    },

    saveData(data) {
        data.meta.lastUpdate = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(this.SYNC_KEY, 'true');
        return data;
    },

    getDefaultData() {
        return {
            categories: [
                { id: 1, name: '常用网站', icon: '', order: 1 },
                { id: 2, name: '模块一', icon: '', order: 2 },
                { id: 3, name: '模块二', icon: '', order: 3 }
            ],
            links: [
                // 常用网站
                { id: 1, name: '导航1', url: 'https://nav.062200.xyz', category_id: 1, order: 1 },
                { id: 2, name: '导航2', url: 'https://nav.062200.xyz', category_id: 1, order: 2 },
                { id: 3, name: '导航3', url: 'https://nav.062200.xyz', category_id: 1, order: 3 },
                // 模块一
                { id: 4, name: '博客1', url: 'https://blog.062200.xyz', category_id: 2, order: 1 },
                { id: 5, name: '博客2', url: 'https://blog.062200.xyz', category_id: 2, order: 2 },
                { id: 6, name: '博客3', url: 'https://blog.062200.xyz', category_id: 2, order: 3 },      ],
            meta: { version: 1, lastUpdate: new Date().toISOString() }
        };
    },

    getNextId(items) {
        return items.length === 0 ? 1 : Math.max(...items.map(item => item.id)) + 1;
    },

    resetData() {
        localStorage.removeItem(this.STORAGE_KEY);
        return this.getDefaultData();
    }
};

// ===== Cloudflare同步管理 =====
const CloudflareSync = {
    workerUrl: '',
    apiToken: '',
    
    // 初始化
    init() {
        const settings = this.getSettings();
        this.workerUrl = settings.workerUrl || '';
        this.apiToken = settings.apiToken || '';
    },
    
    // 获取设置
    getSettings() {
        const settings = localStorage.getItem('nav_settings');
        const defaultSettings = { verified: false };
        return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
    },

    // 保存设置
    saveSettings(settings) {
        localStorage.setItem('nav_settings', JSON.stringify(settings));
        this.workerUrl = settings.workerUrl || '';
        this.apiToken = settings.apiToken || '';
    },

    // 验证配置
    async verifyConfig() {
        if (!this.workerUrl || !this.apiToken) {
            return { success: false, message: '请先填写Worker URL和API Token' };
        }

        // 检查URL格式
        try {
            new URL(this.workerUrl);
        } catch (e) {
            return { success: false, message: 'Worker URL格式不正确，请确保是以https://开头的完整URL' };
        }

        try {
            // 尝试获取云端数据来验证配置
            const response = await fetch(`${this.workerUrl}/api/data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            if (response.ok || response.status === 404) {
                // 200表示有数据，404表示没有数据但连接正常
                const settings = this.getSettings();
                settings.verified = true;
                this.saveSettings(settings);
                return { success: true, message: '配置验证成功' };
            } else if (response.status === 401) {
                return { success: false, message: 'API Token无效或已过期，请检查Token是否正确' };
            } else if (response.status === 403) {
                return { success: false, message: 'API Token权限不足，请检查Token权限设置' };
            } else if (response.status >= 500) {
                return { success: false, message: '服务器错误，请稍后重试或联系管理员' };
            } else {
                const error = await response.text().catch(() => '未知错误');
                return { success: false, message: `验证失败 (${response.status}): ${error}` };
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return {
                    success: false,
                    message: '网络连接失败。可能的原因：\n' +
                            '• Worker URL不可访问\n' +
                            '• 网络连接问题\n' +
                            '• 浏览器阻止了请求（CORS问题）\n' +
                            '• 防火墙或代理设置'
                };
            } else if (error.name === 'AbortError') {
                return { success: false, message: '请求超时，请检查网络连接' };
            } else {
                return { success: false, message: `网络错误: ${error.message}` };
            }
        }
    },
    
    // 上传数据到云端
    async uploadData() {
        if (!this.workerUrl || !this.apiToken) {
            return { success: false, message: '请先配置Worker URL和API Token' };
        }

        try {
            const data = DataManager.getData();
            const response = await fetch(`${this.workerUrl}/api/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                localStorage.setItem(DataManager.SYNC_KEY, 'false');
                return { success: true, message: '同步成功' };
            } else if (response.status === 401) {
                return { success: false, message: 'API Token无效或已过期，请检查Token是否正确' };
            } else if (response.status === 403) {
                return { success: false, message: 'API Token权限不足，请检查Token权限设置' };
            } else if (response.status >= 500) {
                return { success: false, message: '服务器错误，请稍后重试或联系管理员' };
            } else {
                const error = await response.text().catch(() => '未知错误');
                return { success: false, message: `上传失败 (${response.status}): ${error}` };
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return {
                    success: false,
                    message: '网络连接失败。可能的原因：\n' +
                            '• Worker URL不可访问\n' +
                            '• 网络连接问题\n' +
                            '• 浏览器阻止了请求（CORS问题）\n' +
                            '• 防火墙或代理设置'
                };
            } else if (error.name === 'AbortError') {
                return { success: false, message: '请求超时，请检查网络连接' };
            } else {
                return { success: false, message: `网络错误: ${error.message}` };
            }
        }
    },
    
    // 从云端下载数据
    async downloadData() {
        if (!this.workerUrl || !this.apiToken) {
            return { success: false, message: '请先配置Worker URL和API Token' };
        }

        try {
            const response = await fetch(`${this.workerUrl}/api/data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            if (response.ok) {
                const cloudData = await response.json();
                const localData = DataManager.getData();

                // 比较时间戳，决定使用哪个数据
                if (cloudData.meta && cloudData.meta.lastUpdate) {
                    if (!localData.meta || !localData.meta.lastUpdate ||
                        new Date(cloudData.meta.lastUpdate) > new Date(localData.meta.lastUpdate)) {
                        // 云端数据更新，使用云端数据
                        DataManager.saveData(cloudData);
                        return { success: true, message: '已同步云端数据', data: cloudData };
                    } else {
                        // 本地数据更新，上传本地数据
                        await this.uploadData();
                        return { success: true, message: '已上传本地数据' };
                    }
                } else {
                    // 云端数据格式不正确，上传本地数据
                    await this.uploadData();
                    return { success: true, message: '已上传本地数据' };
                }
            } else if (response.status === 404) {
                // 云端没有数据，上传本地数据
                await this.uploadData();
                return { success: true, message: '已上传本地数据' };
            } else if (response.status === 401) {
                return { success: false, message: 'API Token无效或已过期，请检查Token是否正确' };
            } else if (response.status === 403) {
                return { success: false, message: 'API Token权限不足，请检查Token权限设置' };
            } else if (response.status >= 500) {
                return { success: false, message: '服务器错误，请稍后重试或联系管理员' };
            } else {
                const error = await response.text().catch(() => '未知错误');
                return { success: false, message: `下载失败 (${response.status}): ${error}` };
            }
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return {
                    success: false,
                    message: '网络连接失败。可能的原因：\n' +
                            '• Worker URL不可访问\n' +
                            '• 网络连接问题\n' +
                            '• 浏览器阻止了请求（CORS问题）\n' +
                            '• 防火墙或代理设置'
                };
            } else if (error.name === 'AbortError') {
                return { success: false, message: '请求超时，请检查网络连接' };
            } else {
                return { success: false, message: `网络错误: ${error.message}` };
            }
        }
    },
    
    // 自动同步（后台）
    async autoSync() {
        const needSync = localStorage.getItem(DataManager.SYNC_KEY) === 'true';
        if (needSync && this.workerUrl && this.apiToken) {
            // 检查配置是否已验证
            const settings = this.getSettings();
            if (!settings.verified) {
                // 如果未验证，先验证配置
                const verifyResult = await this.verifyConfig();
                if (!verifyResult.success) {
                    console.log('自动同步失败：配置验证失败', verifyResult.message);
                    return;
                }
            }
            // 上传数据到云端
            await this.uploadData();
        }
    }
};
