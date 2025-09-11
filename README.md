# 个人博客系统

一个现代化的全栈个人博客系统，支持文章管理、评论系统、图片画廊和音乐播放功能。

## ✨ 核心特性

- 🎵 **音乐播放器** - 内置高品质背景音乐
- 📝 **文章系统** - Markdown编辑，分类管理，实时搜索
- 💬 **评论功能** - 完整的评论发表和管理系统
- �️ **图片画廊** - 优雅的图片展示和管理
- 🛡️ **管理后台** - 功能完整的内容管理系统
- 📱 **响应式设计** - 完美适配各种设备
- 🌙 **主题切换** - 明暗主题，自动保存偏好

## 🚀 技术栈

**前端**: Vue 3 + Vite + Bootstrap 5 + Vue Router + Axios  
**后端**: NestJS + TypeORM + SQLite + Markdown-it  
**特色**: 组件化开发，RESTful API，性能优化

## 🛠️ 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装和运行
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install

# 启动后端服务 (http://localhost:3000)
npm run start:dev

# 启动前端开发服务器 (http://localhost:5174)
cd .. && npm run dev
```

### 管理后台
- 地址: http://localhost:5174/admin/login
- 默认密码: `admin123`

## 📦 构建部署

```bash
# 构建前端
npm run build

# 构建后端
cd backend && npm run build

# 生产环境运行
npm run start:prod
```

## � 主要功能

### 文章系统
- 支持 Markdown 编辑和渲染
- 文章分类（学习、游戏、作品、资源、其他）
- 实时搜索和分页显示
- 文章点赞统计

### 评论系统
- 用户评论发表和展示
- 管理员审核和删除
- 评论点赞功能

### 管理后台
- 文章 CRUD 操作
- 评论管理和统计
- Markdown 编辑器
- 数据可视化

### 用户界面
- 响应式设计，完美适配移动端
- 明暗主题切换
- 流畅动画效果
- 智能导航栏

## 📱 浏览器支持

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+