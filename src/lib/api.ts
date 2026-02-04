import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // 백엔드 주소 (나중에 환경변수로 분리 가능)
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 주입
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 처리 (로그인 만료)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않음
      localStorage.removeItem('accessToken');
      window.location.href = '/'; // 로그인 페이지로 강제 이동
    }
    return Promise.reject(error);
  }
);

export default api;
