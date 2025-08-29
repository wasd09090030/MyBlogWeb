import { getApiUrl, API_CONFIG } from '../config/api.js';

class GalleryService {
  async getAllGalleries() {
    const response = await fetch(getApiUrl('/gallery'));
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async getAllGalleriesForAdmin() {
    const response = await fetch(getApiUrl('/gallery/admin'));
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async getGalleryById(id) {
    const response = await fetch(getApiUrl(`/gallery/${id}`));
    if (!response.ok) {
      throw new Error('获取画廊图片失败');
    }
    return response.json();
  }

  async createGallery(galleryData) {
    const response = await fetch(getApiUrl('/gallery'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(galleryData),
    });

    if (!response.ok) {
      throw new Error('创建画廊图片失败');
    }
    return response.json();
  }

  async updateGallery(id, galleryData) {
    const response = await fetch(getApiUrl(`/gallery/${id}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(galleryData),
    });

    if (!response.ok) {
      throw new Error('更新画廊图片失败');
    }
    return response.json();
  }

  async deleteGallery(id) {
    const response = await fetch(getApiUrl(`/gallery/${id}`), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除画廊图片失败');
    }
  }

  async updateSortOrder(updates) {
    const response = await fetch(getApiUrl('/gallery/batch/sort-order'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('更新排序失败');
    }
    return response.json();
  }

  async toggleActive(id) {
    const response = await fetch(getApiUrl(`/gallery/${id}/toggle-active`), {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error('切换状态失败');
    }
    return response.json();
  }
}

export default new GalleryService();
