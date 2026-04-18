import { ChevronRight, X } from 'lucide-react';
import type { AppPage, NavItem } from '../types';

type SidebarProps = {
  items: NavItem[];
  activePage: AppPage;
  onSelect: (page: AppPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ items, activePage, onSelect, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/45 transition md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 transform border-r border-slate-200/80 bg-white/90 p-5 shadow-panel backdrop-blur transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">AtlasOps</p>
            <h1 className="text-xl font-semibold text-slate-900">Asset Console</h1>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={onCloseMobile}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-5 space-y-1">
          {items.map((item) => {
            const active = item.key === activePage;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onSelect(item.key);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
                {active ? <ChevronRight className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-brand-50">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">Live-Verfügbarkeit</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-100">
            87 Assets sind sofort einsatzbereit. 4 Rückgaben sind überfällig.
          </p>
        </div>
      </aside>
    </>
  );
}

