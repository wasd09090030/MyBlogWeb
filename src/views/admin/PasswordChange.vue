<template>
  <div class="password-change-container">
    <div class="card">
      <div class="card-header">
        <h5 class="card-title mb-0">修改管理员密码</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="changePassword">
          <div class="mb-3">
            <label for="currentPassword" class="form-label">当前密码</label>
            <input 
              type="password" 
              class="form-control" 
              id="currentPassword" 
              v-model="currentPassword"
              placeholder="请输入当前密码" 
              required
            >
          </div>
          
          <div class="mb-3">
            <label for="newPassword" class="form-label">新密码</label>
            <input 
              type="password" 
              class="form-control" 
              id="newPassword" 
              v-model="newPassword"
              placeholder="请输入新密码（至少6位）" 
              minlength="6"
              required
            >
          </div>
          
          <div class="mb-3">
            <label for="confirmPassword" class="form-label">确认新密码</label>
            <input 
              type="password" 
              class="form-control" 
              id="confirmPassword" 
              v-model="confirmPassword"
              placeholder="请再次输入新密码" 
              required
            >
          </div>
          
          <div v-if="error" class="alert alert-danger" role="alert">
            {{ error }}
          </div>
          
          <div v-if="success" class="alert alert-success" role="alert">
            {{ success }}
          </div>
          
          <div class="d-grid gap-2">
            <button type="submit" class="btn btn-primary" :disabled="isChanging">
              <span v-if="isChanging" class="spinner-border spinner-border-sm me-2" role="status"></span>
              修改密码
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authAPI } from '../../services/authService'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')
const isChanging = ref(false)

const changePassword = async () => {
  error.value = ''
  success.value = ''
  
  // 验证新密码
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致'
    return
  }
  
  if (newPassword.value.length < 6) {
    error.value = '新密码长度至少6位'
    return
  }
  
  if (newPassword.value === currentPassword.value) {
    error.value = '新密码不能与当前密码相同'
    return
  }
  
  isChanging.value = true
  
  try {
    const result = await authAPI.changePassword(currentPassword.value, newPassword.value)
    
    if (result.success) {
      success.value = result.data.message || '密码修改成功'
      // 清空表单
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      error.value = result.message
    }
  } catch (err) {
    console.error('Change password error:', err)
    error.value = '密码修改过程中发生错误，请稍后重试'
  } finally {
    isChanging.value = false
  }
}
</script>

<style scoped>
.password-change-container {
  max-width: 500px;
  margin: 2rem auto;
}

.card {
  border-radius: 10px;
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 10px 10px 0 0;
}
</style>
