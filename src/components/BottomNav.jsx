import { Heart, LibraryBig, Scale, UserRound, UsersRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/profile', label: 'Профиль', icon: UserRound },
  { to: '/teams', label: 'Команды', icon: UsersRound },
  { to: '/discover', label: 'Знакомства', icon: Heart },
  { to: '/knowledge', label: 'База', icon: LibraryBig },
  { to: '/compare', label: 'Сравнить', icon: Scale },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-5 gap-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] transition ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`
              }
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
