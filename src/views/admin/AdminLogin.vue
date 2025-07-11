<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="card shadow">
        <div class="card-body p-5">
          <h3 class="card-title text-center mb-4">管理员登录</h3>
          
          <form @submit.prevent="login">
            <div class="mb-4">
              <label for="password" class="form-label">管理员密码</label>
              <input 
                type="password" 
                class="form-control form-control-lg" 
                id="password" 
                v-model="password"
                placeholder="请输入管理员密码" 
                required
              >
            </div>
            
            <div v-if="error" class="alert alert-danger" role="alert">
              {{ error }}
            </div>
            
            <div class="d-grid gap-2">
              <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoggingIn">
                <span v-if="isLoggingIn" class="spinner-border spinner-border-sm me-2" role="status"></span>
                登录
              </button>
              <router-link to="/" class="btn btn-link">返回首页</router-link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, UserRoles } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const password = ref('')
const error = ref('')
const isLoggingIn = ref(false)

const login = async () => {
  isLoggingIn.value = true
  error.value = ''
  
  try {
    const result = await authStore.login('admin', password.value)
    
    if (result.success) {
      router.push({ name: 'AdminDashboard' })
    } else {
      error.value = result.message
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = '登录过程中发生错误，请稍后重试'
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<style scoped>
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 1rem;
}

.card {
  border-radius: 10px;
  border: none;
}

.btn-link {
  text-decoration: none;
}
</style>
