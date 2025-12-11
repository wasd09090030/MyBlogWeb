<template>
  <div class="admin-layout">
    <!-- 管理员顶部导航栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <router-link to="/admin" class="navbar-brand">
          <i class="bi bi-gear-fill me-2"></i>博客管理系统
        </router-link>
        
        <!-- 移动端菜单按钮 -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNavbar">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <!-- 导航菜单 -->
        <div class="collapse navbar-collapse" id="adminNavbar">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link to="/admin" class="nav-link" exact-active-class="active">
                <i class="bi bi-speedometer2 me-1"></i>仪表板
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/admin/articles" class="nav-link" active-class="active">
                <i class="bi bi-file-text me-1"></i>文章管理
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/admin/gallery" class="nav-link" active-class="active">
                <i class="bi bi-images me-1"></i>画廊管理
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/admin/comments" class="nav-link" active-class="active">
                <i class="bi bi-chat-left-text me-1"></i>评论管理
              </router-link>
            </li>
          </ul>
          
          <!-- 右侧用户菜单 -->
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" href="/" target="_blank" title="查看前台">
                <i class="bi bi-box-arrow-up-right me-1"></i>前台
              </a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle me-1"></i>管理员
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><router-link to="/admin/password" class="dropdown-item">
                  <i class="bi bi-key me-2"></i>修改密码
                </router-link></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-danger" href="#" @click="logout">
                  <i class="bi bi-box-arrow-right me-2"></i>退出登录
                </a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  router.push({ name: 'AdminLogin' })
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏样式 */
.navbar {
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-weight: 600;
  font-size: 1.1rem;
}

.navbar-nav .nav-link {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  margin: 0 0.125rem;
  transition: all 0.2s ease;
}

.navbar-nav .nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar-nav .nav-link.active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

/* 主内容区 - 全宽 */
.admin-main {
  flex: 1;
  padding: 1.5rem;
  background-color: #f8f9fa;
  overflow-y: auto;
  height: calc(100vh - 56px);
}

/* 下拉菜单样式 */
.dropdown-menu {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-item {
  padding: 0.5rem 1rem;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

/* 响应式调整 */
@media (max-width: 991px) {
  .navbar-collapse {
    padding: 1rem 0;
  }
  
  .navbar-nav .nav-link {
    padding: 0.75rem 1rem;
    margin: 0.125rem 0;
  }
  
  .admin-main {
    padding: 1rem;
  }
}
</style>
