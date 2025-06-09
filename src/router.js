import { createRouter, createWebHistory } from 'vue-router';
import auth from './store/auth';

// 使用动态导入实现路由级懒加载
const ArticleList = () => import('./components/ArticleList.vue');
const ArticleDetail = () => import('./components/ArticleDetail.vue');
const AdminLayout = () => import('./layouts/AdminLayout.vue');
const AdminLogin = () => import('./views/admin/AdminLogin.vue');
const AdminDashboard = () => import('./views/admin/AdminDashboard.vue');
const ArticleManager = () => import('./views/admin/ArticleManager.vue');
const ArticleEditor = () => import('./views/admin/ArticleEditor.vue');

const routes = [
  // 前端展示路由 - 保持不变
  {
    path: '/',
    name: 'ArticleList',
    component: ArticleList,
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: ArticleDetail,
    props: true
  },
  
  // 管理员路由 - 完全独立的路径
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: AdminDashboard
      },
      {
        path: 'articles',
        name: 'ArticleManager',
        component: ArticleManager
      },
      {
        path: 'articles/new',
        name: 'ArticleEditor',
        component: ArticleEditor
      },
      {
        path: 'articles/:id/edit',
        name: 'ArticleEditorEdit',
        component: ArticleEditor,
        props: true
      },
      {
        path: 'comments',
        name: 'CommentManager',
        component: () => import('./views/admin/CommentManager.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 添加路由守卫，针对需要验证的管理员路由
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否已登录为管理员
    if (auth.isAdmin()) {
      next();
    } else {
      // 未登录，重定向到登录页
      next({ name: 'AdminLogin' });
    }
  } else {
    next();
  }
});

export default router;
