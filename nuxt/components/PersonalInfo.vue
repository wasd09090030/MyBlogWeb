<template>
  <div class="personal-info">
    <div class="personal-card">
      <!-- 头像 -->
      <div class="avatar-section">
        <div class="avatar">
          <img
            src="/icon/Master.ico"
            alt="头像"
            class="avatar-img"
            @error="handleAvatarError"
          />
          <div class="avatar-status"></div>
        </div>
      </div>

      <!-- 个人信息 -->
      <div class="info-section text-center">
        <h2 class="name mb-2">博客作者</h2>
        <p class="bio mb-4">
          热爱技术、生活和分享的开发者<br>
          专注于前端开发和用户体验设计
        </p>

        <!-- 社交链接 -->
        <div class="social-links mb-4">
          <a href="#" class="social-link" title="GitHub">
            <i class="bi bi-github"></i>
          </a>
          <a href="#" class="social-link" title="邮箱">
            <i class="bi bi-envelope"></i>
          </a>
          <a href="#" class="social-link" title="Twitter">
            <i class="bi bi-twitter"></i>
          </a>
          <a href="#" class="social-link" title="LinkedIn">
            <i class="bi bi-linkedin"></i>
          </a>
        </div>

        <!-- 技能标签 -->
        <div class="skills mb-4">
          <span class="skill-tag">Vue.js</span>
          <span class="skill-tag">JavaScript</span>
          <span class="skill-tag">CSS</span>
          <span class="skill-tag">Node.js</span>
          <span class="skill-tag">UI/UX</span>
        </div>

        <!-- 统计信息 -->
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">{{ articleCount }}</div>
            <div class="stat-label">文章</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ categoryCount }}</div>
            <div class="stat-label">分类</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ visitCount }}</div>
            <div class="stat-label">访问</div>
          </div>
        </div>
      </div>

      <!-- 个性化装饰 -->
      <div class="decoration">
        <div class="decoration-circle decoration-circle-1"></div>
        <div class="decoration-circle decoration-circle-2"></div>
        <div class="decoration-circle decoration-circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import '~/assets/css/components/PersonalInfo.styles.css'

// 响应式数据
const articleCount = ref(42)
const categoryCount = ref(4)
const visitCount = ref(1280)

// 模拟数据更新
onMounted(() => {
  // 这里可以从API获取真实的统计数据
  setTimeout(() => {
    articleCount.value = 45
    categoryCount.value = 4
    visitCount.value = 1350
  }, 2000)
})

// 处理头像加载错误
const handleAvatarError = (event) => {
  // 使用默认头像或字母头像
  event.target.style.display = 'none'
  const parent = event.target.parentElement
  parent.innerHTML = '<div class="avatar-fallback">博</div>'
}
</script>

<style scoped>
.personal-info {
  padding: 2rem;
}

.personal-card {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.personal-card:hover {
  transform: translateY(-4px);
}

.avatar-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.avatar {
  position: relative;
  display: inline-block;
  width: 120px;
  height: 120px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255,255,255,0.8);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: transform 0.3s ease;
}

.avatar:hover .avatar-img {
  transform: scale(1.05);
}

.avatar-status {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  background: #28a745;
  border: 3px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 600;
  border: 4px solid rgba(255,255,255,0.8);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.name {
  color: #333;
  font-weight: 700;
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
}

.bio {
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f8f9fa;
  border-radius: 50%;
  color: #6c757d;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.social-link:hover {
  background: #0d6efd;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.skills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.skill-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  transition: transform 0.3s ease;
}

.skill-tag:hover {
  transform: translateY(-2px);
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0d6efd;
  display: block;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

/* 装饰元素 */
.decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.decoration-circle-1 {
  width: 100px;
  height: 100px;
  top: -50px;
  right: -50px;
  animation: float 6s ease-in-out infinite;
}

.decoration-circle-2 {
  width: 60px;
  height: 60px;
  bottom: 20px;
  left: -30px;
  animation: float 4s ease-in-out infinite reverse;
}

.decoration-circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: -40px;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .personal-info {
    padding: 1rem;
  }

  .personal-card {
    padding: 1.5rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .name {
    font-size: 1.5rem;
  }

  .stats {
    gap: 1rem;
  }

  .stat-number {
    font-size: 1.25rem;
  }

  .social-links {
    gap: 0.75rem;
  }

  .social-link {
    width: 35px;
    height: 35px;
  }
}
</style>