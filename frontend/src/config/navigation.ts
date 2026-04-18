import {
  Boxes,
  Download,
  LayoutDashboard,
  QrCode,
  Shapes,
  ShieldCheck,
  TriangleAlert,
  UserCircle2,
} from 'lucide-react';

import type { NavItem } from '../asset-ui/types';

export const navigation: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventar', icon: Boxes },
  { key: 'categories', label: 'Kategorien', icon: Shapes },
  { key: 'checkinCheckout', label: 'Ein-/Auslagerung', icon: ShieldCheck },
  { key: 'qrFunctions', label: 'QR-Code', icon: QrCode },
  { key: 'tickets', label: 'Defekte / Tickets', icon: TriangleAlert },
  { key: 'importExport', label: 'Import / Export', icon: Download },
  { key: 'users', label: 'Benutzerverwaltung', icon: UserCircle2 },
];
