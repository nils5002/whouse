import type {
  ActivityItem,
  Asset,
  AppRole,
  LocationItem,
  MaintenanceItem,
  ReservationItem,
  UserItem,
} from '../asset-ui/types';

const rawBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : '';
const apiUrl = (path: string): string => (API_BASE ? `${API_BASE}${path}` : path);
const ACCESS_STORAGE_KEY = 'wms.accessContext';
const AUTH_STORAGE_KEY = 'wms.authSession';

type ApiAccessContext = {
  projectContext?: string;
};

export type AuthUser = {
  userId: string;
  name: string;
  email: string;
  role: AppRole;
};

export type AuthSession = {
  accessToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  user: AuthUser;
};

export type AuthLoginPayload = {
  identifier: string;
  password: string;
};

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

export type PlanningStatus = "Entwurf" | "Geplant" | "Bestätigt" | "Bestaetigt" | "Abgeschlossen" | "Storniert";

export type PlanningItemPayload = {
  categoryKey: string;
  qty: number;
  notes?: string | null;
};

export type PlanningDayPayload = {
  planningDate: string;
  weekday?: string | null;
  items: PlanningItemPayload[];
};

export type PlanningUpsertPayload = {
  id?: string | null;
  customerName: string;
  projectName: string;
  eventName?: string | null;
  projectManagerUserId?: string | null;
  calendarWeek?: number | null;
  startDate: string;
  endDate: string;
  notes: string;
  status: PlanningStatus;
  days: PlanningDayPayload[];
};

export type PlanningListItem = {
  id: string;
  customerName: string;
  projectName: string;
  eventName?: string | null;
  projectManagerUserId?: string | null;
  calendarWeek?: number | null;
  startDate: string;
  endDate: string;
  status: PlanningStatus;
  updatedAt: string;
};

export type PlanningItemResponse = {
  id: number;
  categoryKey: string;
  qty: number;
  notes?: string | null;
};

export type PlanningDayResponse = {
  id: number;
  planningDate: string;
  weekday: string;
  items: PlanningItemResponse[];
};

export type PlanningResponse = {
  id: string;
  customerName: string;
  projectName: string;
  eventName?: string | null;
  projectManagerUserId?: string | null;
  calendarWeek?: number | null;
  startDate: string;
  endDate: string;
  notes: string;
  status: PlanningStatus;
  templateSourcePlanningId?: string | null;
  createdAt: string;
  updatedAt: string;
  days: PlanningDayResponse[];
};

export type PlanningAvailabilityState = "green" | "yellow" | "red";

export type PlanningAvailabilityItem = {
  planningDate: string;
  weekday: string;
  categoryKey: string;
  requestedQty: number;
  totalStock: number;
  usableStock: number;
  alreadyPlanned: number;
  remainingQty: number;
  availabilityState: PlanningAvailabilityState;
  shortageQty: number;
};

export type PlanningAvailabilityCategorySummary = {
  categoryKey: string;
  requestedTotal: number;
  maxRequestedPerDay: number;
  totalStock: number;
  usableStock: number;
};

export type PlanningAvailabilityResponse = {
  planningId: string;
  periodStart: string;
  periodEnd: string;
  items: PlanningAvailabilityItem[];
  categorySummary: PlanningAvailabilityCategorySummary[];
};

const defaultAccessContext: ApiAccessContext = {};

let currentAccessContext: ApiAccessContext = (() => {
  try {
    const raw = window.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) return defaultAccessContext;
    const parsed = JSON.parse(raw) as ApiAccessContext;
    return {
      projectContext: parsed.projectContext?.trim() || undefined,
    };
  } catch {
    return defaultAccessContext;
  }
})();

let currentAuthSession: AuthSession | null = (() => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.userId || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
})();

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

function buildAccessHeaders(): HeadersInit {
  const headers: Record<string, string> = {};
  if (currentAuthSession?.accessToken) {
    headers.Authorization = `Bearer ${currentAuthSession.accessToken}`;
  }
  if (currentAccessContext.projectContext) {
    headers['X-Project-Context'] = currentAccessContext.projectContext;
  }
  return headers;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...buildAccessHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function getApiAccessContext(): ApiAccessContext {
  return currentAccessContext;
}

export function setApiAccessContext(context: ApiAccessContext): void {
  currentAccessContext = {
    projectContext: context.projectContext?.trim() || undefined,
  };
  try {
    window.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(currentAccessContext));
  } catch {
    // ignore storage write errors
  }
}

export function getAuthSession(): AuthSession | null {
  return currentAuthSession;
}

export function setAuthSession(session: AuthSession): void {
  currentAuthSession = session;
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage write errors
  }
}

export function clearAuthSession(): void {
  currentAuthSession = null;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore storage write errors
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detailMessage = '';
    try {
      const payload = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
      };
      if (typeof payload.detail === 'string') {
        detailMessage = payload.detail;
      } else if (Array.isArray(payload.detail)) {
        const parts = payload.detail
          .map((item) => item?.msg?.trim())
          .filter(Boolean);
        detailMessage = parts.join(' | ');
      }
    } catch {
      detailMessage = '';
    }
    throw new Error(
      detailMessage
        ? `WMS API Fehler (${response.status}): ${detailMessage}`
        : `WMS API Fehler (${response.status})`,
    );
  }
  return normalizeDeep((await response.json()) as T);
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizeOutbound(payload)),
  });
  return parseResponse<T>(response);
}

export async function fetchWmsOverview(): Promise<WmsOverview> {
  const response = await apiFetch('/api/wms/overview');
  return parseResponse<WmsOverview>(response);
}

export async function login(payload: AuthLoginPayload): Promise<AuthSession> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const session = await parseResponse<AuthSession>(response);
  setAuthSession(session);
  return session;
}

export async function fetchAuthMe(): Promise<AuthUser> {
  const response = await apiFetch('/api/auth/me');
  return parseResponse<AuthUser>(response);
}

export function upsertAsset(asset: Asset): Promise<Asset> {
  return postJson<Asset>('/api/wms/assets', asset);
}

export async function deleteAsset(assetId: string): Promise<{ deleted: boolean }> {
  const response = await apiFetch(`/api/wms/assets/${assetId}`, {
    method: 'DELETE',
  });
  return parseResponse<{ deleted: boolean }>(response);
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
  return apiFetch(`/api/import/hardware${query}`, { method: 'POST' }).then((response) =>
    parseResponse<HardwareImportRunResponse>(response),
  );
}

export async function getHardwareImportRun(runId: number): Promise<HardwareImportRunResponse> {
  const response = await apiFetch(`/api/import/hardware/${runId}`);
  return parseResponse<HardwareImportRunResponse>(response);
}

export async function listPlannings(filters?: {
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PlanningListItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.fromDate) params.set("fromDate", filters.fromDate);
  if (filters?.toDate) params.set("toDate", filters.toDate);
  const query = params.toString();
  const response = await apiFetch(`/api/wms/planning${query ? `?${query}` : ""}`);
  return parseResponse<PlanningListItem[]>(response);
}

export async function getPlanning(planningId: string): Promise<PlanningResponse> {
  const response = await apiFetch(`/api/wms/planning/${planningId}`);
  return parseResponse<PlanningResponse>(response);
}

export async function createPlanning(payload: PlanningUpsertPayload): Promise<PlanningResponse> {
  return postJson<PlanningResponse>("/api/wms/planning", payload);
}

export async function updatePlanning(planningId: string, payload: PlanningUpsertPayload): Promise<PlanningResponse> {
  const response = await apiFetch(`/api/wms/planning/${planningId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(normalizeOutbound(payload)),
  });
  return parseResponse<PlanningResponse>(response);
}

export function updatePlanningViaPost(planningId: string, payload: PlanningUpsertPayload): Promise<PlanningResponse> {
  return postJson<PlanningResponse>(`/api/wms/planning/${planningId}`, payload);
}

export function duplicatePlanning(planningId: string): Promise<PlanningResponse> {
  return postJson<PlanningResponse>(`/api/wms/planning/${planningId}/duplicate`, {});
}

export function updatePlanningStatus(
  planningId: string,
  status: PlanningStatus,
): Promise<PlanningResponse> {
  return postJson<PlanningResponse>(`/api/wms/planning/${planningId}/status`, { status });
}

export async function deletePlanning(planningId: string): Promise<{ deleted: boolean }> {
  const response = await apiFetch(`/api/wms/planning/${planningId}`, {
    method: "DELETE",
  });
  return parseResponse<{ deleted: boolean }>(response);
}

export async function getPlanningAvailability(planningId: string): Promise<PlanningAvailabilityResponse> {
  const response = await apiFetch(`/api/wms/planning/${planningId}/availability`);
  return parseResponse<PlanningAvailabilityResponse>(response);
}
