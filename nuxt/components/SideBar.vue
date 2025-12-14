<template>
  <!-- 桌面端侧边栏 -->
  <div class="desktop-sidebar d-none d-lg-block sidebar-fade-in">
    <div class="sidebar-content">
      <section class="sidebar-section category-section">
        <div class="category-grid">
          <button
            v-for="category in categories"
            :key="category.key"
            type="button"
            class="category-card"
            @click="goToCategory(category.key)"
          >
            <div class="category-main">
              <span class="category-icon">
                <Icon :name="category.icon" size="md" />
              </span>
              <p class="category-label">{{ category.label }}</p>
            </div>
            <span class="category-count">{{ category.count }} 篇</span>
          </button>
        </div>
      </section>

      <section class="sidebar-section archive-section">
        <div class="archive-list">
          <div
            v-for="month in monthArchives"
            :key="month.key"
            class="archive-item"
          >
            <div class="archive-meta">
              <p class="archive-month">{{ month.label }}</p>
            </div>
            <span class="archive-count">{{ month.count }} 篇</span>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- 移动端浮动按钮 -->
  <div class="mobile-personal-info d-lg-none">
    <div class="personal-info-sidebar" v-show="!isCollapsed">
      <div class="sidebar-content">
        <section class="sidebar-section category-section">
          <div class="category-grid">
            <button
              v-for="category in categories"
              :key="category.key"
              type="button"
              class="category-card"
              @click="goToCategory(category.key)"
            >
              <div class="category-main">
                <span class="category-icon">
                  <Icon :name="category.icon" size="md" />
                </span>
                <p class="category-label">{{ category.label }}</p>
              </div>
              <span class="category-count">{{ category.count }} 篇</span>
            </button>
          </div>
        </section>

        <section class="sidebar-section archive-section">
          <div class="archive-list">
            <div
              v-for="month in monthArchives"
              :key="month.key"
              class="archive-item"
            >
              <div class="archive-meta">
                <p class="archive-month">{{ month.label }}</p>
              </div>
              <span class="archive-count">{{ month.count }} 篇</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="toggle-button" @click="toggleCollapse">
      <Icon :name="isCollapsed ? 'layout-sidebar' : 'x-lg'" size="md" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useArticles } from '~/composables/useArticles';
import '../assets/css/components/SideBar.styles.css';

const router = useRouter();
const isCollapsed = ref(true);

const categories = ref([
  { key: 'study', label: '学习', icon: 'journal-text', count: 0 },
  { key: 'game', label: '游戏', icon: 'controller', count: 0 },
  { key: 'work', label: '个人作品', icon: 'code-square', count: 0 },
  { key: 'resource', label: '资源分享', icon: 'folder2-open', count: 0 }
]);

const generateRecentMonths = (length = 6) => {
  const months = [];
  const now = new Date();

  for (let i = 0; i < length; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label,
      count: 0,
      year: date.getFullYear(),
      month: date.getMonth() + 1
    });
  }

  return months;
};

const monthArchives = ref(generateRecentMonths());

// 获取文章数据并统计分类和月份
const { getAllArticles } = useArticles();

const fetchArticleStats = async () => {
  try {
    const articles = await getAllArticles();
    
    // 统计分类文章数
    const categoryCounts = {
      study: 0,
      game: 0,
      work: 0,
      resource: 0
    };

    // 统计月份文章数
    const monthCounts = {};

    articles.forEach(article => {
      // 统计分类
      if (article.category && categoryCounts[article.category] !== undefined) {
        categoryCounts[article.category]++;
      }

      // 统计月份 (假设文章有 createdAt 字段)
      if (article.createdAt) {
        const date = new Date(article.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    });

    // 更新分类计数
    categories.value.forEach(category => {
      category.count = categoryCounts[category.key] || 0;
    });

    // 更新月份计数
    monthArchives.value.forEach(month => {
      month.count = monthCounts[month.key] || 0;
    });

    console.log('SideBar: 文章统计完成', {
      categories: categoryCounts,
      months: monthCounts
    });
  } catch (error) {
    console.error('SideBar: 获取文章统计失败:', error);
  }
};

const goToCategory = (categoryKey) => {
  router.push({ path: '/', query: { category: categoryKey } });

  if (window.innerWidth < 992) {
    isCollapsed.value = true;
    localStorage.setItem('sidebarState', 'collapsed');
  }
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarState', isCollapsed.value ? 'collapsed' : 'expanded');
};

const handleClickOutside = (event) => {
  const sidebarContainer = document.querySelector('.mobile-personal-info');
  if (!isCollapsed.value && sidebarContainer && !sidebarContainer.contains(event.target)) {
    isCollapsed.value = true;
    localStorage.setItem('sidebarState', 'collapsed');
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  const savedState = localStorage.getItem('sidebarState');
  if (savedState) {
    isCollapsed.value = savedState === 'collapsed';
  }
  
  // 获取文章统计数据
  await fetchArticleStats();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
@import'../assets/css/components/SideBar.styles.css';
</style>
