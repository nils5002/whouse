import { Sidebar } from './asset-ui/components/Sidebar';
import { Topbar } from './asset-ui/components/Topbar';
import { WmsPageView } from './components/WmsPageView';
import { navigation } from './config/navigation';
import { useWmsController } from './hooks/useWmsController';

function App() {
  const controller = useWmsController();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
      </div>

      <Sidebar
        items={navigation}
        activePage={controller.activePage}
        onSelect={controller.setActivePage}
        mobileOpen={controller.mobileSidebarOpen}
        onCloseMobile={() => controller.setMobileSidebarOpen(false)}
      />

      <div className="relative md:pl-72">
        <Topbar
          search={controller.search}
          onSearch={controller.setSearch}
          onMenuOpen={() => controller.setMobileSidebarOpen(true)}
          theme={controller.theme}
          onToggleTheme={controller.toggleTheme}
          onOpenHelp={controller.openHelp}
          onOpenNotifications={controller.openNotifications}
          onOpenProfile={controller.openProfile}
        />
        <main className="px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 md:px-8 md:pt-6">
          <div className="mx-auto max-w-[1600px]">
            {controller.isLoading ? (
              <p className="mb-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                Lade Daten...
              </p>
            ) : null}
            {controller.wmsError ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {controller.wmsError}
              </p>
            ) : null}
            <WmsPageView
              activePage={controller.activePage}
              assets={controller.assets}
              activities={controller.activities}
              reservations={controller.reservations}
              maintenanceItems={controller.maintenanceItems}
              locations={controller.locations}
              users={controller.users}
              selectedAsset={controller.selectedAsset}
              search={controller.search}
              onOpenAssetDetail={controller.openAssetDetail}
              onCreateAsset={controller.createAsset}
              onReserveAsset={controller.reserveAsset}
              onCheckoutAsset={(id) => controller.checkoutAsset(id)}
              onCheckinAsset={(id) => controller.checkinAsset(id)}
              onSetAssetMaintenance={controller.setAssetMaintenance}
              onEditAsset={controller.editAsset}
              onCreateReservation={controller.createReservation}
              onEditReservation={controller.editReservation}
              onCheckoutReservation={controller.checkoutReservation}
              onCancelReservation={controller.cancelReservation}
              onCreateMaintenance={controller.createMaintenance}
              onInviteUser={controller.inviteUser}
              onOpenLocationInventory={controller.openLocationInventory}
              onEditLocation={controller.editLocation}
              onReloadData={controller.loadWms}
              onCheckoutFromForm={controller.checkoutFromForm}
              onCheckinFromForm={controller.checkinFromForm}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
