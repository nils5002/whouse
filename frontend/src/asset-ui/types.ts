import type { LucideIcon } from 'lucide-react';

export type AssetStatus =
  | 'Verfügbar'
  | 'Verliehen'
  | 'In Wartung'
  | 'Defekt';

export type ReservationStatus =
  | 'Angefragt'
  | 'Bestätigt'
  | 'Aktiv'
  | 'Abgeschlossen'
  | 'Storniert';

export type MaintenancePriority = 'Niedrig' | 'Mittel' | 'Hoch' | 'Kritisch';

export type MaintenanceStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt';

export type AppPage =
  | 'dashboard'
  | 'inventory'
  | 'categories'
  | 'assetDetail'
  | 'checkinCheckout'
  | 'qrFunctions'
  | 'tickets'
  | 'importExport'
  | 'users';

export type NavItem = {
  key: AppPage;
  label: string;
  icon: LucideIcon;
};

export type Asset = {
  id: string;
  name: string;
  category: string;
  location: string;
  status: AssetStatus;
  assignedTo: string;
  nextReturn: string;
  tagNumber: string;
  serialNumber: string;
  qrCode?: string;
  maintenanceState: string;
  notes: string;
  lastCheckout: string;
  nextReservation: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  assetId?: string;
};

export type ReservationItem = {
  id: string;
  requestedBy: string;
  team: string;
  period: string;
  assets: string[];
  status: ReservationStatus;
  location: string;
};

export type MaintenanceItem = {
  id: string;
  assetName: string;
  issue: string;
  reportedAt: string;
  dueDate: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  comment: string;
  location: string;
};

export type LocationItem = {
  name: string;
  capacity: string;
  assignedAssets: number;
  availableAssets: number;
  manager: string;
};

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Mitarbeiter';
  lastActive: string;
  status: 'Aktiv' | 'Inaktiv';
  department?: string;
  location?: string;
};

