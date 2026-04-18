import { Bell, CircleHelp, Menu, Moon, Search, Sun } from 'lucide-react';

type TopbarProps = {
  search: string;
  onSearch: (value: string) => void;
  onMenuOpen: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
};

export function Topbar({
  search,
  onSearch,
  onMenuOpen,
  theme,
  onToggleTheme,
  onOpenHelp,
  onOpenNotifications,
  onOpenProfile,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:flex-nowrap md:px-8 md:py-4">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={onMenuOpen}
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="order-3 relative w-full md:order-none md:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Suche nach Asset, Inventarnummer oder Team..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none ring-brand-300 placeholder:text-slate-400 focus:ring-2"
          />
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          aria-label={theme === 'dark' ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln'}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onOpenHelp}
          className="hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100 sm:block"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-left hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">
            NK
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-900">Nils Kramer</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
        </button>
      </div>
    </header>
  );
}
