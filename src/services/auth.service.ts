// 개발/테스트용 토큰 (백엔드 create-test-token.ts로 생성한 것)
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc3MDA4Njg4MX0.BYuxCe0iV79p9atyjmKJvqst1qQCteYIS4VGoHbgM2U';
import api from "../lib/api";

export const AuthService = {
  /**
   * 개발용: 테스트 토큰으로 강제 로그인
   */
  devLogin: () => {
    localStorage.setItem('accessToken', DEV_TOKEN);
    return true;
  },

  /**
   * 실제 구글 로그인 (TODO: 구현 예정)
   */
  loginWithGoogle: async (idToken: string) => {
    const response = await api.post('/auth/login/google', { token: idToken });
    const { access_token } = response.data;  // 백엔드는 access_token 반환
    localStorage.setItem('accessToken', access_token);
    return access_token;
  },

  /**
   * 로그아웃
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  },

  /**
   * 현재 로그인 상태 확인
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * 저장된 토큰 가져오기
   */
  getToken: () => {
    return localStorage.getItem('accessToken');
  }
};
