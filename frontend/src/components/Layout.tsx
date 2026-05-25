import { NavLink } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquare01Icon, GlobeIcon, Settings01Icon, Notification03Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} />;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardSquare01Icon },
  { to: '/sites', label: 'Sites', icon: GlobeIcon },
  { to: '/settings', label: 'Settings', icon: Settings01Icon },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-[#0d0d14] border-r border-[#1c1c28] p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">W</div>
          <span className="text-white font-semibold text-lg">WebAudit</span>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-[#7a7a8a] hover:text-white hover:bg-[#1c1c28]'
                }`
              }
            >
              <Icon icon={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="pt-4 border-t border-[#1c1c28]">
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-[#5a5a6a]">
            <Icon icon={Notification03Icon} size={14} />
            <span>WhatsApp Connected</span>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
