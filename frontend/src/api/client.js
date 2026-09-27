import axios from 'axios'

const BASE = '/api'

const client = axios.create({ baseURL: BASE, timeout: 60000 })

client.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

const api = {
  get: (path) => client.get(path),
  post: (path, data) => client.post(path, data),
  delete: (path) => client.delete(path),
  upload: (path, formData) => client.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
}

export default api
