import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const fallbackBaseUrl = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:3001`
  : 'http://localhost:3001';
const apiBaseUrl = (configuredBaseUrl || fallbackBaseUrl).replace(/\/$/, '');

const client = axios.create({
  baseURL: `${apiBaseUrl}/api`,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ceditrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('ceditrack_token');
      const isAuthPath = typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/register');
      if (!isAuthPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Unwrap axios response to return just the response body
export const get = async (url, config = {}) => { const r = await client.get(url, config); return r.data; };
export const post = async (url, data, config = {}) => { const r = await client.post(url, data, config); return r.data; };
export const put = async (url, data, config = {}) => { const r = await client.put(url, data, config); return r.data; };
export const del = async (url, config = {}) => { const r = await client.delete(url, config); return r.data; };

export default client;
