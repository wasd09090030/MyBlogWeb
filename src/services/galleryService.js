import { getApiUrl, API_CONFIG } from '../config/api.js';

// 获取认证头
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

class GalleryService {
  async getAllGalleries() {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY));
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async getAllGalleriesForAdmin() {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_ADMIN), {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async getGalleryById(id) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_BY_ID(id)), {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async createGallery(galleryData) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(galleryData),
    });

    if (!response.ok) {
      throw new Error('创建画廊图片失败');
    }
    return response.json();
  }

  async updateGallery(id, galleryData) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_BY_ID(id)), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(galleryData),
    });

    if (!response.ok) {
      throw new Error('更新画廊图片失败');
    }
    return response.json();
  }

  async deleteGallery(id) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_BY_ID(id)), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('删除画廊图片失败');
    }
  }

  async updateSortOrder(updates) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_SORT_ORDER), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('更新排序失败');
    }
    return response.json();
  }

  async toggleActive(id) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_TOGGLE_ACTIVE(id)), {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('切换状态失败');
    }
    return response.json();
  }

  async batchImport(data) {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.GALLERY_BATCH_IMPORT), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('批量导入失败');
    }
    return response.json();
  }
}

export default new GalleryService();
