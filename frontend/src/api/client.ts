import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const AUTH_ENDPOINTS = ['/login', '/register', '/logout']

api.interceptors.response.use(
  res => res,
  err => {
    const url: string | undefined = err.config?.url
    const isAuthEndpoint = url ? AUTH_ENDPOINTS.some(p => url.endsWith(p)) : false
    if (err.response?.status === 401 && !isAuthEndpoint) {
      import('../store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().clearAuth()
      })
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
