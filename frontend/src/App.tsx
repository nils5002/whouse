import {
  Boxes,
  CalendarClock,
  ClipboardList,
  Cloud,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  UserCircle2,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './asset-ui/components/Sidebar';
import { Topbar } from './asset-ui/components/Topbar';
import {
  activities,
  assets,
  locations,
  maintenanceItems,
  reservations,
  users,
} from './asset-ui/data';
import { AssetDetailPage } from './asset-ui/pages/AssetDetailPage';
import { AssetsPage } from './asset-ui/pages/AssetsPage';
import { CheckinCheckoutPage } from './asset-ui/pages/CheckinCheckoutPage';
import { CloudSorterPage } from './asset-ui/pages/CloudSorterPage';
import { DashboardPage } from './asset-ui/pages/DashboardPage';
import { LocationsPage } from './asset-ui/pages/LocationsPage';
import { MaintenancePage } from './asset-ui/pages/MaintenancePage';
import { ReservationsPage } from './asset-ui/pages/ReservationsPage';
import { UsersPage } from './asset-ui/pages/UsersPage';
import type { AppPage, NavItem } from './asset-ui/types';

const THEME_STORAGE_KEY = 'asset-console-theme';
type Theme = 'light' | 'dark';

const navigation: NavItem[] = [
  { key: 'cloudSorter', label: 'Cloud Sorter (Live API)', icon: Cloud },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'assets', label: 'Inventar / Assets', icon: Boxes },
  { key: 'assetDetail', label: 'Asset-Detail', icon: ClipboardList },
  { key: 'reservations', label: 'Reservierungen', icon: CalendarClock },
  { key: 'checkinCheckout', label: 'Check-out / Check-in', icon: ShieldCheck },
  { key: 'maintenance', label: 'Wartung / Defekte', icon: Wrench },
  { key: 'locations', label: 'Standorte', icon: MapPin },
  { key: 'users', label: 'Benutzer / Rollen', icon: UserCircle2 },
];

const resolveInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  const [activePage, setActivePage] = useState<AppPage>('cloudSorter');
  const [search, setSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(assets[0]?.id ?? null);
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [selectedAssetId],
  );

  const openAssetDetail = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActivePage('assetDetail');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'cloudSorter':
        return <CloudSorterPage />;
      case 'dashboard':
        return (
          <DashboardPage
            assets={assets}
            activities={activities}
            reservations={reservations}
            maintenanceItems={maintenanceItems}
          />
        );
      case 'assets':
        return <AssetsPage assets={assets} onOpenDetail={openAssetDetail} initialSearch={search} />;
      case 'assetDetail':
        return <AssetDetailPage asset={selectedAsset} activities={activities} />;
      case 'reservations':
        return <ReservationsPage reservations={reservations} />;
      case 'checkinCheckout':
        return <CheckinCheckoutPage assets={assets} />;
      case 'maintenance':
        return <MaintenancePage maintenanceItems={maintenanceItems} />;
      case 'locations':
        return <LocationsPage locations={locations} />;
      case 'users':
        return <UsersPage users={users} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
      </div>

      <Sidebar
        items={navigation}
        activePage={activePage}
        onSelect={setActivePage}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="relative md:pl-72">
        <Topbar
          search={search}
          onSearch={setSearch}
          onMenuOpen={() => setMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        />
        <main className="px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 md:px-8 md:pt-6">
          <div className="mx-auto max-w-[1600px]">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}

export default App;
