<template>  <!-- 桌面端侧边栏 -->
  <div class="desktop-sidebar d-none d-lg-block sidebar-fade-in">
    <div class="sidebar-content">
      <div class="user-profile text-center">
        <div class="avatar-container avatar-bounce">
          <img src="../assets/icon/Master.ico" alt="用户头像" class="avatar-img">
        </div>
        <h4 class="user-name mt-3 username-fade">WASD09090030</h4>
        <div class="user-status status-fade">
          <span class="status-dot" :class="statusClass"></span>
          <span class="status-text">{{ currentStatus }}</span>
        </div>
      </div>
      
      <!-- 名言名句展示 -->
      <div class="quote-section animate__animated animate__fadeInUp animate__delay-2s">
        <div class="quote-wrapper">
          <div class="quote-header">
            <div class="quote-title">
              <i class="bi bi-lightbulb-fill"></i>
              <span>今日箴言</span>
            </div>
            <button class="quote-refresh-btn" @click="refreshQuote" title="换一句">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>
          
          <div class="quote-content">
            <div class="quote-mark quote-mark-left">
              <i class="bi bi-quote"></i>
            </div>
            
            <div class="quote-body">
              <p class="quote-text">{{ currentQuote.text }}</p>
              <div class="quote-footer">
                <div class="quote-author">{{ currentQuote.author }}</div>
                <div class="quote-decoration"></div>
              </div>
            </div>
            
            <div class="quote-mark quote-mark-right">
              <i class="bi bi-quote"></i>
            </div>
          </div>
          
          <div class="quote-bottom">
            <div class="quote-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

       <div class="contact-info mt-4 animate__animated animate__fadeInUp animate__delay-2.8s">
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
          <div class="avatar-container">
            <img src="../assets/icon/Master.ico" alt="用户头像" class="avatar-img">
          </div>
          <h4 class="user-name mt-3">WASD09090030</h4>
          <div class="user-status">
            <span class="status-dot" :class="statusClass"></span>
            <span class="status-text">{{ currentStatus }}</span>
          </div>
        </div>
        
        <!-- 移动端名言名句 -->
        <div class="quote-section">
          <div class="quote-wrapper">
            <div class="quote-header">
              <div class="quote-title">
                <i class="bi bi-lightbulb-fill"></i>
                <span>今日箴言</span>
              </div>
              <button class="quote-refresh-btn" @click="refreshQuote" title="换一句">
                <i class="bi bi-arrow-clockwise"></i>
              </button>
            </div>
            
            <div class="quote-content">
              <div class="quote-mark quote-mark-left">
                <i class="bi bi-quote"></i>
              </div>
              
              <div class="quote-body">
                <p class="quote-text">{{ currentQuote.text }}</p>
                <div class="quote-footer">
                  <div class="quote-author">{{ currentQuote.author }}</div>
                  <div class="quote-decoration"></div>
                </div>
              </div>
              
              <div class="quote-mark quote-mark-right">
                <i class="bi bi-quote"></i>
              </div>
            </div>
            
            <div class="quote-bottom">
              <div class="quote-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
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
const currentStatus = ref('在线中');
const statusClass = ref('status-online');
const currentQuote = ref({ text: '', author: '' });

// 名言名句数据库
const quotes = [
  // 名人名言
  { text: "生活就像编程，你永远不知道下一个bug在哪里。", author: "程序员的自我修养" },
  { text: "代码如诗，bug如人生，总有意想不到的惊喜。", author: "代码诗人" },
  { text: "最好的代码是没有代码，最好的bug是没有bug。", author: "极简主义程序员" },
  { text: "程序员的三大美德：懒惰、急躁和傲慢。", author: "Larry Wall" },
  { text: "调试代码比写代码难一倍，所以如果你写代码时竭尽全力，你就无法调试它。", author: "Brian Kernighan" },
  
  // 二次元名梗
  { text: "不管前方的路有多苦，只要走的方向正确，不管多么崎岖不平，都比站在原地更接近幸福。", author: "《千与千寻》" },
  { text: "成长是一笔交易，我们都是用朴素的童真与未经人事的洁白交换长大的勇气。", author: "《千与千寻》" },
  { text: "人永远不知道，谁哪次不经意的跟你说了再见之后，就真的不会再见了。", author: "《千与千寻》" },
  { text: "真正的勇士敢于直面惨淡的人生。", author: "鲁迅（并不是）" },
  { text: "只要心中有爱，哪里都是二次元！", author: "宅文化信仰者" },
  { text: "今天也是和平的一天呢~", author: "日常系" },
  { text: "这一定是命运石之门的选择！", author: "冈部伦太郎" },
  { text: "人类的赞歌就是勇气的赞歌！", author: "JOJO" },
  { text: "只有失去过的人，才会真正珍惜拥有的一切。", author: "治愈系" },
  { text: "能不做事就不做事，非做不可一切从简。", author: "《冰果》" },
   { text: "一旦拒绝了信仰，就不能再踏入神的大门。", author: "《黑执事》" },
    { text: "虚伪的眼泪，会伤害别人。虚伪的笑容，会伤害自己。", author: "《叛逆的鲁鲁修》" },

  
  // 编程相关的有趣名言
  { text: "如果调试是去除bug的过程，那么编程就是把bug放进去的过程。", author: "Edsger Dijkstra" },
  { text: "计算机科学只不过是包含了计算机的科学，就像天文学包含了望远镜一样。", author: "Edsger Dijkstra" },
  { text: "代码写得越多，bug就越多，所以最优雅的代码就是没有代码。", author: "禅宗程序员" },
  { text: "编程是一门艺术，而程序员是艺术家。", author: "代码艺术家" },
  { text: "好的程序员会写人类能读懂的代码。", author: "Martin Fowler" }
];

// 随机获取名言
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

// 刷新名言
const refreshQuote = () => {
  currentQuote.value = getRandomQuote();
  
  // 添加点击动画效果
  const quoteWrappers = document.querySelectorAll('.quote-wrapper');
  quoteWrappers.forEach(wrapper => {
    wrapper.classList.add('ripple-effect');
    
    setTimeout(() => {
      wrapper.classList.remove('ripple-effect');
    }, 600);
  });
};

// 切换侧边栏
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarState', isCollapsed.value ? 'collapsed' : 'expanded');
};

// 技能动画
const animateSkill = (skill) => {
  const originalLevel = skill.level;
  skill.level = 0;
  setTimeout(() => {
    skill.level = originalLevel;  }, 100);
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
  
  // 开始状态和名言更新
  updateStatus();
  refreshQuote(); // 初始化名言
  setInterval(updateStatus, 60000); // 每分钟检查状态
  setInterval(refreshQuote, 300000); // 每5分钟自动更换名言
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

/* 名言名句样式 - 优雅版本 */
.quote-section {
  margin: 1.5rem 0;
}

.quote-wrapper {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.quote-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  opacity: 0.8;
}

.quote-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 标题部分 */
.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.quote-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.9rem;
}

.quote-title i {
  color: #f6ad55;
  font-size: 1rem;
  animation: glow 2s ease-in-out infinite alternate;
}

.quote-refresh-btn {
  background: none;
  border: none;
  color: #718096;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.quote-refresh-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  transform: scale(1.1);
}

.quote-refresh-btn:hover i {
  animation: spin 0.6s ease-in-out;
}

.quote-refresh-btn:active {
  transform: scale(0.95);
}

/* 内容部分 */
.quote-content {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  margin: 1rem 0;
}

.quote-mark {
  color: #667eea;
  opacity: 0.3;
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}

.quote-mark-left {
  align-self: flex-start;
  margin-top: -0.2rem;
}

.quote-mark-right {
  align-self: flex-end;
  margin-bottom: -0.2rem;
  transform: rotate(180deg);
}

.quote-body {
  flex: 1;
  text-align: center;
}

.quote-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #2d3748;
  margin: 0 0 1rem 0;
  font-style: italic;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
}

.quote-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.quote-author {
  font-size: 0.85rem;
  color: #718096;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
}

.quote-author::before {
  content: '—';
  margin-right: 0.5rem;
  color: #a0aec0;
}

.quote-decoration {
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 1px;
  opacity: 0.6;
}

/* 底部装饰 */
.quote-bottom {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.quote-dots {
  display: flex;
  gap: 0.3rem;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #cbd5e0;
  animation: dotPulse 2s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .quote-wrapper {
  background: linear-gradient(135deg, rgba(45, 55, 72, 0.9) 0%, rgba(26, 32, 44, 0.9) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.4);
}

[data-bs-theme="dark"] .quote-wrapper:hover {
  box-shadow: 
    0 8px 30px rgba(0, 0, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.5);
}

[data-bs-theme="dark"] .quote-wrapper::before {
  background: linear-gradient(90deg, #4299e1 0%, #9f7aea 50%, #ed64a6 100%);
}

[data-bs-theme="dark"] .quote-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

[data-bs-theme="dark"] .quote-title {
  color: #e2e8f0;
}

[data-bs-theme="dark"] .quote-title i {
  color: #fbb863;
}

[data-bs-theme="dark"] .quote-refresh-btn {
  color: #a0aec0;
}

[data-bs-theme="dark"] .quote-refresh-btn:hover {
  background: rgba(66, 153, 225, 0.2);
  color: #4299e1;
}

[data-bs-theme="dark"] .quote-mark {
  color: #4299e1;
}

[data-bs-theme="dark"] .quote-text {
  color: #e2e8f0;
}

[data-bs-theme="dark"] .quote-author {
  color: #a0aec0;
}

[data-bs-theme="dark"] .quote-author::before {
  color: #718096;
}

[data-bs-theme="dark"] .quote-decoration {
  background: linear-gradient(90deg, #4299e1, #9f7aea);
}

[data-bs-theme="dark"] .dot {
  background: #4a5568;
}

/* 动画效果 */
@keyframes glow {
  0% {
    text-shadow: 0 0 5px rgba(246, 173, 85, 0.5);
  }
  100% {
    text-shadow: 0 0 10px rgba(246, 173, 85, 0.8), 0 0 15px rgba(246, 173, 85, 0.6);
  }
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 点击波纹效果 */
.quote-wrapper {
  position: relative;
  overflow: hidden;
}

.quote-wrapper::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3), transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.6s ease;
  pointer-events: none;
  opacity: 0;
}

.quote-wrapper.ripple-effect::after {
  width: 300px;
  height: 300px;
  opacity: 1;
  animation: rippleOut 0.6s ease-out;
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

/* 暗色主题下的名言样式 */
[data-bs-theme="dark"] .dot {
  background: #4a5568;
}

/* 波纹动画 */
@keyframes rippleOut {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 波纹动画 */
@keyframes rippleOut {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
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
  
  .quote-wrapper {
    padding: 1.2rem;
  }
  
  .quote-text {
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .quote-author {
    font-size: 0.8rem;
  }
  
  .quote-title {
    font-size: 0.85rem;
  }
  
  .quote-title i {
    font-size: 0.9rem;
  }
  
  .quote-refresh-btn {
    width: 32px;
    height: 32px;
  }
  
  .quote-mark {
    font-size: 1.2rem;
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

/* 自定义动画类替换animate.css */
.sidebar-fade-in {
  animation: fadeInLeft 0.8s ease-out;
}

.avatar-bounce {
  animation: bounceIn 0.8s ease-out 0.5s both;
}

.username-fade {
  animation: fadeInUp 0.6s ease-out 1s both;
}

.status-fade {
  animation: fadeIn 0.6s ease-out 1.7s both;
}
</style>
