<template>
  <section class="about-page">
    <Motion
      class="about-hero"
      :initial="heroMotion.initial"
      :animate="heroMotion.enter"
    >
      <div class="hero-left">
        <span class="hero-eyebrow"><i class="bi bi-cookie"></i> {{ ownerProfile.role }}</span>
        <h1 class="hero-title">{{ ownerProfile.name }} · {{ ownerProfile.alias }}</h1>
        <p class="hero-description">{{ ownerProfile.description }}</p>
        <div class="hero-tags">
          <span v-for="tag in ownerProfile.tags" :key="tag" class="hero-tag">{{ tag }}</span>
        </div>
        <div class="hero-cta">
          <button type="button" class="primary" @click="goToArticles">
            <i class="bi bi-lightning-charge-fill me-2"></i>最新作品
          </button>
          <a class="secondary" href="https://github.com/wasd09090030" target="_blank" rel="noopener">
            <i class="bi bi-github me-2"></i>我的Github
          </a>
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-card">
          <div class="hero-avatar">
            <div class="hero-avatar-icon">
              <i class="bi bi-joystick"></i>
            </div>
            <div>
              <h3>{{ ownerProfile.callSign }}</h3>
              <p class="mb-0">{{ ownerProfile.location }}</p>
            </div>
          </div>
          <p class="hero-card-note">{{ ownerProfile.statusLine }}</p>
          <div class="hero-stats">
            <div v-for="stat in heroStats" :key="stat.label" class="hero-stat">
              <div class="hero-stat-value">{{ stat.value }}</div>
              <div class="hero-stat-label">{{ stat.label }}</div>
              <small>{{ stat.caption }}</small>
            </div>
          </div>
        </div>
      </div>
    </Motion>

    <div class="about-highlight-grid">
      <Motion
        v-for="(card, index) in highlightCards"
        :key="card.title"
        tag="article"
        class="highlight-card"
        :initial="getStaggerMotion(index).initial"
        :animate="getStaggerMotion(index).enter"
      >
        <div class="highlight-icon" :style="{ background: card.accent }">
          <i :class="card.icon"></i>
        </div>
        <h3 class="highlight-title">{{ card.title }}</h3>
        <p class="highlight-desc">{{ card.description }}</p>
      </Motion>
    </div>

    <Motion
      tag="section"
      class="project-section"
      :initial="sectionMotion.initial"
      :animate="sectionMotion.enter"
    >
      <div class="section-header">
        <span>PROJECTS</span>
        <h2>我的作品集</h2>
        <p>从后台 API 到前端动效，全都为了给同好准备更有温度的体验。</p>
      </div>
      <div class="project-grid">
        <Motion
          v-for="(project, index) in projects"
          :key="project.title"
          tag="article"
          class="project-card"
          :data-status="project.status"
          :class="project.accent"
          :initial="getProjectMotion(index).initial"
          :animate="getProjectMotion(index).enter"
        >
          <h3 class="project-title">{{ project.title }}</h3>
          <p class="project-desc">{{ project.description }}</p>
          <div class="project-meta">
            <span><i class="bi bi-people"></i> {{ project.vibe }}</span>
            <span><i class="bi bi-clock-history"></i> {{ project.update }}</span>
          </div>
          <div class="project-tags">
            <span v-for="tag in project.tags" :key="tag" class="project-tag">{{ tag }}</span>
          </div>
          <NuxtLink v-if="project.link" :to="project.link" class="project-link">
            <span>{{ project.cta }}</span>
            <i class="bi bi-arrow-up-right"></i>
          </NuxtLink>
          <a
            v-else-if="project.external"
            :href="project.external"
            class="project-link"
            target="_blank"
            rel="noopener"
          >
            <span>{{ project.cta }}</span>
            <i class="bi bi-arrow-up-right"></i>
          </a>
        </Motion>
      </div>
    </Motion>

    <Motion
      tag="section"
      class="tech-section"
      :initial="sectionMotion.initial"
      :animate="sectionMotion.enter"
    >
      <div class="section-header">
        <span>TOOLBOX</span>
        <h2>常备技术</h2>
        <p>技多不压身</p>
      </div>
      <div class="tech-grid">
        <Motion
          v-for="(stack, index) in techStacks"
          :key="stack.title"
          tag="article"
          class="tech-card"
          :initial="getStaggerMotion(index, 0.2).initial"
          :animate="getStaggerMotion(index, 0.2).enter"
        >
          <h3><i :class="[stack.icon, 'me-2']"></i>{{ stack.title }}</h3>
          <div class="tech-pills">
            <span v-for="item in stack.items" :key="item" class="tech-pill">{{ item }}</span>
          </div>
        </Motion>
      </div>
    </Motion>

  </section>
</template>

<script setup>
import { Motion } from 'motion-v'
import '~/assets/css/components/AboutPage.styles.css'

// 设置页面元数据
useHead({
  title: 'WyrmKk - 站长主页',
  meta: [
    {
      name: 'description',
      content: '站长主页，展示个人信息、项目和技术栈。'
    }
  ]
})

const router = useRouter()

const ownerProfile = {
  name: 'WyrmKk',
  alias: '站长 / Builder',
  role: '谁是站长？',
  description: '飞舞大学生一只，什么领域都涉猎，什么类型的游戏都玩，天天就爱往群里搬点💩',
  tags: ['大学牲', '开摆', '天天打游戏','乐急典蚌孝','期末通关','私宅'],
  callSign: 'WyrmKk',
  location: '南京/盐城/无锡 随机刷新',
  statusLine: '摸鱼中'
}

const heroStats = [
  { label: '年龄', value: '20+', caption: '坚持每天摄入2000大卡' },
  { label: '项目', value: 'N+', caption: '写小垃圾自娱自乐' },
  { label: '冲浪经验', value: '∞', caption: '互联网乐子人' }
]

const highlightCards = [
  {
    title: '网站前端',
    description: 'Nuxt + Vue3 + Pinia + Swiper.js，打造流畅交互体验。',
    icon: 'bi bi-magic',
    accent: 'linear-gradient(135deg, #c084fc, #a855f7)'
  },
  {
    title: '网站后端',
    description: 'Asp.Net Core + Entity Framework + Sqlite，支撑内容高效流转。',
    icon: 'bi bi-boxes',
    accent: 'linear-gradient(135deg, #60a5fa, #2563eb)'
  },
  {
    title: '部署服务器',
    description: '宝塔面板（懒人必备） + Cloudflare，确保网站稳定在线。',
    icon: 'bi bi-hdd-stack-fill',
    accent: 'linear-gradient(135deg, #f97316, #fb7185)'
  }
]

const projects = [
  {
    title: 'Blog API 中枢',
    description: '.NET 8 + EntityFramework + Sqlite3，负责全站内容流转。',
    status: 'LIVE',
    vibe: 'REST · Swagger 可玩',
    update: '坚持更新',
    tags: ['.NET 8', 'Sqlite3', 'EFCore', 'Swagger'],
    cta: '查看接口蓝图',
    external: 'https://github.com/wasd09090030/MyBlogWeb/tree/master/backend-dotnet',
    accent: 'accent-violet'
  },
  {
    title: 'Nuxt 前台构建',
    description: 'SSR + Pinia + 自定义动效，把内容和氛围一起呈现。',
    status: 'BETA',
    vibe: '互动动效控',
    update: '持续微调',
    tags: ['Nuxt 3', 'Pinia', 'Swiper', 'Motion-v'],
    cta: '回到首页',
    link: '/',
    accent: 'accent-sky'
  },
  {
    title: 'SwiperJS 画廊',
    description: '展示各个网站搜罗到的图，二次元为主，持续更新中。',
    status: 'Show',
    vibe: '社群共创',
    update: '持续更新',
    tags: ['Serverless', '二次元', '轮播图库'],
    cta: '浏览画廊',
    link: '/gallery',
    accent: 'accent-sunset'
  }
]

const techStacks = [
  {
    title: '前端',
    icon: 'bi bi-cpu',
    items: ['Nuxt 3', 'Vue 3', 'Pinia', 'motion-v']
  },
  {
    title: '后端',
    icon: 'bi bi-diagram-3',
    items: ['.NET 8', 'Entity Framework', 'Sqlite3', 'Redis','Python','Node.js']
  },
  {
    title: 'UX Toolkit',
    icon: 'bi bi-palette',
    items: ['Bootstrap 5', 'Tailwind CSS','Element Plus', 'motion-v', 'Custom Animations']
  },
    {
    title: '跨平台客户端',
    icon: 'bi bi-palette',
    items: ['Flutter', 'Electron','QT', 'Webview2']
  },
  {
    title: 'AI 工具',
    icon: 'bi bi-heart',
    items: ['GitHub Copilot', 'Claude', 'ChatGPT', 'DeepSeek','Qwen']
  }
]


const createMotion = (delay = 0.1, offset = 24) => ({
  initial: { opacity: 0, y: offset },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      type: 'spring',
      stiffness: 180,
      damping: 22
    }
  }
})

const heroMotion = createMotion(0.05, 32)
const sectionMotion = createMotion(0.12, 28)

const getStaggerMotion = (index, baseDelay = 0.15) => createMotion(baseDelay + index * 0.07, 22)

const getProjectMotion = (index) => ({
  initial: { opacity: 0, y: 28, scale: 0.96 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.2 + index * 0.06,
      type: 'spring',
      stiffness: 210,
      damping: 24
    }
  }
})

const goToArticles = () => {
  router.push({ path: '/', query: { category: 'work' } })
}
</script>
