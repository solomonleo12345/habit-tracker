import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/**
 * Shell for authenticated pages: a scrollable content area above a fixed
 * bottom navigation. Uses a mobile-first max width so it also looks tidy on a
 * laptop.
 */
export function AppLayout() {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
