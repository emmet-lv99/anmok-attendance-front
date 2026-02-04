import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Page Content */}
      <div className="flex-1 pb-16"> {/* Add padding bottom for fixed nav */}
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
