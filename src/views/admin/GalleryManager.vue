<template>
  <div class="gallery-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>画廊管理</h2>
      <button class="btn btn-primary" @click="showCreateModal">
        <i class="bi bi-plus-circle me-2"></i>添加图片
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>

    <!-- 画廊列表 -->
    <div v-else class="gallery-list">
      <div v-if="galleries.length === 0" class="text-center py-5">
        <i class="bi bi-images display-1 text-muted"></i>
        <h4 class="text-muted mt-3">暂无图片</h4>
        <p class="text-muted">点击上方按钮添加第一张图片</p>
      </div>

      <div v-else class="row">
        <div 
          v-for="gallery in galleries" 
          :key="gallery.id" 
          class="col-md-6 col-lg-4 mb-4"
        >
          <div class="card gallery-card h-100">
            <div class="image-container">
              <img 
                :src="gallery.imageUrl" 
                :alt="gallery.title"
                class="card-img-top gallery-image"
                @error="handleImageError"
              />
              <div class="image-overlay">
                <div class="overlay-actions">
                  <button 
                    class="btn btn-sm btn-outline-light me-2"
                    @click="editGallery(gallery)"
                    title="编辑"
                  >
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-light me-2"
                    @click="toggleActive(gallery)"
                    :title="gallery.isActive ? '隐藏' : '显示'"
                  >
                    <i :class="gallery.isActive ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="confirmDelete(gallery)"
                    title="删除"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="status-badge">
                <span 
                  class="badge"
                  :class="gallery.isActive ? 'bg-success' : 'bg-secondary'"
                >
                  {{ gallery.isActive ? '显示' : '隐藏' }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <h5 class="card-title">{{ gallery.title }}</h5>
              <p v-if="gallery.description" class="card-text text-muted small">
                {{ gallery.description }}
              </p>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                  排序: {{ gallery.sortOrder }}
                </small>
                <small class="text-muted">
                  {{ formatDate(gallery.createdAt) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑模态框 -->
    <div v-if="showGalleryModal" class="custom-modal-overlay" @click.self="closeGalleryModal">
      <div class="custom-modal">
        <div class="custom-modal-header">
          <h5 class="custom-modal-title">
            {{ isEdit ? '编辑图片' : '添加图片' }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="closeGalleryModal"
            aria-label="关闭"
          ></button>
        </div>
        
        <form @submit.prevent="saveGallery">
          <div class="custom-modal-body">
            <div class="mb-3">
              <label for="title" class="form-label">标题 *</label>
              <input 
                type="text" 
                class="form-control" 
                id="title"
                v-model="galleryForm.title" 
                required
              >
            </div>

            <div class="mb-3">
              <label for="imageUrl" class="form-label">图片URL *</label>
              <input 
                type="url" 
                class="form-control" 
                id="imageUrl"
                v-model="galleryForm.imageUrl" 
                required
                placeholder="https://example.com/image.jpg"
              >
            </div>

            <!-- 图片预览 -->
            <div v-if="galleryForm.imageUrl" class="mb-3">
              <label class="form-label">预览</label>
              <div class="image-preview">
                <img 
                  :src="galleryForm.imageUrl" 
                  alt="预览图片"
                  class="preview-image"
                  @error="handlePreviewError"
                  @load="handlePreviewLoad"
                />
                <div v-if="!isValidPreview" class="text-warning mt-2">
                  <small>
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    图片预览加载失败，请检查URL是否正确
                  </small>
                </div>
              </div>
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">描述</label>
              <textarea 
                class="form-control" 
                id="description"
                v-model="galleryForm.description" 
                rows="3"
                placeholder="图片描述（可选）"
              ></textarea>
            </div>

            <div class="mb-3">
              <label for="sortOrder" class="form-label">排序序号</label>
              <input 
                type="number" 
                class="form-control" 
                id="sortOrder"
                v-model.number="galleryForm.sortOrder" 
                min="0"
                placeholder="0"
              >
              <div class="form-text">数字越小排序越靠前</div>
            </div>

            <div class="mb-3 form-check">
              <input 
                type="checkbox" 
                class="form-check-input" 
                id="isActive"
                v-model="galleryForm.isActive"
              >
              <label class="form-check-label" for="isActive">
                在前端显示此图片
              </label>
            </div>
          </div>
          
          <div class="custom-modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeGalleryModal"
            >
              取消
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSaving"
            >
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isEdit ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="custom-modal-overlay" @click.self="closeDeleteModal">
      <div class="custom-modal custom-modal-sm">
        <div class="custom-modal-header">
          <h5 class="custom-modal-title">确认删除</h5>
          <button 
            type="button" 
            class="btn-close" 
            @click="closeDeleteModal"
            aria-label="关闭"
          ></button>
        </div>
        <div class="custom-modal-body">
          <p>确定要删除图片 "<strong>{{ galleryToDelete?.title }}</strong>" 吗？</p>
          <p class="text-muted">此操作无法撤销。</p>
        </div>
        <div class="custom-modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="closeDeleteModal"
          >
            取消
          </button>
          <button 
            type="button" 
            class="btn btn-danger"
            @click="deleteGallery"
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status"></span>
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import galleryService from '../../services/galleryService.js';

const galleries = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const isEdit = ref(false);
const galleryToDelete = ref(null);
const isValidPreview = ref(true);

// 模态框显示状态
const showGalleryModal = ref(false);
const showDeleteModal = ref(false);

const galleryForm = ref({
  title: '',
  imageUrl: '',
  description: '',
  sortOrder: 0,
  isActive: true,
});

// 获取画廊列表
const fetchGalleries = async () => {
  try {
    loading.value = true;
    galleries.value = await galleryService.getAllGalleriesForAdmin();
  } catch (error) {
    console.error('获取画廊失败:', error);
    alert('获取画廊失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 显示创建模态框
const showCreateModal = () => {
  isEdit.value = false;
  galleryForm.value = {
    title: '',
    imageUrl: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  };
  isValidPreview.value = true;
  showGalleryModal.value = true;
};

// 编辑画廊
const editGallery = (gallery) => {
  isEdit.value = true;
  galleryForm.value = {
    id: gallery.id,
    title: gallery.title,
    imageUrl: gallery.imageUrl,
    description: gallery.description || '',
    sortOrder: gallery.sortOrder,
    isActive: gallery.isActive,
  };
  isValidPreview.value = true;
  showGalleryModal.value = true;
};

// 关闭画廊模态框
const closeGalleryModal = () => {
  showGalleryModal.value = false;
  // 重置表单
  galleryForm.value = {
    title: '',
    imageUrl: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  };
};

// 保存画廊
const saveGallery = async () => {
  try {
    isSaving.value = true;
    
    const payload = {
      title: galleryForm.value.title,
      imageUrl: galleryForm.value.imageUrl,
      description: galleryForm.value.description || null,
      sortOrder: galleryForm.value.sortOrder,
      isActive: galleryForm.value.isActive,
    };

    if (isEdit.value) {
      await galleryService.updateGallery(galleryForm.value.id, payload);
      alert('图片更新成功！');
    } else {
      await galleryService.createGallery(payload);
      alert('图片创建成功！');
    }

    // 关闭模态框
    closeGalleryModal();

    // 刷新列表
    await fetchGalleries();
  } catch (error) {
    console.error('保存画廊失败:', error);
    alert('保存失败: ' + error.message);
  } finally {
    isSaving.value = false;
  }
};

// 切换激活状态
const toggleActive = async (gallery) => {
  try {
    await galleryService.toggleActive(gallery.id);
    gallery.isActive = !gallery.isActive;
    alert(`图片已${gallery.isActive ? '显示' : '隐藏'}`);
  } catch (error) {
    console.error('切换状态失败:', error);
    alert('操作失败: ' + error.message);
  }
};

// 确认删除
const confirmDelete = (gallery) => {
  galleryToDelete.value = gallery;
  showDeleteModal.value = true;
};

// 关闭删除模态框
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  galleryToDelete.value = null;
};

// 删除画廊
const deleteGallery = async () => {
  try {
    isDeleting.value = true;
    await galleryService.deleteGallery(galleryToDelete.value.id);
    
    // 关闭模态框
    closeDeleteModal();
    
    alert('图片删除成功！');
    
    // 刷新列表
    await fetchGalleries();
  } catch (error) {
    console.error('删除画廊失败:', error);
    alert('删除失败: ' + error.message);
  } finally {
    isDeleting.value = false;
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = '/src/assets/icon/favicon.ico';
};

// 处理预览图片错误
const handlePreviewError = () => {
  isValidPreview.value = false;
};

// 处理预览图片加载成功
const handlePreviewLoad = () => {
  isValidPreview.value = true;
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 监听图片URL变化
watch(() => galleryForm.value.imageUrl, (newUrl) => {
  if (newUrl) {
    isValidPreview.value = true;
  }
});

onMounted(() => {
  fetchGalleries();
});
</script>

<style scoped>
.gallery-manager {
  padding: 2rem 0;
}

.gallery-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: none;
  border-radius: 15px;
  overflow: hidden;
}

.gallery-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-card:hover .gallery-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-card:hover .image-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
}

.image-preview {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

/* 卡片动画 */
.gallery-card {
  animation: fadeInUp 0.6s ease forwards;
}

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

/* 暗色主题适配 */
[data-bs-theme="dark"] .gallery-card {
  background-color: var(--bs-dark);
  border: 1px solid #404040;
}

[data-bs-theme="dark"] .image-preview {
  border-color: #404040;
  background-color: var(--bs-dark);
}

/* 自定义模态框样式 */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.custom-modal {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s ease;
}

.custom-modal-sm {
  max-width: 400px;
}

.custom-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 0.5rem 0.5rem 0 0;
}

.custom-modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.custom-modal-body {
  padding: 1.5rem;
}

.custom-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 0 0 0.5rem 0.5rem;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 暗色主题适配 */
[data-bs-theme="dark"] .custom-modal {
  background-color: var(--bs-dark);
  color: #ffffff;
}

[data-bs-theme="dark"] .custom-modal-header,
[data-bs-theme="dark"] .custom-modal-footer {
  background-color: #2d3748;
  border-color: #404040;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gallery-manager {
    padding: 1rem;
  }
  
  .overlay-actions {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .overlay-actions .btn {
    padding: 0.25rem 0.5rem;
  }
  
  .custom-modal {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
  
  .custom-modal-header,
  .custom-modal-body,
  .custom-modal-footer {
    padding: 1rem;
  }
  
  .custom-modal-footer {
    flex-direction: column;
  }
  
  .custom-modal-footer .btn {
    width: 100%;
  }
}
</style>
