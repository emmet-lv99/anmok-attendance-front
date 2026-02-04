import api from '../lib/api';

export interface AttendanceLog {
  id: number;
  email: string;
  clock_in: string;
  clock_out: string | null;
  work_type: string;
  working_hours: number | null;
  memo: string | null;
}

export interface CheckInRequest {
  workType: 'OFFICE' | 'REMOTE' | 'FIELD';
  lat?: number;
  lon?: number;
  skipLunch?: boolean;
  memo?: string;
}

export interface CheckOutRequest {
  skipLunch?: boolean;
  memo?: string;
  isEarlyCheckoutConfirmed?: boolean;
}

export const AttendanceService = {
  /**
   * 출근 API
   */
  checkIn: async (data: CheckInRequest) => {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },

  /**
   * 퇴근 API
   */
  checkOut: async (data: CheckOutRequest) => {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },

  /**
   * 현재 상태 조회 API
   */
  getStatus: async () => {
    const response = await api.get('/attendance/status');
    return response.data;
  },
};
