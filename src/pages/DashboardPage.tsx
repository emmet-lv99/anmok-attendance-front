import { Clock, Coffee, Loader2, LogOut, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EarlyCheckoutModal } from '../components/EarlyCheckoutModal';
import { cn } from '../lib/utils';
import { AttendanceService } from '../services/attendance.service';
import { AuthService } from '../services/auth.service';

type Status = 'IDLE' | 'WORKING' | 'LOADING' | 'ERROR';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('LOADING');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workType, setWorkType] = useState<'OFFICE' | 'REMOTE'>('OFFICE');
  const [skipLunch, setSkipLunch] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // 페이지 로드 시 현재 상태 조회
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setStatus('LOADING');
      const data = await AttendanceService.getStatus();
      if (data.isWorking) {
        setStatus('WORKING');
        setStartTime(data.startTime);
      } else {
        setStatus('IDLE');
        setStartTime(null);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setStatus('ERROR');
      setError('상태를 불러오지 못했습니다.');
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // GPS 가져오기 (OFFICE일 때만 필수)
      let lat, lon;
      if (workType === 'OFFICE') {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      await AttendanceService.checkIn({
        workType,
        lat,
        lon,
        skipLunch,
      });

      await fetchStatus();
    } catch (err: unknown) {
      console.error('Check-in failed:', err);
      if (err instanceof Error && err.message === 'User denied Geolocation') {
        setError('위치 권한을 허용해주세요.');
      } else {
        // Extract error message safely
        const data = (err as any)?.response?.data;
        const message = 
          typeof data?.message === 'string' ? data.message :
          Array.isArray(data?.message) ? data.message.join(', ') :
          '출근 처리에 실패했습니다.'; // Default (Do NOT show raw JSON)
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await AttendanceService.checkOut({
        skipLunch,
      });
      await fetchStatus();
    } catch (err: unknown) {
      console.error('Check-out failed:', err);
      
      const responseData = (err as any)?.response?.data;
      
      // 조기 퇴근 감지
      if (responseData?.code === 'EARLY_CHECKOUT_REQUIRED') {
        setModalMessage(responseData.message);
        setIsModalOpen(true);
        // Note: isLoading stays true or we can set it false. 
        // If we set it false, the button re-enables. 
        // Let's set it false so UI doesn't look stuck, but buttons are disabled by status anyway.
        setIsLoading(false); 
        return;
      }

      // 일반 에러 처리
      const message = 
        typeof responseData?.message === 'string' ? responseData.message :
        Array.isArray(responseData?.message) ? responseData.message.join(', ') :
        '퇴근 처리에 실패했습니다.';
      setError(message);
    } finally {
      // 모달이 열리지 않았을 때만 로딩 해제 (모달 열리면 로딩 상태 관리는 모달 내부 비동기 로직과는 별개임)
      // 위에서 return 했으므로 여기는 실행 안됨 (모달 케이스)
      if (!isModalOpen) {
          setIsLoading(false);
      }
    }
  };

  const handleEarlyCheckoutConfirm = async (reason: string) => {
    // 모달에서 확인 버튼 클릭 시 호출
    await AttendanceService.checkOut({
      skipLunch,
      isEarlyCheckoutConfirmed: true,
      memo: reason
    });
    await fetchStatus();
    // 성공하면 모달은 자동으로 닫힘 (부모 리렌더링 or Modal 내부 로직)
    // 하지만 여기서 명시적으로 닫아주는 게 안전? 
    // Modal component calls onClose after success? No, it calls onClose() at the end of handleSubmit.
    // So we just need to ensure fetchStatus finishes.
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/');
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 상단 네비게이션 */}
      <nav className="bg-white px-4 py-3 shadow-sm dark:bg-gray-800 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">안목고수</span>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-lg p-4 pt-8">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 상태 카드 */}
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">현재 상태</p>
            
            {status === 'LOADING' ? (
              <div className="mt-4 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <h2 className={cn(
                  "mt-2 text-3xl font-extrabold tracking-tight",
                  status === 'WORKING' ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
                )}>
                  {status === 'WORKING' ? '근무 중 🔥' : '출근 전'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {status === 'WORKING' ? `${formatTime(startTime)} 출근함` : '오늘도 화이팅하세요!'}
                </p>
              </>
            )}
          </div>

          {/* 옵션 설정 (출근 전에만 표시) */}
          {status !== 'WORKING' && (
            <div className="mt-6 space-y-4">
              {/* 근무 형태 선택 */}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                <button
                  onClick={() => setWorkType('OFFICE')}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                    workType === 'OFFICE' 
                      ? "bg-white text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-300" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <MapPin className="h-4 w-4" />
                  사무실 근무
                </button>
                <button
                  onClick={() => setWorkType('REMOTE')}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                    workType === 'REMOTE' 
                      ? "bg-white text-green-600 shadow-sm dark:bg-gray-600 dark:text-green-300" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Loader2 className={cn("h-4 w-4", isLoading ? "animate-spin" : "hidden")} /> 
                  {/* Using a different icon for Remote if needed, currently reusing MapPin logic implicitly or just text */}
                  <div className="flex items-center gap-2">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M15 3h6v18h-6M10 17l5-5-5-5M13.8 12H3" />
                     </svg>
                     원격 근무
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 점심시간 옵션 (항상 표시) */}
          <div className="mt-4 flex items-center justify-center">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input 
                type="checkbox" 
                checked={skipLunch}
                onChange={(e) => setSkipLunch(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              점심식사 없이 연속 근무 (8시간)
            </label>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={status === 'WORKING' || isLoading}
              className="group flex flex-col items-center justify-center space-y-2 rounded-xl bg-blue-50 p-6 transition-all hover:bg-blue-100 active:scale-95 disabled:opacity-50 dark:bg-blue-900/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200">
                {isLoading && status !== 'WORKING' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <MapPin className="h-6 w-6" />
                )}
              </div>
              <span className="font-semibold text-blue-900 dark:text-blue-100">출근하기</span>
            </button>

            <button
              onClick={handleCheckOut}
              disabled={status !== 'WORKING' || isLoading}
              className="group flex flex-col items-center justify-center space-y-2 rounded-xl bg-orange-50 p-6 transition-all hover:bg-orange-100 active:scale-95 disabled:opacity-50 dark:bg-orange-900/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-200">
                {isLoading && status === 'WORKING' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Coffee className="h-6 w-6" />
                )}
              </div>
              <span className="font-semibold text-orange-900 dark:text-orange-100">퇴근하기</span>
            </button>
          </div>
        </div>
      </main>

      <EarlyCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEarlyCheckoutConfirm}
        message={modalMessage}
      />
    </div>
  );
}
