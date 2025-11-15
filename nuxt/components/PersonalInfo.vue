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
                <i :class="category.icon"></i>
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
              <p class="archive-subtitle">文章数量统计准备中</p>
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
                  <i :class="category.icon"></i>
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
                <p class="archive-subtitle">文章数量统计准备中</p>
              </div>
              <span class="archive-count">{{ month.count }} 篇</span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="toggle-button" @click="toggleCollapse">
      <i class="bi" :class="isCollapsed ? 'bi-layout-text-sidebar-reverse' : 'bi-x-circle'"></i>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import '../assets/css/components/PersonalInfo.styles.css';

const router = useRouter();
const isCollapsed = ref(true);

const categories = [
  { key: 'study', label: '学习', icon: 'bi bi-journal-bookmark', count: 0 },
  { key: 'game', label: '游戏', icon: 'bi bi-controller', count: 0 },
  { key: 'work', label: '个人作品', icon: 'bi bi-tools', count: 0 },
  { key: 'resource', label: '资源分享', icon: 'bi bi-briefcase', count: 0 }
];

const generateRecentMonths = (length = 6) => {
  const months = [];
  const now = new Date();

  for (let i = 0; i < length; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    months.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label,
      count: 0
    });
  }

  return months;
};

const monthArchives = ref(generateRecentMonths());

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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  const savedState = localStorage.getItem('sidebarState');
  if (savedState) {
    isCollapsed.value = savedState === 'collapsed';
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
@import'../assets/css/components/PersonalInfo.styles.css';
</style>
