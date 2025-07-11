# 个人博客系统

这是一个功能丰富的全栈个人博客系统，采用现代化前后端分离的B/S架构。支持完整的文章管理、评论系统、分类浏览、实时搜索功能，并内置了音乐播放器和功能完善的管理员后台。

## 🚀 技术栈

### 前端技术
- **Vue 3** - 渐进式 JavaScript 框架（Composition API）
- **Vite** - 下一代前端构建工具（快速开发服务器）
- **Vue Router** - 官方路由管理器（支持嵌套路由和导航守卫）
- **Axios** - 基于 Promise 的 HTTP 客户端，用于前后端通信
- **Bootstrap 5** - 响应式 CSS 框架（支持明暗主题）
- **Bootstrap Icons** - 丰富的图标库
- **MD Editor V3** - 专业的Markdown编辑器（支持实时预览）
- **CSS3 Animations** - 原生CSS3动画（流畅的界面动效）

### 后端技术
- **NestJS** - 基于 TypeScript 的 Node.js 框架
- **TypeORM** - TypeScript ORM 框架
- **SQLite** - 轻量级数据库
- **Markdown-it** - Markdown 解析器
- **Express** - HTTP 服务器框架

## 🌐 前后端通信

### API 接口设计
- **RESTful API** - 遵循 REST 架构风格
- **HTTP/JSON** - 数据交换格式
- **CORS** - 跨域资源共享支持
- **JWT 认证** - 管理员身份验证（计划中）

### 主要 API 端点
```
GET    /articles              # 获取所有文章
GET    /articles/:id          # 获取指定文章
GET    /articles/category/:category  # 获取分类文章
POST   /articles              # 创建文章（需管理员权限）
PUT    /articles/:id          # 更新文章（需管理员权限）
DELETE /articles/:id          # 删除文章（需管理员权限）
GET    /comments/:articleId   # 获取文章评论
POST   /comments              # 发表评论
PUT    /comments/:id          # 更新评论状态（管理员）
DELETE /comments/:id          # 删除评论（管理员）
```

## 🖥️ 后端实现

### 项目结构
```
backend/
├── src/
│   ├── app.module.ts          # 应用主模块
│   ├── main.ts                # 应用入口
│   └── article/               # 文章模块
│       ├── article.controller.ts  # 控制器层
│       ├── article.service.ts     # 业务逻辑层
│       ├── article.entity.ts      # 数据实体
│       └── dto/               # 数据传输对象
└── blog.sqlite               # SQLite 数据库文件
```

### 核心功能
- **文章 CRUD** - 完整的文章增删改查操作
- **评论系统** - 支持用户评论和管理员审核
- **分类管理** - 支持文章分类（学习、游戏、个人作品、资源分享、其他）
- **数据持久化** - 使用 TypeORM + SQLite 数据库
- **自动种子数据** - 启动时自动初始化示例文章和评论
- **Markdown 支持** - 原生支持 Markdown 格式文章编辑和渲染
- **图片处理** - 支持文章封面图片上传和展示

## 🎨 前端实现

### 项目结构
```
src/
├── components/                # 核心组件目录
│   ├── ArticleList.vue       # 文章列表组件（支持分页和筛选）
│   ├── ArticleDetail.vue     # 文章详情组件（Markdown渲染）
│   ├── CommentSection.vue    # 评论系统组件
│   ├── LazyCommentSection.vue # 懒加载评论组件
│   ├── MusicPlayer.vue       # 音乐播放器
│   ├── SearchBar.vue         # 实时搜索组件
│   ├── PersonalInfo.vue      # 个人信息侧边栏
│   ├── WelcomeSection.vue    # 首页欢迎区域
│   ├── Toast.vue             # 全局消息提示
│   └── InfiniteScroll.vue    # 无限滚动组件
├── views/admin/               # 管理员后台页面
│   ├── AdminDashboard.vue    # 管理员仪表板
│   ├── AdminLogin.vue        # 管理员登录
│   ├── ArticleManager.vue    # 文章管理页面
│   ├── ArticleEditor.vue     # 文章编辑器
│   ├── CommentManager.vue    # 评论管理页面
│   └── ConfirmModal.vue      # 确认对话框
├── layouts/                   # 布局组件
│   └── AdminLayout.vue       # 管理员布局
├── services/                  # API 服务层
│   └── articleService.js     # 文章API服务
├── store/                     # 状态管理
│   └── auth.js                # 身份认证状态
├── utils/                     # 工具函数
│   └── lazyLoad.js           # 懒加载工具
└── assets/                    # 静态资源
    ├── icon/                  # 图标文件
    └── BlogPicture/          # 博客图片
```

### 主要功能
- **响应式设计** - 完美适配桌面端、平板和移动端设备
- **文章浏览** - 支持分页展示、分类筛选、实时搜索
- **评论系统** - 完整的评论发表、显示和管理功能
- **点赞功能** - 文章点赞和统计显示
- **管理后台** - 功能完整的文章和评论管理系统
- **音乐播放器** - 浮动式播放器，支持多首歌曲循环播放
- **主题切换** - 支持明暗主题切换，自动保存用户偏好
- **Markdown渲染** - 支持实时预览和语法高亮
- **图片优化** - 标准HTML图片加载，支持错误处理和懒加载
- **导航增强** - 智能导航栏，支持滚动隐藏和鼠标悬停显示

### 特色组件
- **MusicPlayer** - 浮动式音乐播放器，支持多首歌曲循环播放，响应式设计
- **SearchBar** - 实时搜索功能，支持文章标题和内容搜索，高性能防抖处理
- **ArticleEditor** - 专业的Markdown编辑器，支持所见即所得编辑和实时预览
- **CommentSection** - 完整的评论系统，支持评论发表、显示和点赞功能
- **LazyCommentSection** - 懒加载评论组件，优化页面加载性能
- **PersonalInfo** - 智能个人信息侧边栏，包含实时时钟、技能展示和联系方式
- **Toast** - 全局消息提示系统，支持多种消息类型和自动消失
- **InfiniteScroll** - 无限滚动组件，提供流畅的内容加载体验

## 🛠️ 启动项目

### 1. 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 2. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd backend
npm install
```

### 3. 启动后端服务

```bash
cd backend
npm run start:dev
```

后端服务将在 `http://localhost:3000` 启动

### 4. 启动前端开发服务器

```bash
npm run dev
```

前端开发服务器将在 `http://localhost:5174` 启动（已配置固定端口）

### 5. 访问应用

- **前端页面**: http://localhost:5174
- **后端 API**: http://localhost:3000
- **管理后台**: http://localhost:5174/admin/login

### 6. 管理员登录

默认管理员密码：`admin123`

## 📦 构建部署

```bash
# 构建前端
npm run build

# 构建后端
cd backend
npm run build

# 生产环境启动后端
npm run start:prod
```

## 🎵 特色功能

### 核心特性
- **🎧 音乐播放器** - 内置三首高品质背景音乐（Flower Dance、Mirage、Nightfall），支持循环播放
- **📱 响应式设计** - 完美适配各种设备尺寸，提供最佳用户体验
- **🛡️ 管理后台** - 功能完整的文章和评论管理系统，支持实时统计
- **🔍 实时搜索** - 高性能搜索功能，快速定位目标文章
- **🌙 主题切换** - 明暗两种主题模式，自动保存用户偏好
- **💬 评论系统** - 完整的评论发表、管理和审核功能
- **❤️ 点赞功能** - 文章点赞统计和用户互动

### 性能优化
- **⚡ 懒加载** - 评论组件和图片懒加载，提升页面加载速度
- **🖼️ 图片优化** - 标准HTML图片加载，支持错误处理和占位符
- **🚀 代码分割** - 异步组件加载，减少初始包大小
- **📊 智能分页** - 高效的文章分页和筛选机制
- **⏱️ 防抖处理** - 搜索输入防抖，减少不必要的API调用
- **📦 构建优化** - 使用 Terser 进行代码压缩和移除控制台输出，配置 Vite 插件实现 gzip 压缩，优化代码分割策略，引入打包分析工具。

### 用户体验
- **🎨 流畅动画** - 使用Animate.css提供丰富的过渡动画
- **🖱️ 智能导航** - 滚动隐藏/显示导航栏，鼠标悬停自动显示
- **⏰ 实时时钟** - 个人信息区域显示当前时间和状态
- **🔧 技能展示** - 动态技能进度条展示
- **📱 移动优化** - 专门的移动端布局和交互设计

## 📝 开发说明

### 技术架构
本项目采用现代化前后端分离架构：
- **前端**: Vue 3 + Vite + Bootstrap 5，负责用户界面和交互
- **后端**: NestJS + TypeORM + SQLite，提供RESTful API接口和数据管理
- **通信**: HTTP/JSON数据交换，支持CORS跨域访问
- **状态管理**: 前端使用组合式API进行状态管理
- **路由管理**: Vue Router实现SPA单页应用体验

### 项目特色
1. **组件化开发** - 高度模块化的Vue组件设计，便于维护和扩展
2. **响应式设计** - 移动优先的设计理念，完美适配各种设备
3. **性能优化** - 懒加载、代码分割、图片优化等多种性能优化策略
4. **用户体验** - 流畅的动画效果、智能的交互设计
5. **开发体验** - 热重载、TypeScript支持、ESLint代码规范

### 最近更新
- ✅ **LazyImage组件重构** - 移除复杂的懒加载图片组件，使用标准HTML img标签
- ✅ **图片加载优化** - 添加图片验证逻辑，处理null值和加载错误
- ✅ **性能提升** - 简化代码结构，减少不必要的组件复杂度
- ✅ **兼容性改进** - 使用标准HTML元素，提高浏览器兼容性
- ✅ **Axios 迁移** - 将前端的 `fetch` 调用全部迁移到 `axios` 库，简化API请求和错误处理。
- ✅ **依赖优化** - 优化 `package.json` 依赖，移除不必要的库，精简项目体积。
- ✅ **构建配置增强** - 增强 Vite 构建配置，引入代码压缩、gzip 压缩和打包分析。
- ✅ **开发服务器修复** - 修复开发服务器启动错误，优化 Vite 依赖预构建配置。

### 开发规范
- 使用Vue 3 Composition API编写组件
- 遵循ESLint代码规范
- 组件命名采用PascalCase
- 文件命名采用kebab-case
- CSS类名使用Bootstrap命名规范

## 🎯 功能详细说明

### 文章系统
- **文章列表** - 支持分页显示、分类筛选、搜索功能
- **文章详情** - Markdown渲染、评论系统、点赞功能
- **文章管理** - 后台CRUD操作、富文本编辑器
- **分类支持** - 学习、游戏、个人作品、资源分享、其他

### 评论系统
- **评论发表** - 支持用户昵称、邮箱、评论内容
- **评论展示** - 按时间排序，支持分页
- **评论管理** - 管理员可以审核、删除评论
- **点赞功能** - 评论点赞统计

### 用户界面
- **主题切换** - 明暗主题，自动保存用户偏好
- **响应式设计** - 桌面端、平板、手机完美适配
- **动画效果** - 页面切换、组件加载动画
- **智能导航** - 滚动时自动隐藏/显示

### 管理后台
- **仪表板** - 文章统计、快速操作
- **文章管理** - 新建、编辑、删除文章
- **评论管理** - 查看、审核、删除评论
- **权限控制** - 密码验证登录

## 🔧 技术实现细节

### 前端技术栈
```json
{
  "vue": "^3.5.13",
  "vue-router": "^4.5.1", 
  "bootstrap": "^5.3.6",
  "bootstrap-icons": "^1.13.1",
  "md-editor-v3": "^5.6.0",
  "animate.css": "^4.1.1",
  "vite": "^6.3.5",
  "axios": "^1.9.0"
}
```

### 后端技术栈
```json
{
  "@nestjs/core": "^11.0.1",
  "@nestjs/typeorm": "^11.0.0",
  "typeorm": "^0.3.23",
  "sqlite3": "^5.1.7",
  "markdown-it": "^14.1.0"
}
```

### 数据库设计
- **Article表** - 文章信息（标题、内容、分类、创建时间等）
- **Comment表** - 评论信息（作者、内容、文章关联等）
- **Like表** - 点赞记录（用户、文章、类型等）

## 📱 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器（iOS Safari、Android Chrome）
