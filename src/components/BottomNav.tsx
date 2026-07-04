import { NavLink } from 'react-router-dom';
import { ChartIcon, GridIcon, SettingsIcon } from './icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  to: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const ITEMS: NavItem[] = [
  { to: '/', label: 'Tracker', Icon: GridIcon },
  { to: '/dashboard', label: 'Dashboard', Icon: ChartIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

/** Fixed bottom navigation, thumb-friendly on phones. */
export function BottomNav() {
  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-around">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-green-600'
                    : 'text-slate-500 hover:text-slate-700',
                ].join(' ')
              }
            >
              <Icon width={24} height={24} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
