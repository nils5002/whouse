import type { LucideIcon } from 'lucide-react';

export type AssetStatus =
  | 'Verfuegbar'
  | 'Reserviert'
  | 'Ausgegeben'
  | 'Unterwegs'
  | 'In Wartung'
  | 'Defekt'
  | 'Verloren';

export type ReservationStatus =
  | 'Angefragt'
  | 'Bestaetigt'
  | 'Aktiv'
  | 'Abgeschlossen'
  | 'Storniert';

export type MaintenancePriority = 'Niedrig' | 'Mittel' | 'Hoch' | 'Kritisch';

export type MaintenanceStatus = 'Offen' | 'In Arbeit' | 'Wartet auf Teile' | 'Abgeschlossen';

export type AppPage =
  | 'cloudSorter'
  | 'dashboard'
  | 'assets'
  | 'assetDetail'
  | 'reservations'
  | 'checkinCheckout'
  | 'maintenance'
  | 'locations'
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
  role: 'Admin' | 'Lager / Logistik' | 'Mitarbeiter' | 'Event-Team' | 'Nur-Lesen';
  lastActive: string;
  status: 'Aktiv' | 'Eingeschraenkt';
};
