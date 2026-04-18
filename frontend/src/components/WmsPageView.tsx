import { AssetDetailPage } from '../asset-ui/pages/AssetDetailPage';
import { AssetsPage } from '../asset-ui/pages/AssetsPage';
import { CategoriesPage } from '../asset-ui/pages/CategoriesPage';
import { CheckinCheckoutPage } from '../asset-ui/pages/CheckinCheckoutPage';
import { DashboardPage } from '../asset-ui/pages/DashboardPage';
import { ImportExportPage } from '../asset-ui/pages/ImportExportPage';
import { MaintenancePage } from '../asset-ui/pages/MaintenancePage';
import { QrFunctionsPage } from '../asset-ui/pages/QrFunctionsPage';
import { UsersPage } from '../asset-ui/pages/UsersPage';
import type {
  ActivityItem,
  AppPage,
  Asset,
  LocationItem,
  MaintenanceItem,
  ReservationItem,
  UserItem,
} from '../asset-ui/types';

type WmsPageViewProps = {
  activePage: AppPage;
  assets: Asset[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  maintenanceItems: MaintenanceItem[];
  locations: LocationItem[];
  users: UserItem[];
  selectedAsset: Asset | null;
  search: string;
  onOpenAssetDetail: (assetId: string) => void;
  onCreateAsset: () => Promise<void>;
  onReserveAsset: (assetId: string) => Promise<void>;
  onCheckoutAsset: (assetId: string) => Promise<void>;
  onCheckinAsset: (assetId: string) => Promise<void>;
  onSetAssetMaintenance: (assetId: string) => Promise<void>;
  onEditAsset: (assetId: string) => Promise<void>;
  onCreateReservation: () => Promise<void>;
  onEditReservation: (id: string) => Promise<void>;
  onCheckoutReservation: (id: string) => Promise<void>;
  onCancelReservation: (id: string) => Promise<void>;
  onCreateMaintenance: (payload: { assetName: string; issue: string; comment: string }) => Promise<void>;
  onInviteUser: () => Promise<void>;
  onOpenLocationInventory: (name: string) => void;
  onEditLocation: (name: string) => Promise<void>;
  onReloadData: () => Promise<void>;
  onCheckoutFromForm: (payload: {
    assetId: string;
    assignee: string;
    dueDate: string;
    note: string;
  }) => Promise<void>;
  onCheckinFromForm: (payload: { assetId: string; condition: string }) => Promise<void>;
};

export function WmsPageView({
  activePage,
  assets,
  activities,
  reservations,
  maintenanceItems,
  locations,
  users,
  selectedAsset,
  search,
  onOpenAssetDetail,
  onCreateAsset,
  onReserveAsset,
  onCheckoutAsset,
  onCheckinAsset,
  onSetAssetMaintenance,
  onEditAsset,
  onCreateReservation,
  onEditReservation,
  onCheckoutReservation,
  onCancelReservation,
  onCreateMaintenance,
  onInviteUser,
  onOpenLocationInventory,
  onEditLocation,
  onReloadData,
  onCheckoutFromForm,
  onCheckinFromForm,
}: WmsPageViewProps) {
  switch (activePage) {
    case 'dashboard':
      return (
        <DashboardPage
          assets={assets}
          activities={activities}
          reservations={reservations}
          maintenanceItems={maintenanceItems}
        />
      );
    case 'inventory':
      return (
        <AssetsPage
          assets={assets}
          onOpenDetail={onOpenAssetDetail}
          initialSearch={search}
          onCreateAsset={() => {
            void onCreateAsset();
          }}
          onReserveAsset={(id) => {
            void onReserveAsset(id);
          }}
          onCheckoutAsset={(id) => {
            void onCheckoutAsset(id);
          }}
          onCheckinAsset={(id) => {
            void onCheckinAsset(id);
          }}
        />
      );
    case 'assetDetail':
      return (
        <AssetDetailPage
          asset={selectedAsset}
          activities={activities}
          onReserveAsset={(id) => {
            void onReserveAsset(id);
          }}
          onCheckoutAsset={(id) => {
            void onCheckoutAsset(id);
          }}
          onCheckinAsset={(id) => {
            void onCheckinAsset(id);
          }}
          onSetMaintenance={(id) => {
            void onSetAssetMaintenance(id);
          }}
          onEditAsset={(id) => {
            void onEditAsset(id);
          }}
        />
      );
    case 'categories':
      return <CategoriesPage assets={assets} />;
    case 'checkinCheckout':
      return (
        <CheckinCheckoutPage
          assets={assets}
          onCheckout={(payload) => {
            void onCheckoutFromForm(payload);
          }}
          onCheckin={(payload) => {
            void onCheckinFromForm(payload);
          }}
        />
      );
    case 'qrFunctions':
      return (
        <QrFunctionsPage
          assets={assets}
          onOpenAssetDetail={onOpenAssetDetail}
          onCheckoutAsset={(id) => {
            void onCheckoutAsset(id);
          }}
          onCheckinAsset={(id) => {
            void onCheckinAsset(id);
          }}
          onReportIssue={(assetName) => {
            void onCreateMaintenance({
              assetName,
              issue: "Per QR gemeldeter Defekt",
              comment: "",
            });
          }}
        />
      );
    case 'tickets':
      return (
        <MaintenancePage
          maintenanceItems={maintenanceItems}
          onCreateMaintenance={(payload) => {
            void onCreateMaintenance(payload);
          }}
        />
      );
    case 'importExport':
      return (
        <ImportExportPage
          assets={assets}
          onImported={async () => {
            await onReloadData();
          }}
        />
      );
    case 'users':
      return (
        <UsersPage
          users={users}
          onInviteUser={() => {
            void onInviteUser();
          }}
        />
      );
    default:
      return null;
  }
}
