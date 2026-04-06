import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // чтобы cookie с JWT отправлялись автоматически
})

export default api
