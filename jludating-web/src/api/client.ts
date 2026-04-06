import axios from 'axios'

// 开发环境使用相对路径，通过 Vite 代理访问后端
// 生产/部署时可通过 VITE_API_URL 覆盖
const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})
