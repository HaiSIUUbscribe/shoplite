import axios from 'axios';

const API_TIMEOUT = Number(process.env.REACT_APP_API_TIMEOUT_MS || 30000);
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3600/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: API_TIMEOUT,
  withCredentials: true,
});

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function canRetryGet(error) {
  const config = error.config;
  if (!config) return false;
  if (String(config?.method || 'get').toLowerCase() !== 'get') return false;
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return false;

  const status = error.response?.status;
  return !error.response || RETRYABLE_STATUS_CODES.has(status);
}

async function retryGet(error) {
  if (!canRetryGet(error)) return null;

  const config = error.config;
  const retryCount = Number(config._networkRetryCount || 0);
  // Network timeouts get one retry; transient gateway responses can recover faster.
  const maxRetries = error.response ? 2 : 1;
  if (retryCount >= maxRetries) return null;

  config._networkRetryCount = retryCount + 1;
  await wait(1200 * config._networkRetryCount);
  return axiosClient(config);
}

// ── Shared refresh promise ────────────────────────────────────
// Nếu nhiều request đồng thời nhận 401, chúng sẽ dùng chung một
// lần gọi /auth/refresh thay vì mỗi request tự gọi riêng.
let refreshPromise = null;

function callRefresh() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${axiosClient.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true, timeout: API_TIMEOUT }
      )
      .then((res) => {
        localStorage.setItem('token', res.data.token);
        return res.data.token;
      })
      .catch((err) => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('shoplite:unauthorized'));
        return Promise.reject(err);
      })
      .finally(() => {
        // Giải phóng promise sau khi hoàn thành để lần refresh tiếp theo
        // (sau khi token mới cũng hết hạn) có thể tạo promise mới.
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// ── Request interceptor ───────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  return config;
});

// ── Response interceptor ──────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url === '/auth/refresh';
    const isAuthRequest = String(originalRequest?.url || '').includes('/auth/');

    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_LOCKED') {
      localStorage.removeItem('token');
      localStorage.removeItem('shoplite_user');
      window.dispatchEvent(new Event('shoplite:unauthorized'));
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401
      && !isAuthRequest
      && !originalRequest?._retry
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await callRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch {
        // callRefresh đã dispatch 'shoplite:unauthorized' và xoá token.
      }
    } else if (error.response?.status === 401 && originalRequest?._retry) {
      localStorage.removeItem('token');
      localStorage.removeItem('shoplite_user');
      window.dispatchEvent(new Event('shoplite:unauthorized'));
    } else if (error.response?.status === 401 && isRefreshRequest) {
      localStorage.removeItem('token');
    }

    const retriedResponse = await retryGet(error);
    if (retriedResponse) return retriedResponse;

    return Promise.reject(error);
  }
);

export default axiosClient;
