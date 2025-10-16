// 文章服务 - 处理与后端API的通信
import axios from 'axios';
import { API_CONFIG } from '../config/api.js';

class ArticleService {  
  constructor() {
    // 使用配置文件中的API地址
    this.baseURL = API_CONFIG.BASE_URL;
    
    // 创建 axios 实例
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.TIMEOUT
    });
  }

  // 获取推荐文章 - 专为WelcomeSection轮播设计
  async getFeaturedArticles(limit = API_CONFIG.PAGINATION.WELCOME_CAROUSEL_SIZE) {
    try {
      const response = await this.api.get(API_CONFIG.ENDPOINTS.ARTICLES_FEATURED, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('获取推荐文章失败:', error);
      throw error;
    }
  }

  // 获取文章列表 - 支持分页和摘要模式
  async getArticles(options = {}) {
    try {
      const {
        category = null,
        page = 1,
        limit = API_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
        summary = true // 默认使用摘要模式以提升性能
      } = options;

      const params = {
        summary,
        page,
        limit
      };
      
      if (category) {
        params.category = category;
      }

      const response = await this.api.get(API_CONFIG.ENDPOINTS.ARTICLES, { params });
      return response.data;
    } catch (error) {
      console.error('获取文章失败:', error);
      throw error;
    }
  }

  // 获取所有文章（兼容旧代码）- 现在使用分页方式但返回所有数据
  async getAllArticles() {
    try {
      // 先获取第一页来了解总数
      const firstPage = await this.getArticles({ page: 1, limit: 50, summary: true });
      
      // .NET 后端返回的数据结构：{ data, total, page, pageSize } 或直接是数组
      // 检查返回的数据结构
      if (Array.isArray(firstPage)) {
        // 如果直接返回数组（summary=false 时）
        return firstPage;
      }
      
      // 如果是分页结构
      const { data, total, pageSize } = firstPage;
      const totalPages = Math.ceil(total / pageSize);
      
      if (totalPages <= 1) {
        return data;
      }
      
      // 如果有多页，获取所有页面
      const allArticles = [...data];
      const promises = [];
      
      for (let page = 2; page <= totalPages; page++) {
        promises.push(this.getArticles({ page, limit: 50, summary: true }));
      }
      
      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result.data) {
          allArticles.push(...result.data);
        } else if (Array.isArray(result)) {
          allArticles.push(...result);
        }
      });
      
      return allArticles;
    } catch (error) {
      console.error('获取所有文章失败:', error);
      throw error;
    }
  }
  
  // 获取指定类别的文章
  async getArticlesByCategory(category) {
    try {
      const response = await this.api.get(`/articles/category/${category}`);
      return response.data;
    } catch (error) {
      console.error(`获取${category}分类文章失败:`, error);
      throw error;
    }
  }
  // 获取单篇文章 - 前端展示用
  async getArticleById(id) {
    try {
      const response = await this.api.get(`/articles/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取文章失败:', error);
      throw error;
    }
  }

  // === 以下为管理员专用API ===
    // 创建文章
  async createArticle(articleData) {
    try {
      const response = await this.api.post('/articles', articleData, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('创建文章失败:', error);
      throw error;
    }
  }
  // 更新文章
  async updateArticle(id, articleData) {
    try {
      const response = await this.api.put(`/articles/${id}`, articleData, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('更新文章失败:', error);
      throw error;
    }
  }
  // 删除文章
  async deleteArticle(id) {
    try {
      await this.api.delete(`/articles/${id}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return true;
    } catch (error) {
      console.error('删除文章失败:', error);
      throw error;
    }
  }

  // 获取授权头
  getAuthHeader() {
    // 使用本地存储的认证信息
    return localStorage.getItem('isAuthenticated') === 'true' ? 'AdminToken' : '';
  }
}

// Gallery服务类
class GalleryService {
  constructor() {
    // 使用配置文件中的API地址
    this.baseURL = API_CONFIG.BASE_URL;
    
    // 创建 axios 实例
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.TIMEOUT
    });
  }

  // 获取所有激活的画廊图片 (公开接口)
  async getGalleries() {
    try {
      const response = await this.api.get(import.meta.env.PROD ? '/api/gallery' : '/gallery');
      return response.data;
    } catch (error) {
      console.error('获取画廊数据失败:', error);
      throw error;
    }
  }

  // 获取所有画廊图片 (管理员接口)
  async getAllGalleries() {
    try {
      const response = await this.api.get(import.meta.env.PROD ? '/api/gallery/admin' : '/gallery/admin', {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取所有画廊数据失败:', error);
      throw error;
    }
  }

  // 创建画廊图片
  async createGallery(galleryData) {
    try {
      const response = await this.api.post(import.meta.env.PROD ? '/api/gallery' : '/gallery', galleryData, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('创建画廊图片失败:', error);
      throw error;
    }
  }

  // 更新画廊图片
  async updateGallery(id, galleryData) {
    try {
      const response = await this.api.patch(import.meta.env.PROD ? `/api/gallery/${id}` : `/gallery/${id}`, galleryData, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('更新画廊图片失败:', error);
      throw error;
    }
  }

  // 删除画廊图片
  async deleteGallery(id) {
    try {
      const response = await this.api.delete(import.meta.env.PROD ? `/api/gallery/${id}` : `/gallery/${id}`, {
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });
      return response.data;
    } catch (error) {
      console.error('删除画廊图片失败:', error);
      throw error;
    }
  }

  // 获取授权头
  getAuthHeader() {
    return localStorage.getItem('isAuthenticated') === 'true' ? 'AdminToken' : '';
  }
}

export default new ArticleService();
export const galleryService = new GalleryService();
