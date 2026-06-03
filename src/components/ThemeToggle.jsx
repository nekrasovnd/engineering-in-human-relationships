import { MoonStar, SunMedium } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ROUTES_WITH_BOTTOM_NAV = new Set([
  '/profile',
  '/teams',
  '/discover',
  '/knowledge',
  '/compare',
]);

export default function ThemeToggle() {
  const { isLightTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const hasBottomNav = ROUTES_WITH_BOTTOM_NAV.has(location.pathname);
  const Icon = isLightTheme ? MoonStar : SunMedium;
  const label = isLightTheme
    ? 'Включить тёмную тему'
    : 'Включить светлую тему';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`fixed right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-950/85 text-slate-200 shadow-glow backdrop-blur transition hover:border-blue-400 hover:text-white ${
        hasBottomNav ? 'bottom-28 right-3 sm:bottom-24 sm:right-4' : 'bottom-4 sm:bottom-6'
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
