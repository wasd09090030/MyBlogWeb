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
  // 获取所有文章 - 前端展示用
  async getArticles(category) {
    try {
      let url = '/articles';
      // 如果提供了类别参数，添加到查询参数
      const params = category ? { category } : {};
      const response = await this.api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('获取文章失败:', error);
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

export default new ArticleService();
