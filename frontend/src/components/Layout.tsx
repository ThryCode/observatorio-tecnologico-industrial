import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-accent-red focus:text-white focus:rounded-md focus:text-sm focus:font-semibold">
        Saltar al contenido principal
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-sidebar">
        <Topbar />
        <main id="main-content" className="flex-1 overflow-y-auto px-6 py-8" role="main">
          <div key={location.pathname} className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
