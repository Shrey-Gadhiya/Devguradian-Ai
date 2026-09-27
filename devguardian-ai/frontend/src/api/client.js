import axios from 'axios';

const client = axios.create({ baseURL: '/api', timeout: 60000 });

client.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export default client;
