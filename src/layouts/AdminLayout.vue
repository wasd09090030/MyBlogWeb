<template>
  <div class="admin-layout">
    <!-- 管理员顶部导航栏 -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <router-link to="/admin" class="navbar-brand">博客管理系统</router-link>
        
        <div class="navbar-nav ms-auto">
          <div class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
              管理员
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="/" target="_blank">查看前台</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" @click="logout">退出登录</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <div class="admin-container">
      <!-- 侧边栏 -->
      <aside class="admin-sidebar">
        <nav class="nav flex-column">
          <router-link to="/admin" class="nav-link" exact-active-class="active">
            <i class="bi bi-speedometer2 me-2"></i>仪表板
          </router-link>
          <router-link to="/admin/articles" class="nav-link" active-class="active">
            <i class="bi bi-file-text me-2"></i>文章管理
          </router-link>
          <router-link to="/admin/comments" class="nav-link" active-class="active">
            <i class="bi bi-chat-left-text me-2"></i>评论管理
          </router-link>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import auth from '../store/auth';

const router = useRouter();

const logout = () => {
  auth.logout();
  router.push({ name: 'AdminLogin' });
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-container {
  display: flex;
  flex: 1;
  height: calc(100vh - 56px);
}

.admin-sidebar {
  width: 250px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem 0;
  overflow-y: auto;
}

.admin-sidebar .nav-link {
  color: #495057;
  padding: 0.75rem 1.5rem;
  border-radius: 0;
}

.admin-sidebar .nav-link:hover,
.admin-sidebar .nav-link.active {
  background-color: #0d6efd;
  color: white;
}

.admin-main {
  flex: 1;
  padding: 2rem;
  background-color: #f8f9fa;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #dee2e6;
  }
}
</style>
