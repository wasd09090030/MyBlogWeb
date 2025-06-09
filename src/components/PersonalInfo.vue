<template>  <!-- 桌面端侧边栏 -->
  <div class="desktop-sidebar d-none d-lg-block animate__animated animate__fadeInLeft">
    <div class="sidebar-content">
      <div class="user-profile text-center">
        <div class="avatar-container animate__animated animate__bounceIn animate__delay-1s" @click="triggerAvatarEffect">
          <img src="../assets/icon/Master.ico" alt="用户头像" class="avatar-img">
          <div class="avatar-overlay" :class="{ 'active': avatarClicked }">
            <i class="bi bi-stars"></i>
          </div>
        </div>
        <h4 class="user-name mt-3 animate__animated animate__fadeInUp animate__delay-1.5s">WASD09090030</h4>
        <div class="user-status animate__animated animate__fadeIn animate__delay-1.7s">
          <span class="status-dot" :class="statusClass"></span>
          <span class="status-text">{{ currentStatus }}</span>
        </div>
      </div>
      
      <!-- 实时时钟 -->
      <div class="live-clock animate__animated animate__fadeInUp animate__delay-2s">
        <div class="clock-display">
          <i class="bi bi-clock me-2"></i>
          {{ currentTime }}
        </div>
        <div class="date-display">{{ currentDate }}</div>
      </div>

      <!-- 个人技能展示 -->
      <div class="skills-section animate__animated animate__fadeInUp animate__delay-2.2s">
        <h5 class="section-title">
          <i class="bi bi-gear me-2"></i>技能等级
        </h5>
        <div class="skills-list">
          <div v-for="skill in skills" :key="skill.name" class="skill-item" @click="animateSkill(skill)">
            <div class="skill-header">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-level">{{ skill.level }}%</span>
            </div>
            <div class="skill-bar">
              <div class="skill-progress" :style="{ width: skill.level + '%' }" :class="skill.color"></div>
            </div>
          </div>
        </div>
      </div>      <div class="contact-info mt-4 animate__animated animate__fadeInUp animate__delay-2.8s">
        <h5>联系我：</h5>
        <div class="contact-icons">
          <a href="mailto:qq86280630qq@163.com" class="contact-icon email-icon" title="发送邮件: qq86280630qq@163.com">
            <i class="bi bi-envelope"></i>
          </a>
          <a href="https://github.com/WASD09090030" target="_blank" class="contact-icon github-icon" title="访问GitHub: WASD09090030">
            <i class="bi bi-github"></i>
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- 移动端浮动按钮 -->
  <div class="mobile-personal-info d-lg-none">    <!-- 侧边栏内容 -->
    <div class="personal-info-sidebar" v-show="!isCollapsed">
      <div class="sidebar-content">
        <div class="user-profile text-center">
          <div class="avatar-container" @click="triggerAvatarEffect">
            <img src="../assets/icon/Master.ico" alt="用户头像" class="avatar-img">
            <div class="avatar-overlay" :class="{ 'active': avatarClicked }">
              <i class="bi bi-stars"></i>
            </div>
          </div>
          <h4 class="user-name mt-3">WASD09090030</h4>
          <div class="user-status">
            <span class="status-dot" :class="statusClass"></span>
            <span class="status-text">{{ currentStatus }}</span>
          </div>
        </div>
        
        <!-- 移动端也包含同样的功能 -->
        <div class="live-clock">
          <div class="clock-display">
            <i class="bi bi-clock me-2"></i>
            {{ currentTime }}
          </div>
          <div class="date-display">{{ currentDate }}</div>
        </div>

        <div class="skills-section">
          <h5 class="section-title">
            <i class="bi bi-gear me-2"></i>技能等级
          </h5>
          <div class="skills-list">
            <div v-for="skill in skills" :key="skill.name" class="skill-item" @click="animateSkill(skill)">
              <div class="skill-header">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-level">{{ skill.level }}%</span>
              </div>
              <div class="skill-bar">
                <div class="skill-progress" :style="{ width: skill.level + '%' }" :class="skill.color"></div>
              </div>
            </div>
          </div>
        </div>       

         <div class="contact-info mt-4">
          <h5>联系我：</h5>
          <div class="contact-icons">
            <a href="mailto:qq86280630qq@163.com" class="contact-icon email-icon" title="发送邮件: qq86280630qq@163.com">
              <i class="bi bi-envelope"></i>
            </a>
            <a href="https://github.com/WASD09090030" target="_blank" class="contact-icon github-icon" title="访问GitHub: WASD09090030">
              <i class="bi bi-github"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="toggle-button" @click="toggleCollapse">
      <i class="bi" :class="isCollapsed ? 'bi-person-circle' : 'bi-x-circle'"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isCollapsed = ref(true);
const avatarClicked = ref(false);
const currentTime = ref('');
const currentDate = ref('');
const currentStatus = ref('在线中');
const statusClass = ref('status-online');

// 技能数据
const skills = ref([
  { name: 'JavaScript', level: 85, color: 'js-color' },
  { name: 'Vue.js', level: 80, color: 'vue-color' },  { name: 'Python', level: 70, color: 'python-color' },
]);

// 切换侧边栏
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarState', isCollapsed.value ? 'collapsed' : 'expanded');
};

// 头像点击效果
const triggerAvatarEffect = () => {
  avatarClicked.value = true;
  setTimeout(() => {
    avatarClicked.value = false;
  }, 1000);
};

// 技能动画
const animateSkill = (skill) => {
  const originalLevel = skill.level;
  skill.level = 0;
  setTimeout(() => {
    skill.level = originalLevel;  }, 100);
};

// 更新时间
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

// 更新状态
const updateStatus = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    currentStatus.value = '早安时光';
    statusClass.value = 'status-morning';
  } else if (hour >= 12 && hour < 18) {
    currentStatus.value = '午后编程';
    statusClass.value = 'status-afternoon';
  } else if (hour >= 18 && hour < 22) {
    currentStatus.value = '夜晚思考';
    statusClass.value = 'status-evening';
  } else {
    currentStatus.value = '深夜码农';
    statusClass.value = 'status-night';
  }
};

// 页面点击外部区域处理
const handleClickOutside = (event) => {
  const sidebarContainer = document.querySelector('.mobile-personal-info');
  if (!isCollapsed.value && sidebarContainer && !sidebarContainer.contains(event.target)) {
    isCollapsed.value = true;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  
  // 恢复用户偏好
  const savedState = localStorage.getItem('sidebarState');
  if (savedState) {
    isCollapsed.value = savedState === 'collapsed';
  }
  
  // 开始时间更新
  updateTime();
  updateStatus();
  setInterval(updateTime, 1000);
  setInterval(updateStatus, 60000); // 每分钟检查状态
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 桌面端侧边栏样式 */
.desktop-sidebar {
  height: 100%;
  position: sticky;
  top: 20px;
}

.desktop-sidebar .sidebar-content {
  background-color: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

[data-bs-theme="dark"] .desktop-sidebar .sidebar-content {
  background-color: var(--bs-dark);
  border-color: var(--bs-border-color-translucent);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* 移动端浮动按钮和侧边栏 */
.mobile-personal-info {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
}

.personal-info-sidebar {
  background-color: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: 15px 0 0 15px;
  box-shadow: -5px 0 20px rgba(0,0,0,0.15);
  padding: 1.5rem;
  transition: all 0.3s ease;
  width: 280px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 999;
  margin-right: 10px;
}

[data-bs-theme="dark"] .personal-info-sidebar {
  background-color: var(--bs-dark);
  border-color: var(--bs-border-color-translucent);
  box-shadow: -5px 0 20px rgba(0,0,0,0.4);
}

.toggle-button {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 1001;
  font-size: 1.4rem;
  border: none;
}

.toggle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.toggle-button:active {
  transform: scale(0.95);
}

/* 通用样式 */
.avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 3px solid var(--bs-primary);
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;
}

.avatar-container:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 215, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0);
  transition: all 0.3s ease;
}

.avatar-overlay.active {
  opacity: 1;
  transform: scale(1);
  animation: sparkle 0.6s ease-out;
}

.avatar-overlay i {
  font-size: 2rem;
  color: white;
  animation: spin 0.6s ease-in-out;
}

.user-name {
  margin-top: 1rem;
  font-weight: 600;
  color: var(--bs-body-color);
  font-size: 1.2rem;
}

.user-status {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-online { background-color: #28a745; }
.status-morning { background-color: #ffc107; }
.status-afternoon { background-color: #fd7e14; }
.status-evening { background-color: #6f42c1; }
.status-night { background-color: #343a40; }

.status-text {
  font-size: 0.85rem;
  color: var(--bs-text-muted);
  font-weight: 500;
}

/* 实时时钟样式 */
.live-clock {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.clock-display {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.date-display {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* 技能展示样式 */
.skills-section {
  margin: 1.5rem 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--bs-body-color);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skill-item {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 8px;
}

.skill-item:hover {
  background-color: var(--bs-light);
  transform: translateX(5px);
}

[data-bs-theme="dark"] .skill-item:hover {
  background-color: var(--bs-gray-800);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.skill-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--bs-body-color);
}

.skill-level {
  font-size: 0.8rem;
  color: var(--bs-text-muted);
  font-weight: 600;
}

.skill-bar {
  width: 100%;
  height: 6px;
  background-color: var(--bs-border-color);
  border-radius: 3px;
  overflow: hidden;
}

.skill-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}

.js-color { background: linear-gradient(90deg, #f7df1e, #f0d800); }
.vue-color { background: linear-gradient(90deg, #4fc08d, #42b883); }
.node-color { background: linear-gradient(90deg, #8cc84b, #6bb349); }
.python-color { background: linear-gradient(90deg, #3776ab, #2e5d8a); }
.css-color { background: linear-gradient(90deg, #1572b6, #0e5aa3); }

.contact-info {
  margin-top: 1rem;
  margin-bottom: 0.3rem;
  padding-top: 0.3rem;
  border-top: 2px solid var(--bs-border-color);
}

.contact-info h5 {
  color: var(--bs-body-color);
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.contact-icons {
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  padding: 0.5rem 0;
}

.contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.contact-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transform: scale(0);
  transition: transform 0.3s ease;
}

.contact-icon:hover::before {
  transform: scale(1);
  animation: ripple 0.6s ease-out;
}

.contact-icon i {
  font-size: 1.5rem;
  transition: all 0.3s ease;
  z-index: 2;
  position: relative;
}

/* 邮箱图标样式 */
.email-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.email-icon:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
  color: white;
}

.email-icon:hover i {
  animation: emailBounce 0.6s ease-in-out;
}

/* GitHub图标样式 */
.github-icon {
  background: linear-gradient(135deg, #24292e 0%, #586069 100%);
  color: white;
}

.github-icon:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 10px 25px rgba(36, 41, 46, 0.4);
  color: white;
  animation: githubPulse 1.5s infinite;
}

.github-icon:hover i {
  animation: githubRotate 0.6s ease-in-out;
}

/* 深色主题适配 */
[data-bs-theme="dark"] .contact-icon {
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

[data-bs-theme="dark"] .email-icon:hover {
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.6);
}

[data-bs-theme="dark"] .github-icon:hover {
  box-shadow: 0 10px 25px rgba(36, 41, 46, 0.6);
}

/* 动画效果 */
@keyframes emailBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(-15deg); }
  50% { transform: translateY(-4px) rotate(10deg); }
  75% { transform: translateY(-6px) rotate(-5deg); }
}

@keyframes githubRotate {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.15); }
  50% { transform: rotate(180deg) scale(1); }
  75% { transform: rotate(270deg) scale(1.15); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 脉冲效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 4px 15px rgba(0,0,0,0.1), 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  70% {
    box-shadow: 0 4px 15px rgba(0,0,0,0.1), 0 0 0 10px rgba(102, 126, 234, 0);
  }
  100% {
    box-shadow: 0 4px 15px rgba(0,0,0,0.1), 0 0 0 0 rgba(102, 126, 234, 0);
  }
}

@keyframes githubPulse {
  0% {
    box-shadow: 0 10px 25px rgba(36, 41, 46, 0.4), 0 0 0 0 rgba(36, 41, 46, 0.7);
  }
  70% {
    box-shadow: 0 10px 25px rgba(36, 41, 46, 0.4), 0 0 0 10px rgba(36, 41, 46, 0);
  }
  100% {
    box-shadow: 0 10px 25px rgba(36, 41, 46, 0.4), 0 0 0 0 rgba(36, 41, 46, 0);
  }
}

/* 点击效果 */
.contact-icon:active {
  transform: translateY(-2px) scale(0.95);
}

/* 移动端适配 */
@media (max-width: 576px) {
  .contact-icons {
    gap: 1rem;
  }
  
  .contact-icon {
    width: 45px;
    height: 45px;
  }
  
  .contact-icon i {
    font-size: 1.3rem;
  }
}

/* 移动端特殊样式 */
@media (max-width: 991px) {
  .desktop-sidebar {
    display: none !important;
  }
  
  .mobile-personal-info {
    right: 15px;
  }
  
  .personal-info-sidebar {
    width: 260px;
    padding: 1.25rem;
  }
  
  .avatar-container {
    width: 80px;
    height: 80px;
  }
  
  .user-name {
    font-size: 1.1rem;
  }
  
  .nav-button {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .toggle-button {
    width: 45px;
    height: 45px;
    font-size: 1.2rem;
  }
}

@media (max-width: 576px) {
  .mobile-personal-info {
    right: 10px;
  }
  
  .personal-info-sidebar {
    width: 240px;
    padding: 1rem;
  }
  
  .toggle-button {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }
}

/* 滚动条样式 */
.personal-info-sidebar::-webkit-scrollbar {
  width: 6px;
}

.personal-info-sidebar::-webkit-scrollbar-track {
  background: var(--bs-light);
  border-radius: 3px;
}

.personal-info-sidebar::-webkit-scrollbar-thumb {
  background: var(--bs-secondary);
  border-radius: 3px;
}

.personal-info-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--bs-primary);
}

[data-bs-theme="dark"] .personal-info-sidebar::-webkit-scrollbar-track {
  background: var(--bs-gray-800);
}

[data-bs-theme="dark"] .personal-info-sidebar::-webkit-scrollbar-thumb {
  background: var(--bs-gray-600);
}
</style>
