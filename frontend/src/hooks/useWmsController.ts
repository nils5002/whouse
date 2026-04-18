import { useEffect, useMemo, useState } from 'react';

import { getAssetQrCode } from '../asset-ui/qr';
import type {
  ActivityItem,
  AppPage,
  Asset,
  LocationItem,
  MaintenanceItem,
  ReservationItem,
  UserItem,
} from '../asset-ui/types';
import {
  fetchWmsOverview,
  upsertActivity,
  upsertAsset,
  upsertLocation,
  upsertMaintenance,
  upsertReservation,
  upsertUser,
} from '../services/wmsApi';
import { useAppDialog } from '../components/dialogs/AppDialogProvider';
import { useTheme } from './useTheme';

type CreateMaintenancePayload = { assetName: string; issue: string; comment: string };
type CheckoutPayload = { assetId: string; assignee: string; dueDate: string; note: string };
type CheckinPayload = { assetId: string; condition: string };

function normalizeAssetStatus(value: Asset['status'] | string): Asset['status'] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'verfuegbar' || normalized === 'verfügbar' || normalized === 'ok') {
    return 'Verfügbar';
  }
  if (
    normalized === 'verliehen' ||
    normalized === 'ausgegeben' ||
    normalized === 'unterwegs' ||
    normalized === 'reserviert' ||
    normalized === 'entliehen'
  ) {
    return 'Verliehen';
  }
  if (normalized.includes('wartung') || normalized.includes('service')) {
    return 'In Wartung';
  }
  if (normalized.includes('defekt') || normalized.includes('kaputt') || normalized.includes('verlor')) {
    return 'Defekt';
  }
  return 'Verfügbar';
}

function normalizeUserRole(value: UserItem['role'] | string): UserItem['role'] {
  return value === 'Admin' ? 'Admin' : 'Mitarbeiter';
}

function normalizeUserStatus(value: UserItem['status'] | string): UserItem['status'] {
  return value === 'Aktiv' ? 'Aktiv' : 'Inaktiv';
}

export function useWmsController() {
  const { theme, toggleTheme } = useTheme();
  const { alert, prompt } = useAppDialog();
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [search, setSearch] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [wmsError, setWmsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadWms = async () => {
    try {
      const payload = await fetchWmsOverview();
      setAssets(
        payload.assets.map((asset) => ({
          ...asset,
          status: normalizeAssetStatus(asset.status),
          qrCode: getAssetQrCode(asset),
        })),
      );
      setActivities(payload.activities);
      setReservations(payload.reservations);
      setMaintenanceItems(payload.maintenanceItems);
      setLocations(payload.locations);
      setUsers(
        payload.users.map((user) => ({
          ...user,
          role: normalizeUserRole(user.role),
          status: normalizeUserStatus(user.status),
        })),
      );
      setSelectedAssetId((current) => {
        if (current && payload.assets.some((item) => item.id === current)) {
          return current;
        }
        return payload.assets[0]?.id ?? null;
      });
      setWmsError(null);
    } catch {
      setWmsError('Backend nicht erreichbar oder fehlerhafte API-Antwort.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled) return;
      await loadWms();
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  const openAssetDetail = (assetId: string) => {
    setSelectedAssetId(assetId);
    setActivePage('assetDetail');
  };

  const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

  const saveAsset = async (asset: Asset) => {
    const normalizedAsset = { ...asset, qrCode: getAssetQrCode(asset) };
    setAssets((prev) => prev.map((item) => (item.id === normalizedAsset.id ? normalizedAsset : item)));
    try {
      await upsertAsset(normalizedAsset);
    } catch {
      setWmsError('Asset konnte nicht im Backend gespeichert werden.');
    }
  };

  const addActivity = async (title: string, detail: string, assetId?: string) => {
    const activity: ActivityItem = {
      id: createId('act'),
      title,
      detail,
      timestamp: new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }),
      assetId,
    };
    setActivities((prev) => [activity, ...prev].slice(0, 80));
    try {
      await upsertActivity(activity);
    } catch {
      setWmsError('Aktivität konnte nicht im Backend gespeichert werden.');
    }
  };

  const createAsset = async () => {
    const name = await prompt({
      title: 'Neues Gerät anlegen',
      message: 'Gerätename',
      placeholder: 'z. B. iPad Air 11',
      required: true,
      submitLabel: 'Anlegen',
    });
    if (!name?.trim()) return;
    const category =
      (await prompt({
        title: 'Kategorie',
        message: 'Gerätekategorie auswählen oder eingeben',
        defaultValue: 'Sonstiges',
      })) || 'Sonstiges';
    const location =
      (await prompt({
        title: 'Standort',
        message: 'Aktueller Standort',
        defaultValue: 'Hauptlager',
      })) || 'Hauptlager';
    const newAsset: Asset = {
      id: createId('asset'),
      name: name.trim(),
      category: category.trim(),
      location: location.trim(),
      status: 'Verfügbar',
      assignedTo: '-',
      nextReturn: '-',
      tagNumber: `HW-${Math.floor(Math.random() * 9000) + 1000}`,
      serialNumber: `SN-${Math.floor(Math.random() * 900000) + 100000}`,
      qrCode: '',
      maintenanceState: 'Neu erfasst',
      notes: '',
      lastCheckout: '-',
      nextReservation: '-',
    };
    const normalizedAsset = { ...newAsset, qrCode: getAssetQrCode(newAsset) };
    setAssets((prev) => [normalizedAsset, ...prev]);
    setSelectedAssetId(normalizedAsset.id);
    setActivePage('assetDetail');
    await addActivity('Asset angelegt', `${normalizedAsset.name} wurde neu angelegt.`, normalizedAsset.id);
    try {
      await upsertAsset(normalizedAsset);
    } catch {
      setWmsError('Neues Asset konnte nicht im Backend gespeichert werden.');
    }
  };

  const reserveAsset = async (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const team = await prompt({
      title: 'Gerät verleihen',
      message: 'Für welches Team oder welche Person?',
      defaultValue: asset.assignedTo === '-' ? 'Team/Person' : asset.assignedTo,
      required: true,
      submitLabel: 'Speichern',
    });
    if (!team?.trim()) return;
    const date =
      (await prompt({
        title: 'Geplante Rückgabe',
        message: 'Bis wann ist das Gerät verliehen?',
        defaultValue: asset.nextReturn === '-' ? 'in 3 Tagen' : asset.nextReturn,
      })) || asset.nextReturn;
    const updated: Asset = {
      ...asset,
      status: 'Verliehen',
      assignedTo: team.trim(),
      nextReturn: date,
      nextReservation: date,
    };
    await saveAsset(updated);
    await addActivity('Asset reserviert', `${asset.name} wurde für ${team.trim()} reserviert.`, asset.id);
  };

  const checkoutAsset = async (
    assetId: string,
    assigneeHint?: string,
    dueHint?: string,
    noteHint?: string,
  ) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const assignee =
      assigneeHint ||
      (await prompt({
        title: 'Gerät ausgeben',
        message: 'Ausgeben an',
        defaultValue: asset.assignedTo === '-' ? 'Team/Person' : asset.assignedTo,
        required: true,
      })) ||
      '';
    if (!assignee.trim()) return;
    const due =
      dueHint ||
      (await prompt({
        title: 'Rückgabe',
        message: 'Rückgabe geplant bis',
        defaultValue: asset.nextReturn === '-' ? 'in 2 Tagen' : asset.nextReturn,
      })) ||
      asset.nextReturn;
    const note = noteHint || '';
    const updated: Asset = {
      ...asset,
      status: 'Verliehen',
      assignedTo: assignee.trim(),
      nextReturn: due,
      lastCheckout: new Date().toLocaleDateString('de-DE'),
      notes: note ? `${asset.notes}\n${note}`.trim() : asset.notes,
    };
    await saveAsset(updated);
    await addActivity('Asset ausgegeben', `${asset.name} wurde an ${assignee.trim()} ausgegeben.`, asset.id);
  };

  const checkinAsset = async (assetId: string, conditionNote?: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const note =
      conditionNote ||
      (await prompt({
        title: 'Rücknahme-Notiz',
        message: 'Optionaler Zustand/Kommentar',
        defaultValue: '',
      })) ||
      '';
    const updated: Asset = {
      ...asset,
      status: 'Verfügbar',
      assignedTo: '-',
      nextReturn: '-',
      nextReservation: '-',
      notes: note ? `${asset.notes}\nRücknahme: ${note}`.trim() : asset.notes,
    };
    await saveAsset(updated);
    await addActivity('Asset zurückgenommen', `${asset.name} wurde zurückgenommen.`, asset.id);
  };

  const setAssetMaintenance = async (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const note = await prompt({
      title: 'In Wartung setzen',
      message: 'Wartungsgrund',
      defaultValue: 'Prüfung erforderlich',
      required: true,
      submitLabel: 'Setzen',
    });
    if (!note?.trim()) return;
    const updated: Asset = {
      ...asset,
      status: 'In Wartung',
      maintenanceState: note.trim(),
    };
    await saveAsset(updated);
    await addActivity('Asset in Wartung', `${asset.name}: ${note.trim()}`, asset.id);
  };

  const editAsset = async (assetId: string) => {
    const asset = assets.find((item) => item.id === assetId);
    if (!asset) return;
    const name = (await prompt({
      title: 'Gerät bearbeiten',
      message: 'Gerätename',
      defaultValue: asset.name,
      required: true,
      submitLabel: 'Weiter',
    })) || asset.name;
    const location = (await prompt({
      title: 'Gerät bearbeiten',
      message: 'Standort',
      defaultValue: asset.location,
      required: true,
      submitLabel: 'Weiter',
    })) || asset.location;
    const notes =
      (await prompt({
        title: 'Gerät bearbeiten',
        message: 'Notizen',
        defaultValue: asset.notes,
        multiline: true,
      })) ?? asset.notes;
    const updated: Asset = { ...asset, name: name.trim(), location: location.trim(), notes };
    await saveAsset(updated);
    await addActivity('Asset bearbeitet', `${updated.name} wurde aktualisiert.`, updated.id);
  };

  const createReservation = async () => {
    const team = await prompt({
      title: 'Reservierung anlegen',
      message: 'Team',
      required: true,
      submitLabel: 'Weiter',
    });
    if (!team?.trim()) return;
    const requestedBy =
      (await prompt({
        title: 'Reservierung anlegen',
        message: 'Ansprechpartner',
        defaultValue: 'Unbekannt',
        submitLabel: 'Weiter',
      })) || 'Unbekannt';
    const period =
      (await prompt({
        title: 'Reservierung anlegen',
        message: 'Zeitraum',
        defaultValue: 'Heute - Morgen',
        submitLabel: 'Weiter',
      })) || 'Heute - Morgen';
    const location =
      (await prompt({
        title: 'Reservierung anlegen',
        message: 'Ort',
        defaultValue: 'Hauptlager',
        submitLabel: 'Weiter',
      })) || 'Hauptlager';
    const assetsCsv =
      (await prompt({
        title: 'Reservierung anlegen',
        message: 'Assets (kommagetrennt)',
        defaultValue: assets
          .slice(0, 2)
          .map((a) => a.name)
          .join(', '),
        submitLabel: 'Erstellen',
      })) || '';
    const reservation: ReservationItem = {
      id: createId('res'),
      team: team.trim(),
      requestedBy: requestedBy.trim(),
      period: period.trim(),
      assets: assetsCsv
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      status: 'Angefragt',
      location: location.trim(),
    };
    setReservations((prev) => [reservation, ...prev]);
    try {
      await upsertReservation(reservation);
      await addActivity('Reservierung erstellt', `${reservation.team} wurde als Reservierung angelegt.`);
    } catch {
      setWmsError('Reservierung konnte nicht im Backend gespeichert werden.');
    }
  };

  const editReservation = async (id: string) => {
    const existing = reservations.find((item) => item.id === id);
    if (!existing) return;
    const period =
      (await prompt({
        title: 'Reservierung bearbeiten',
        message: 'Zeitraum',
        defaultValue: existing.period,
        submitLabel: 'Weiter',
      })) || existing.period;
    const statusInput =
      ((await prompt({
        title: 'Reservierung bearbeiten',
        message: 'Status (Angefragt, Bestätigt, Aktiv, Abgeschlossen, Storniert)',
        defaultValue: existing.status,
        submitLabel: 'Speichern',
      })) as ReservationItem['status']) || existing.status;
    const updated: ReservationItem = { ...existing, period: period.trim(), status: statusInput };
    setReservations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    try {
      await upsertReservation(updated);
    } catch {
      setWmsError('Reservierung konnte nicht aktualisiert werden.');
    }
  };

  const checkoutReservation = async (id: string) => {
    const existing = reservations.find((item) => item.id === id);
    if (!existing) return;
    const updated: ReservationItem = { ...existing, status: 'Aktiv' };
    setReservations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    try {
      await upsertReservation(updated);
    } catch {
      setWmsError('Reservierung konnte nicht auf Aktiv gesetzt werden.');
    }
    const matchedAssets = assets.filter((asset) => existing.assets.includes(asset.name));
    for (const asset of matchedAssets) {
      // eslint-disable-next-line no-await-in-loop
      await checkoutAsset(asset.id, existing.team, existing.period);
    }
  };

  const cancelReservation = async (id: string) => {
    const existing = reservations.find((item) => item.id === id);
    if (!existing) return;
    const updated: ReservationItem = { ...existing, status: 'Storniert' };
    setReservations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    try {
      await upsertReservation(updated);
      await addActivity('Reservierung storniert', `${existing.id} wurde storniert.`);
    } catch {
      setWmsError('Reservierung konnte nicht storniert werden.');
    }
  };

  const createMaintenance = async (payload: CreateMaintenancePayload) => {
    const item: MaintenanceItem = {
      id: createId('mnt'),
      assetName: payload.assetName,
      issue: payload.issue,
      comment: payload.comment || 'Neu erfasst',
      reportedAt: new Date().toLocaleDateString('de-DE'),
      dueDate: new Date(Date.now() + 4 * 86400000).toLocaleDateString('de-DE'),
      priority: 'Mittel',
      status: 'Offen',
      location: 'Werkstatt',
    };
    setMaintenanceItems((prev) => [item, ...prev]);
    try {
      await upsertMaintenance(item);
      await addActivity('Defektmeldung erstellt', `${item.assetName}: ${item.issue}`);
    } catch {
      setWmsError('Defektmeldung konnte nicht gespeichert werden.');
    }
  };

  const inviteUser = async () => {
    const name = await prompt({
      title: 'Benutzer anlegen',
      message: 'Name',
      required: true,
      submitLabel: 'Weiter',
    });
    if (!name?.trim()) return;
    const email =
      (await prompt({
        title: 'Benutzer anlegen',
        message: 'E-Mail oder Benutzername',
        defaultValue: '',
        required: true,
        submitLabel: 'Weiter',
      })) || '';
    if (!email.trim()) return;
    const role =
      ((await prompt({
        title: 'Benutzer anlegen',
        message: 'Rolle (Admin oder Mitarbeiter)',
        defaultValue: 'Mitarbeiter',
        submitLabel: 'Weiter',
      })) as UserItem['role']) ||
      'Mitarbeiter';
    const department =
      (await prompt({
        title: 'Benutzer anlegen',
        message: 'Abteilung (optional)',
        defaultValue: '',
        submitLabel: 'Weiter',
      })) || '';
    const location =
      (await prompt({
        title: 'Benutzer anlegen',
        message: 'Standort (optional)',
        defaultValue: '',
        submitLabel: 'Anlegen',
      })) || '';
    const user: UserItem = {
      id: createId('usr'),
      name: name.trim(),
      email: email.trim(),
      role: normalizeUserRole(role),
      lastActive: 'Gerade erstellt',
      status: 'Aktiv',
      department: department.trim() || undefined,
      location: location.trim() || undefined,
    };
    setUsers((prev) => [user, ...prev]);
    try {
      await upsertUser(user);
      await addActivity('Benutzer erstellt', `${user.name} wurde eingeladen.`);
    } catch {
      setWmsError('Benutzer konnte nicht gespeichert werden.');
    }
  };

  const openLocationInventory = (name: string) => {
    setSearch(name);
    setActivePage('inventory');
  };

  const editLocation = async (name: string) => {
    const location = locations.find((item) => item.name === name);
    if (!location) return;
    const manager =
      (await prompt({
        title: `Standort ${name}`,
        message: 'Verantwortlich',
        defaultValue: location.manager,
        submitLabel: 'Weiter',
      })) || location.manager;
    const capacity =
      (await prompt({
        title: `Standort ${name}`,
        message: 'Kapazität',
        defaultValue: location.capacity,
        submitLabel: 'Speichern',
      })) || location.capacity;
    const updated: LocationItem = { ...location, manager: manager.trim(), capacity: capacity.trim() };
    setLocations((prev) => prev.map((item) => (item.name === name ? updated : item)));
    try {
      await upsertLocation(updated);
    } catch {
      setWmsError('Standort konnte nicht aktualisiert werden.');
    }
  };

  const openHelp = () => {
    window.open('/api/docs', '_blank', 'noopener,noreferrer');
  };

  const openNotifications = () => {
    void (async () => {
      const latest = activities.slice(0, 3);
      if (!latest.length) {
        await alert({
          title: 'Aktivitäten',
          message: 'Keine neuen Aktivitäten.',
        });
        return;
      }
      const message = latest.map((item) => `- ${item.title}: ${item.detail}`).join('\n');
      await alert({
        title: 'Neueste Aktivitäten',
        message,
      });
    })();
  };

  const openProfile = () => {
    setActivePage('users');
  };

  const checkoutFromForm = async (payload: CheckoutPayload) => {
    await checkoutAsset(payload.assetId, payload.assignee, payload.dueDate, payload.note);
  };

  const checkinFromForm = async (payload: CheckinPayload) => {
    await checkinAsset(payload.assetId, payload.condition);
  };

  return {
    loadWms,
    theme,
    toggleTheme,
    isLoading,
    wmsError,
    activePage,
    setActivePage,
    search,
    setSearch,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    selectedAsset,
    assets,
    activities,
    reservations,
    maintenanceItems,
    locations,
    users,
    openAssetDetail,
    createAsset,
    reserveAsset,
    checkoutAsset,
    checkinAsset,
    setAssetMaintenance,
    editAsset,
    createReservation,
    editReservation,
    checkoutReservation,
    cancelReservation,
    createMaintenance,
    inviteUser,
    openLocationInventory,
    editLocation,
    openHelp,
    openNotifications,
    openProfile,
    checkoutFromForm,
    checkinFromForm,
  };
}
