# Loading Bar 和增强文件树使用说明

## 1. 页面加载条 (Loading Bar)

### 功能说明
在页面跳转时自动显示顶部加载进度条，类似 Naive UI 的 Loading Bar 效果。

### 实现方式
使用 Nuxt 内置的 `<NuxtLoadingIndicator>` 组件，已在 [app.vue](app/app.vue) 中全局集成。

### 配置说明
```vue
<NuxtLoadingIndicator 
  color="#18a058"      <!-- 加载条颜色（Naive UI 主题色） -->
  :height="3"          <!-- 加载条高度（px） -->
  :duration="2000"     <!-- 完成动画时长（ms） -->
  :throttle="200"      <!-- 节流延迟（ms） -->
/>
```

### 自定义配置
如需修改加载条样式，编辑 [app.vue](app/app.vue) 中的 `NuxtLoadingIndicator` 属性：

```vue
<!-- 修改颜色 -->
<NuxtLoadingIndicator color="#ff6b6b" />

<!-- 修改高度 -->
<NuxtLoadingIndicator :height="5" />

<!-- 禁用节流（立即显示） -->
<NuxtLoadingIndicator :throttle="0" />
```

### 特性
- ✅ 自动在路由变化时触发
- ✅ 支持错误状态（路由错误时显示红色）
- ✅ 流畅的进度动画
- ✅ 轻量级（Nuxt 内置）
- ✅ 无需额外配置

---

## 2. 增强文件树组件

### 功能说明
支持两种格式的文件树渲染：
1. **简单缩进格式**（原有功能）
2. **树形字符格式**（新增）

### 简单缩进格式

```markdown
::file-tree{title="项目结构"}
src/
  components/
    Button.vue
    Input.vue
  pages/
    index.vue
package.json
README.md
::
```

**规则**：
- 文件夹以 `/` 结尾
- 使用 2 个空格表示一级缩进
- 自动识别文件类型图标

### 树形字符格式（新）

```markdown
::file-tree{title="项目结构"}
my-nuxt-project/
├── node_modules/          # 依赖包（支持注释）
├── public/                # 静态资源
├── src/
│   ├── assets/           # 资源文件
│   ├── components/       # 组件
│   │   ├── global/       # 全局组件
│   │   └── Button.vue
│   ├── composables/      # 可组合函数
│   ├── pages/            # 路由页面
│   │   ├── index.vue
│   │   └── about.vue
│   └── App.vue           # 根组件
├── .nuxt/                # 临时文件
├── package.json
├── nuxt.config.ts        # 配置文件
└── README.md
::
```

**支持的树形字符**：
- `├──` - 中间节点
- `└──` - 最后节点
- `│` - 垂直连接线
- `├─`、`└─` - 短横线版本
- `|--`、`+--` - ASCII 版本

**规则**：
- 文件夹以 `/` 结尾
- 支持 `#` 注释（会被自动移除）
- 每级缩进通常是 `│   `（4 字符）或 `    `（4 空格）
- 自动识别文件类型和层级关系

### 文件类型图标

组件自动识别 **70+ 种文件类型**并显示对应图标：

**编程语言**：
- JavaScript/TypeScript：`js`, `ts`, `jsx`, `tsx`
- Web：`html`, `css`, `scss`, `sass`, `vue`, `jsx`
- 后端：`py`, `java`, `go`, `php`, `rb`, `rs`, `cs`, `cpp`
- 移动：`swift`, `kt`, `dart`

**配置文件**：
- `package.json`, `tsconfig.json`, `nuxt.config.ts`
- `Dockerfile`, `docker-compose.yml`
- `.gitignore`, `.eslintrc`, `.prettierrc`
- `webpack.config.js`, `vite.config.js`

**文档和资源**：
- Markdown：`md`
- 图片：`jpg`, `png`, `gif`, `svg`
- 文档：`pdf`, `txt`, `doc`

**特殊文件**：
- `README.md` - 信息图标
- `LICENSE` - 法律图标
- `Makefile` - 工具图标

### 图标颜色

不同类型文件显示不同颜色：
- 📁 文件夹：蓝色
- 🟡 JavaScript：黄色
- 🔵 TypeScript：深蓝
- 🟢 Vue：绿色
- 🔴 HTML：橙红
- 🟣 JSON：金黄
- ⚪ 其他：灰色

### 交互功能

- ✅ 点击展开/折叠文件夹
- ✅ 默认展开前 2 层
- ✅ 悬停高亮
- ✅ 深色模式支持

### 使用技巧

**复制真实项目结构**：
```bash
# Unix/Linux/Mac
tree -L 2 --charset ascii

# Windows（使用 tree 命令）
tree /F /A

# 使用 exa（推荐）
exa --tree --level=2
```

**在线生成**：
- [tree.nathanfriend.io](https://tree.nathanfriend.io/) - 可视化文件树生成器

**在 MDC 编辑器中**：
点击工具栏的 `📁 Tree` 按钮，会自动插入模板。

---

## 图标别名配置

项目使用 `nuxt-icon`，所有图标别名在 [app.config.ts](app/app.config.ts) 中配置。

### 文件树组件使用的图标

已在 `app.config.ts` 中注册以下图标别名：

```typescript
// 基础图标
'mdi:folder' → 'heroicons:folder'
'mdi:folder-open' → 'heroicons:folder-open'
'mdi:file-outline' → 'heroicons:document'
'mdi:chevron-right' → 'heroicons:chevron-right'
'mdi:chevron-down' → 'heroicons:chevron-down'

// 文件类型图标
'mdi:language-javascript' → 'heroicons:code-bracket'
'mdi:language-typescript' → 'heroicons:code-bracket'
'mdi:vuejs' → 'heroicons:code-bracket'
'mdi:npm' → 'heroicons:cube'
'mdi:git' → 'heroicons:code-bracket'
// ... 更多图标，共 40+ 个
```

### 添加新图标别名

如需使用其他图标，在 `app.config.ts` 的 `aliases` 中添加：

```typescript
export default defineAppConfig({
  icon: {
    aliases: {
      'my-custom-icon': 'heroicons:star',
      'another-icon': 'heroicons:bolt',
    }
  }
})
```

### 图标库

项目主要使用 **Heroicons**（Tailwind CSS 官方图标库）：
- 开源免费
- 简洁现代
- 完美适配 Tailwind 设计
- SVG 格式，高清矢量

查看所有可用图标：[heroicons.com](https://heroicons.com/)

---

## 常见问题

### Q: 加载条不显示？
A: 检查 `app.vue` 中是否添加了 `<NuxtLoadingIndicator>`。

### Q: 文件树解析错误？
A: 确保：
1. 文件夹名以 `/` 结尾
2. 树形字符使用正确（`├──`、`└──`、`│`）
3. 缩进一致（4 字符或 2 空格）

### Q: 图标不显示？
A: 检查 `app.config.ts` 中是否注册了对应的图标别名。

### Q: 如何禁用加载条？
A: 从 `app.vue` 中删除 `<NuxtLoadingIndicator>` 组件。

---

## 更多资源

- [Nuxt Loading Indicator 文档](https://nuxt.com/docs/api/components/nuxt-loading-indicator)
- [Nuxt Icon 文档](https://nuxt.com/modules/icon)
- [Heroicons 图标库](https://heroicons.com/)
- [MDC 组件完整指南](MDC_COMPONENTS_GUIDE.md)
