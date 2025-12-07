# 2000s-Navigator

一个简洁优雅的个人导航网站，支持分类管理、天气显示、云端同步等功能。

## 项目简介

2000s-Navigator 是一个基于 HTML/CSS/JavaScript 的静态导航网站，专为喜欢复古风格的用户设计。网站采用模块化设计，支持自定义链接分类、天气信息显示、数据云端同步等功能。

## 主要功能

### 🏠 导航管理
- **分类管理**：创建、编辑、删除链接分类
- **链接管理**：添加、编辑、删除网站链接
- **链接颜色**：为不同链接设置颜色标识
- **拖拽排序**：支持拖拽重新排列链接顺序

### 🌤️ 天气显示
- **实时天气**：显示当前城市天气状况
- **自动定位**：支持自动获取地理位置
- **手动配置**：支持手动设置城市编码和API Key
- **高德地图API**：集成高德天气API获取准确天气数据

### ☁️ 云端同步
- **Cloudflare Worker**：支持数据云端备份和同步
- **多设备同步**：在不同设备间同步导航数据
- **自动同步**：数据变更后自动同步到云端
- **数据导入导出**：支持JSON格式的数据导入导出

### 🔍 搜索功能
- **多搜索引擎**：支持Google、Bing、百度等搜索引擎
- **一键切换**：点击搜索框左侧图标快速切换搜索引擎

### 📱 PWA支持
- **离线访问**：Service Worker缓存静态资源
- **安装应用**：支持安装为桌面应用
- **缓存策略**：智能缓存策略提升加载速度

## 技术栈

- **前端框架**：原生HTML/CSS/JavaScript
- **数据存储**：LocalStorage + Cloudflare Worker
- **天气API**：高德地图天气API
- **缓存技术**：Service Worker
- **部署方式**：静态网站部署

## 部署方式

### Cloudflare Worker + Pages

#### 1. 创建KV存储

1. **登录Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)

2. **创建KV命名空间**
   - 进入 "Workers & Pages" > "KV"
   - 点击 "Create namespace"
   - 命名空间名称：`NAV_DATA`

#### 2. 创建Worker

1. **创建新的Worker**
   - 进入 "Workers & Pages" > "Create application" > "Create Worker"
   - 给Worker命名（如：`nav-api`）

2. **绑定KV存储**
   - 在Worker设置中，进入 "Settings" > "Variables" > "KV Namespace Bindings"
   - 添加绑定：
     - Variable name: `NAV_DATA`
     - KV namespace: 选择刚才创建的命名空间

3. **部署Worker代码**

在Worker编辑器中粘贴以下代码：

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 处理CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (url.pathname === '/api/data') {
      // 设置CORS头
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (request.method === 'GET') {
        // 获取数据
        const data = await env.NAV_DATA.get('data');
        return new Response(data || JSON.stringify({
          categories: [{ id: 1, name: '常用网站', icon: '', order: 1 }],
          links: [],
          meta: { version: 1, lastUpdate: new Date().toISOString() }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } else if (request.method === 'POST') {
        // 保存数据
        const data = await request.text();
        await env.NAV_DATA.put('data', data);
        return new Response('OK', { headers: corsHeaders });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

#### 3. 部署静态文件到Cloudflare Pages

1. **连接GitHub仓库**
   - 进入 "Workers & Pages" > "Pages"
   - 点击 "Connect to git"
   - 选择你的GitHub仓库

2. **配置构建设置**
   - **Build command**: （留空）
   - **Build output directory**: `/`
   - **Root directory**: `/`

3. **部署完成**
   - Cloudflare会自动部署静态文件
   - 访问地址会自动分配（如：`https://your-project.pages.dev`）

#### 4. 配置网站

1. **获取URLs**
   - Worker URL：`https://你的worker名称.你的账户.workers.dev`
   - Pages URL：`https://你的项目名称.pages.dev`

2. **网站设置**
   - 打开Pages URL访问网站
   - 进入设置，填入Worker URL
   - API Token：留空
   - 点击登录验证

## 配置说明

### 天气功能配置

1. **获取高德API Key**
   - 访问 [高德开放平台](https://console.amap.com/dev/key/app)
   - 注册账号并创建应用
   - 获取API Key

2. **配置天气设置**
   - 打开网站，点击右上角设置按钮
   - 找到"天气设置"
   - 填入城市编码和API Key
   - 保存设置

3. **城市编码查询**
   - 访问 [民政部行政区划代码](https://www.mca.gov.cn/mzsj/xzqh/2022/202201xzqh.html)
   - 查找对应城市的adcode（如北京：110000）



## 使用说明

### 基本操作

1. **添加链接**
   - 点击右上角"增加链接"按钮
   - 选择分类，填入网站名称和URL
   - 保存链接

2. **管理分类**
   - 点击右上角"分类管理"按钮
   - 添加新分类或编辑现有分类

3. **编辑链接**
   - 右键点击链接，选择"编辑"
   - 修改链接信息后保存

4. **数据管理**
   - 在设置面板中可以导出/导入数据
   - 支持JSON格式的数据备份

### 快捷操作

- **右键菜单**：右键点击链接可快速编辑、改色或删除
- **拖拽弹窗**：所有弹窗都支持拖拽移动
- **键盘快捷键**：部分操作支持键盘快捷键

## 浏览器兼容性

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 开发说明

### 项目结构

```
2000s-Navigator/
├── index.html      # 主页面
├── style.css       # 样式文件
├── main.js         # 主逻辑文件
├── app.js          # 数据管理文件
├── sw.js           # Service Worker
└── README.md       # 说明文档
```

### 本地开发

由于这是纯静态网站，你可以直接在浏览器中打开 `index.html` 文件进行开发：

```bash
# 克隆项目
git clone https://github.com/wangdaodaodao/2000s-Navigator.git

# 进入项目目录
cd 2000s-Navigator

# 直接打开index.html文件
open index.html
```

### 代码规范

- 使用ES6+语法
- 注释详细有用
- 代码模块化设计
- 遵循简洁实用的原则

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础导航功能
- 集成天气显示
- 支持云端同步
- PWA离线支持

## 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/wangdaodaodao/2000s-Navigator/issues)
- Email: wangdaodaodao@example.com

---

**享受你的个性化导航体验！** 🚀
