<template>  <!-- 桌面端侧边栏 -->
  <div class="desktop-sidebar d-none d-lg-block sidebar-fade-in">
    <div class="sidebar-content">
      <div class="user-profile text-center">
        <div class="avatar-container avatar-bounce">
          <img :src="avatarUrl" alt="用户头像" class="avatar-img">
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
            <img :src="avatarUrl" alt="用户头像" class="avatar-img">
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
import '../assets/css/components/PersonalInfo.styles.css';

const router = useRouter();
const isCollapsed = ref(true);
const currentStatus = ref('在线中');
const statusClass = ref('status-online');
const currentQuote = ref({ text: '', author: '' });

// 使用计算属性或 ref 来处理静态资源路径，避免 SSR 水合不匹配
const avatarUrl = '/icon/Master.ico';

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
@import'../assets/css/components/PersonalInfo.styles.css';
</style>
