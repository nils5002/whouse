import type {
  ActivityItem,
  Asset,
  LocationItem,
  MaintenanceItem,
  ReservationItem,
  UserItem,
} from '../asset-ui/types';

const rawBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : '';
const apiUrl = (path: string): string => (API_BASE ? `${API_BASE}${path}` : path);

export type WmsOverview = {
  assets: Asset[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  maintenanceItems: MaintenanceItem[];
  locations: LocationItem[];
  users: UserItem[];
};

export type HardwareImportRowError = {
  file_name: string;
  sheet_name: string;
  row_number: number;
  serial_number?: string | null;
  reason: string;
  raw_data: Record<string, unknown>;
};

export type HardwareImportRunResponse = {
  run_id: number;
  status: string;
  started_at: string;
  finished_at?: string | null;
  import_path: string;
  files_total: number;
  files_processed: number;
  rows_total: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  error_count: number;
  details: Record<string, unknown>;
  errors: HardwareImportRowError[];
};

const umlautPairs: Array<[string, string]> = [
  ['Verfuegbar', 'Verfügbar'],
  ['Verliehen', 'Verliehen'],
  ['Bestaetigt', 'Bestätigt'],
  ['Eingeschraenkt', 'Inaktiv'],
  ['Buero', 'Büro'],
  ['buero', 'büro'],
  ['Koeln', 'Köln'],
  ['koeln', 'köln'],
  ['Schaeden', 'Schäden'],
  ['schaeden', 'schäden'],
  ['Zubehoer', 'Zubehör'],
  ['zubehoer', 'zubehör'],
  ['geoeffnet', 'geöffnet'],
  ['Rueck', 'Rück'],
  ['rueck', 'rück'],
  ['ueber', 'über'],
  ['Ueber', 'Über'],
];

const outboundEnumMap: Record<string, string> = {
  Verfügbar: 'Verfuegbar',
  Verliehen: 'Verliehen',
  Bestätigt: 'Bestaetigt',
  Inaktiv: 'Inaktiv',
};

function normalizeText(value: string): string {
  let next = value;
  for (const [from, to] of umlautPairs) {
    next = next.replaceAll(from, to);
  }
  return next;
}

function normalizeDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return normalizeText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, current]) => [
      key,
      normalizeDeep(current),
    ]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function normalizeOutbound<T>(value: T): T {
  if (typeof value === 'string') {
    return (outboundEnumMap[value] ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeOutbound(item)) as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, current]) => [
      key,
      normalizeOutbound(current),
    ]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`WMS API Fehler (${response.status})`);
  }
  return normalizeDeep((await response.json()) as T);
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizeOutbound(payload)),
  });
  return parseResponse<T>(response);
}

export async function fetchWmsOverview(): Promise<WmsOverview> {
  const response = await fetch(apiUrl('/api/wms/overview'));
  return parseResponse<WmsOverview>(response);
}

export function upsertAsset(asset: Asset): Promise<Asset> {
  return postJson<Asset>('/api/wms/assets', asset);
}

export function upsertReservation(reservation: ReservationItem): Promise<ReservationItem> {
  return postJson<ReservationItem>('/api/wms/reservations', reservation);
}

export function upsertMaintenance(item: MaintenanceItem): Promise<MaintenanceItem> {
  return postJson<MaintenanceItem>('/api/wms/maintenance', item);
}

export function upsertLocation(location: LocationItem): Promise<LocationItem> {
  return postJson<LocationItem>('/api/wms/locations', location);
}

export function upsertUser(user: UserItem): Promise<UserItem> {
  return postJson<UserItem>('/api/wms/users', user);
}

export function upsertActivity(activity: ActivityItem): Promise<ActivityItem> {
  return postJson<ActivityItem>('/api/wms/activities', activity);
}

export function runHardwareImport(dryRun: boolean): Promise<HardwareImportRunResponse> {
  const query = dryRun ? '?dry_run=true' : '?dry_run=false';
  return fetch(apiUrl(`/api/import/hardware${query}`), { method: 'POST' }).then((response) =>
    parseResponse<HardwareImportRunResponse>(response),
  );
}

export async function getHardwareImportRun(runId: number): Promise<HardwareImportRunResponse> {
  const response = await fetch(apiUrl(`/api/import/hardware/${runId}`));
  return parseResponse<HardwareImportRunResponse>(response);
}
