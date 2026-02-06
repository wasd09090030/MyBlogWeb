# MDC 组件使用指南

本项目提供了丰富的 MDC（Markdown Components）组件，可以在 Markdown 文章中直接使用，让内容更加生动和功能丰富。

## 内容组件

### 1. Alert 提示框

用于显示重要提示、警告或成功信息。

```markdown
::alert{type="info"}
#title
温馨提示
#default
这是一条提示信息，支持 **Markdown** 格式
::

::alert{type="success"}
操作成功！
::

::alert{type="warning"}
注意：此操作不可逆
::

::alert{type="error"}
错误：文件不存在
::
```

**属性**：
- `type`: 提示类型（info | success | warning | error）

---

### 2. Collapse 折叠面板

用于隐藏较长的内容，点击展开/收起。

```markdown
::collapse{title="点击查看更多"}
这里是折叠的详细内容，可以包含：

- 列表项
- **加粗文本**
- `代码片段`

支持任何 Markdown 语法！
::
```

**属性**：
- `title`: 折叠面板标题
- `defaultOpen`: 是否默认展开

---

### 3. Tabs 标签页

创建多个标签页来组织相关内容。

```markdown
::tabs
---
labels: ["Vue 3", "React", "Angular"]
---
#tab-0
Vue 3 使用 Composition API：
\`\`\`vue
<script setup>
const count = ref(0)
</script>
\`\`\`

#tab-1
React 使用 Hooks：
\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

#tab-2
Angular 使用装饰器：
\`\`\`typescript
@Component({...})
\`\`\`
::
```

**属性**：
- `labels`: 标签页标题数组（在 YAML frontmatter 中定义）

---

### 4. Steps 步骤条

展示流程步骤或教程进度。

```markdown
::steps{current="2" status="process"}
---
steps:
  - title: "创建项目"
    description: "使用脚手架创建新项目"
  - title: "安装依赖"
    description: "npm install 安装所需依赖"
  - title: "运行项目"
    description: "npm run dev 启动开发服务器"
  - title: "构建部署"
    description: "npm run build 构建生产版本"
---
::

::steps{current="1" vertical}
---
steps:
  - title: "准备工作"
    description: "检查环境配置"
  - title: "开始操作"
    description: "执行主要任务"
  - title: "完成"
    description: "验证结果"
---
::
```

**属性**：
- `current`: 当前步骤（从1开始）
- `status`: 当前步骤状态（process | finish | error | wait）
- `vertical`: 是否垂直布局
- `size`: 尺寸（small | medium）
- `steps`: 步骤列表（在 YAML frontmatter 中定义）

---

## 媒体组件

### 5. ImageEnhanced 增强图片

比原生 Markdown 图片更强大，支持缩放、阴影、边框等。

```markdown
::image-enhanced{src="/img/screenshot.jpg" caption="界面截图" zoomable shadow rounded}
::

::image-enhanced{src="/img/photo.jpg" alt="风景照" width="600" align="center" border}
::

::image-enhanced{src="/img/banner.jpg" caption="项目横幅" width="100%" shadow}
::
```

**属性**：
- `src`: 图片地址（必填）
- `alt`: 替代文本
- `caption`: 图片说明文字
- `width`: 宽度（px 或百分比，默认 100%）
- `height`: 高度
- `align`: 对齐方式（left | center | right）
- `shadow`: 显示阴影
- `border`: 显示边框
- `rounded`: 圆角
- `zoomable`: 支持点击放大（默认 true）
- `lazy`: 懒加载（默认 true）

**特性**：
- 点击图片全屏预览（Lightbox）
- 悬停显示放大图标
- 支持键盘 ESC 关闭预览
- 响应式设计

---

### 6. ImageComparison 图片对比

展示前后对比效果，支持拖动滑块。

```markdown
::image-comparison{before="/img/before.jpg" after="/img/after.jpg" aspectRatio="16/9"}
::

::image-comparison{before="/img/old-design.jpg" after="/img/new-design.jpg" aspectRatio="4/3" showLabels beforeLabel="旧版" afterLabel="新版"}
::
```

**属性**：
- `before`: 前图地址
- `after`: 后图地址
- `aspectRatio`: 宽高比（默认 16/9）
- `showLabels`: 是否显示标签
- `beforeLabel`: 前图标签
- `afterLabel`: 后图标签

---

### 7. WebEmbed 网页嵌入

嵌入 Bilibili、YouTube、CodePen 等外部内容。

```markdown
::web-embed{url="https://www.bilibili.com/video/BV1xx411c7mD"}
::

::web-embed{url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" aspectRatio="16/9"}
::

::web-embed{platform="codepen" url="https://codepen.io/username/pen/abc123"}
::
```

**属性**：
- `url`: 嵌入地址（必填）
- `platform`: 平台（bilibili | youtube | codepen 等）
- `aspectRatio`: 宽高比（默认 16/9）
- `caption`: 说明文字

**支持平台**：
- Bilibili（自动转换 BV/av 号）
- YouTube
- CodePen
- 通用 iframe

---

## 开发组件

### 8. CodePlayground 代码演示

可交互的代码编辑和运行环境。

```markdown
::code-playground{lang="javascript" title="计算器示例" editable runnable}
function add(a, b) {
  return a + b
}

function multiply(a, b) {
  return a * b
}

console.log('2 + 3 =', add(2, 3))
console.log('4 × 5 =', multiply(4, 5))
::

::code-playground{lang="html" title="HTML 示例"}
<div class="card">
  <h2>标题</h2>
  <p>内容</p>
</div>
::
```

**属性**：
- `lang`: 语言类型（javascript | html | css 等）
- `title`: 标题
- `editable`: 是否可编辑
- `runnable`: 是否可运行（仅 JS）

**特性**：
- 实时编辑
- 运行 JavaScript 代码
- 捕获 console.log 输出
- 代码高亮
- 一键复制

---

### 9. FileTree 文件树

展示项目文件结构，支持展开/折叠。

```markdown
::file-tree{title="项目结构"}
src/
  components/
    Button.vue
    Input.vue
    Modal.vue
  pages/
    index.vue
    about.vue
  stores/
    user.js
  utils/
    helpers.js
  App.vue
  main.js
public/
  favicon.ico
  logo.svg
package.json
README.md
vite.config.js
::
```

**属性**：
- `title`: 树的标题

**特性**：
- 自动识别文件夹（以 `/` 结尾）
- 文件类型图标（自动匹配扩展名）
- 彩色图标（不同语言不同颜色）
- 展开/折叠动画
- 默认展开前2层

**支持的文件类型**：
- 代码：js, ts, vue, jsx, tsx, py, java, go, rust, php, ruby 等
- Web：html, css, scss, sass, less
- 配置：json, yaml, xml, env, toml
- 文档：md, txt, pdf
- 图片：jpg, png, gif, svg
- 特殊：package.json, Dockerfile, .gitignore 等

---

## 社交组件

### 10. GithubCard GitHub 仓库卡片

展示 GitHub 仓库的详细信息。

```markdown
::github-card{repo="vuejs/core"}
::

::github-card{repo="nuxt/nuxt"}
::

::github-card{repo="facebook/react"}
::
```

**属性**：
- `repo`: 仓库名称，格式：`owner/repo`（必填）

**展示信息**：
- 仓库名称和描述
- Star、Fork、Issue 数量
- 主要编程语言（带颜色标识）
- 开源协议
- 最后更新时间

**特性**：
- 实时从 GitHub API 获取数据
- 骨架屏加载动画
- 错误提示
- 响应式设计
- 深色模式支持

---

### 11. StarRating 星级评分

展示评分或推荐指数。

```markdown
::star-rating{rating="4.5" maxStars="5" label="推荐指数" showScore}
::

::star-rating{rating="5" maxStars="5" label="完美体验！"}
::

::star-rating{rating="3.7" size="large" showScore}
::
```

**属性**：
- `rating`: 评分（支持小数）
- `maxStars`: 最大星数（默认 5）
- `size`: 尺寸（small | medium | large）
- `readonly`: 只读（默认 true）
- `showScore`: 显示分数
- `label`: 标签文字

**特性**：
- 支持半星显示
- 使用 Naive UI 组件
- 精美的视觉效果
- 可交互（设置 `readonly="false"`）

---

## 使用技巧

### 在编辑器中快速插入

文章编辑页面的 MDC 工具栏提供了所有组件的快捷插入按钮，点击即可插入模板。

### 组合使用

MDC 组件可以嵌套使用：

```markdown
::tabs
---
labels: ["安装", "配置", "运行"]
---
#tab-0
::steps{current="3"}
---
steps:
  - title: "安装 Node.js"
  - title: "安装依赖"
  - title: "启动项目"
---
::

#tab-1
::code-playground{lang="json" title="package.json"}
{
  "name": "my-project",
  "version": "1.0.0"
}
::

#tab-2
::alert{type="success"}
项目已成功运行！
::
::
```

### 响应式设计

所有组件都支持响应式设计，在移动设备上自动适配。

### 深色模式

所有组件都支持深色模式，会根据系统主题自动切换。

---

## 故障排除

### 组件不显示？

1. 确认 `nuxt.config.ts` 中已配置 `components` 目录
2. 检查语法是否正确（`::`、`#`、`---` 等）
3. 查看浏览器控制台是否有错误

### GitHub 卡片加载失败？

- 检查网络连接
- 确认仓库名称格式正确（`owner/repo`）
- GitHub API 有速率限制（每小时60次）

### 图片不显示？

- 确认图片路径正确
- 使用相对路径（`/img/...`）或完整 URL

---

## 更多帮助

如需更多帮助，请查看各组件的源码注释或联系开发团队。
