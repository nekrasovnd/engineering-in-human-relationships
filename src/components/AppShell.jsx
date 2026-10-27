import { LogOut } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import ThemeToggle from './ThemeToggle';

export default function AppShell() {
  const { signOutUser } = useAuth();

  return (
    <div className="min-h-screen bg-aurora">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="КОД"
              className="h-10 w-10 rounded-xl object-contain"
            />
            <div>
              <p className="font-display text-lg font-bold tracking-wide text-white">
                КОД
              </p>
              <p className="text-xs text-slate-500">Карта Отношений и Динамики</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle inline />
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-blue-400 hover:text-white"
            >
              <span className="hidden sm:inline">Выйти</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
