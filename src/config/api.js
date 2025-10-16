// API 配置文件
export const API_CONFIG = {
  // 基础 URL - 生产环境使用相对路径通过 Nginx 代理
  BASE_URL: import.meta.env.VITE_API_BASE_URL || (
    import.meta.env.PROD ? '' : 'http://localhost:3000/api'
  ),
  
  // 超时设置 - 增加到20秒
  TIMEOUT: 20000,
  
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    WELCOME_CAROUSEL_SIZE: 5
  },
  
  // API 端点
  ENDPOINTS: {
    // 文章相关
    ARTICLES: '/articles',
    ARTICLES_FEATURED: '/articles/featured', // 推荐文章API
    ARTICLE_BY_ID: (id) => `/articles/${id}`,
    
    // 评论相关
    COMMENTS: '/comments',
    COMMENTS_BY_ARTICLE: (articleId) => `/comments/article/${articleId}`,
    COMMENT_LIKE: (commentId) => `/comments/${commentId}/like`,
    COMMENTS_ADMIN_ALL: '/comments/admin/all',
    COMMENTS_ADMIN_PENDING: '/comments/admin/pending',
    COMMENT_ADMIN_STATUS: (commentId) => `/comments/admin/${commentId}/status`,
    COMMENT_DELETE: (commentId) => `/comments/admin/${commentId}`,
    
    // 点赞相关
    LIKES_STATUS: (articleId) => `/likes/article/${articleId}/status`,
    LIKES_TOGGLE: (articleId) => `/likes/article/${articleId}`,
    
    // 画廊相关
    GALLERY: import.meta.env.PROD ? '/api/gallery' : '/gallery',
    GALLERY_ADMIN: import.meta.env.PROD ? '/api/gallery/admin' : '/gallery/admin',
    GALLERY_BY_ID: (id) => import.meta.env.PROD ? `/api/gallery/${id}` : `/gallery/${id}`,
    GALLERY_TOGGLE_ACTIVE: (id) => import.meta.env.PROD ? `/api/gallery/${id}/toggle-active` : `/gallery/${id}/toggle-active`,
    GALLERY_SORT_ORDER: import.meta.env.PROD ? '/api/gallery/batch/sort-order' : '/gallery/batch/sort-order',
  }
};

// 获取完整的 URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 默认导出配置
export default API_CONFIG;
