import type {
  DefaultsResponsePayload,
  JobStatusPayload,
  LoginResponsePayload,
  LlmModelsResponse,
  SortConfigPayload,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || 'http://localhost:8000';

const buildUrl = (path: string): string => `${API_BASE}${path}`;

async function parseJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let detail = response.statusText || 'Request fehlgeschlagen';
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload?.detail) {
      detail = payload.detail;
    }
  } catch {
    // ignore parse errors and keep default detail
  }
  throw new Error(detail);
}

export async function fetchDefaults(): Promise<DefaultsResponsePayload> {
  const response = await fetch(buildUrl('/api/defaults'));
  return parseJson<DefaultsResponsePayload>(response);
}

export async function testLogin(payload: {
  apple_id: string;
  apple_password: string;
  two_factor_code?: string;
}): Promise<LoginResponsePayload> {
  const response = await fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<LoginResponsePayload>(response);
}

export async function startJob(config: SortConfigPayload): Promise<JobStatusPayload> {
  const response = await fetch(buildUrl('/api/jobs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  const started = await parseJson<{ job_id: string }>(response);
  return getJobStatus(started.job_id);
}

export async function getJobStatus(jobId: string): Promise<JobStatusPayload> {
  const response = await fetch(buildUrl(`/api/jobs/${jobId}`));
  return parseJson<JobStatusPayload>(response);
}

export async function stopJob(jobId: string): Promise<JobStatusPayload> {
  const response = await fetch(buildUrl(`/api/jobs/${jobId}/stop`), { method: 'POST' });
  return parseJson<JobStatusPayload>(response);
}

export async function submitTwoFactor(jobId: string, code: string): Promise<JobStatusPayload> {
  const response = await fetch(buildUrl(`/api/jobs/${jobId}/2fa`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return parseJson<JobStatusPayload>(response);
}

export async function fetchModels(base: string, apiKey?: string): Promise<LlmModelsResponse> {
  const params = new URLSearchParams({ base });
  if (apiKey?.trim()) {
    params.set('api_key', apiKey.trim());
  }
  const response = await fetch(buildUrl(`/api/llm/models?${params.toString()}`));
  return parseJson<LlmModelsResponse>(response);
}

export { API_BASE };
