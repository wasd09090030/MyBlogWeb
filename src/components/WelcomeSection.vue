<template>
  <div class="welcome-section" id="welcome-section">
    <div class="welcome-content">
      <h1 class="welcome-title title-fade-in">欢迎访问</h1>
      <p class="welcome-text">这里是我的个人博客，记录学习、游戏和个人作品</p>
      <p class="welcome-subtitle mt-3 subtitle-fade-in">使用导航栏的分类菜单和搜索功能来探索内容</p>
      <button class="btn btn-explore mt-4 button-bounce-in" @click="scrollToArticles">
        探索文章
        <i class="bi bi-arrow-down ms-2"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
// 滚动到文章区域
const scrollToArticles = () => {
  const articlesSection = document.querySelector('main');
  if (articlesSection) {
    articlesSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
};
</script>

<style scoped>
.welcome-section {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  background-image: url('../assets/BlogPicture/background.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  overflow: hidden;
}

/* 背景遮罩层 */
.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.welcome-content {
  position: relative;
  z-index: 2;
  color: white;
  max-width: 800px;
  padding: 2rem;
}

.welcome-title {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  animation: fadeInUp 1s ease-out;
}

.welcome-text {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  animation: fadeInUp 1s ease-out 0.2s both;
}

.welcome-subtitle {
  font-size: 1rem;
  font-style: italic;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  animation: fadeInUp 1s ease-out 0.4s both;
}

.btn-explore {
  background: linear-gradient(45deg, #007bff, #0056b3);
  border: none;
  color: white;
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
  animation: fadeInUp 1s ease-out 0.6s both;
}

.btn-explore:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
  background: linear-gradient(45deg, #0056b3, #004085);
  color: white;
}

.btn-explore:active {
  transform: translateY(0);
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .welcome-section {
    background-attachment: scroll; /* 移动设备上取消固定背景 */
  }
  
  .welcome-content {
    padding: 1.5rem;
  }
  
  .welcome-title {
    font-size: 2.5rem;
  }
  
  .welcome-text {
    font-size: 1.1rem;
  }
  
  .welcome-subtitle {
    font-size: 0.95rem;
  }
  
  .btn-explore {
    padding: 10px 25px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .welcome-title {
    font-size: 2rem;
  }
  
  .welcome-text {
    font-size: 1rem;
  }
  
  .welcome-subtitle {
    font-size: 0.9rem;
  }
}

/* 自定义动画 */
.title-fade-in {
  animation: fadeInDown 0.8s ease-out;
}

.subtitle-fade-in {
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.button-bounce-in {
  animation: bounceIn 1s ease-out 1s both;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
