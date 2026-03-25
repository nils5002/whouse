import { Loader2, Play, RefreshCw, ShieldCheck, Square, TestTube2, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  API_BASE,
  fetchDefaults,
  fetchModels,
  getJobStatus,
  startJob,
  stopJob,
  submitTwoFactor,
  testLogin,
} from '../../api/cloudApi';
import { JobLog } from '../../components/JobLog';
import { StatusBadge as JobStatusBadge } from '../../components/StatusBadge';
import type { JobStatusPayload, SortConfigPayload } from '../../types';

const ACTIVE_STATES = new Set(['pending', 'running', 'awaiting_2fa']);

const toUiConfig = (input: SortConfigPayload): SortConfigPayload => ({
  ...input,
  apple_id: '',
  apple_password: '',
  llm_api_base: input.llm_api_base ?? '',
  llm_api_key: input.llm_api_key ?? '',
  ocr_engine: input.ocr_engine ?? 'auto',
});

const normalizeConfig = (config: SortConfigPayload, fileTypesInput: string): SortConfigPayload => ({
  ...config,
  llm_api_base: (config.llm_api_base || '').trim() || null,
  llm_api_key: (config.llm_api_key || '').trim() || null,
  ocr_engine: config.use_ocr ? (config.ocr_engine || '').trim() || null : null,
  file_types: fileTypesInput
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
});

export function CloudSorterPage() {
  const [config, setConfig] = useState<SortConfigPayload | null>(null);
  const [fileTypesInput, setFileTypesInput] = useState('');
  const [ocrEngines, setOcrEngines] = useState<string[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loginCode, setLoginCode] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [job, setJob] = useState<JobStatusPayload | null>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const isJobActive = useMemo(() => !!job && ACTIVE_STATES.has(job.status), [job]);

  const loadDefaults = async () => {
    try {
      setLoadingDefaults(true);
      setErrorText(null);
      const payload = await fetchDefaults();
      setConfig(toUiConfig(payload.default_config));
      setFileTypesInput(payload.default_file_types.join(', '));
      setOcrEngines(payload.available_ocr_engines);
      setInfoText('Standardkonfiguration vom Backend geladen.');
    } catch (error) {
      setErrorText((error as Error).message);
    } finally {
      setLoadingDefaults(false);
    }
  };

  useEffect(() => {
    void loadDefaults();
  }, []);

  useEffect(() => {
    if (!job || !ACTIVE_STATES.has(job.status)) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const fresh = await getJobStatus(job.job_id);
        setJob(fresh);
      } catch (error) {
        setErrorText((error as Error).message);
      }
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [job]);

  if (!config && loadingDefaults) {
    return (
      <section className="surface-card animate-fade-up">
        <p className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Lade Backend-Konfiguration...
        </p>
      </section>
    );
  }

  if (!config) {
    return (
      <section className="surface-card animate-fade-up">
        <p className="text-sm text-rose-600">{errorText || 'Konfiguration konnte nicht geladen werden.'}</p>
        <button
          type="button"
          onClick={() => void loadDefaults()}
          className="mt-3 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Erneut versuchen
        </button>
      </section>
    );
  }

  const updateConfig = <K extends keyof SortConfigPayload>(key: K, value: SortConfigPayload[K]) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Cloud Sorter</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Backend-Steuerung</h2>
          <p className="mt-1 text-sm text-slate-500">
            API-Basis: <span className="font-medium">{API_BASE}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDefaults()}
          disabled={loadingDefaults}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loadingDefaults ? 'animate-spin' : ''}`} />
          Defaults laden
        </button>
      </div>

      {errorText ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorText}</p> : null}
      {infoText ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{infoText}</p> : null}

      <article className="surface-card animate-fade-up">
        <h3 className="text-base font-semibold text-slate-900">Sortierkonfiguration</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="field">
            Apple ID
            <input className="field-input" value={config.apple_id} onChange={(event) => updateConfig('apple_id', event.target.value)} />
          </label>
          <label className="field">
            Apple Passwort
            <input type="password" className="field-input" value={config.apple_password} onChange={(event) => updateConfig('apple_password', event.target.value)} />
          </label>
          <label className="field">
            LLM API Base
            <input className="field-input" value={config.llm_api_base || ''} onChange={(event) => updateConfig('llm_api_base', event.target.value)} />
          </label>
          <label className="field">
            LLM API Key
            <input type="password" className="field-input" value={config.llm_api_key || ''} onChange={(event) => updateConfig('llm_api_key', event.target.value)} />
          </label>
          <label className="field">
            Modell
            <input className="field-input" value={config.model} onChange={(event) => updateConfig('model', event.target.value)} />
          </label>
          <label className="field">
            OCR Engine
            <select className="field-input" value={config.ocr_engine || 'auto'} onChange={(event) => updateConfig('ocr_engine', event.target.value)}>
              {(ocrEngines.length ? ocrEngines : ['auto']).map((engine) => (
                <option key={engine}>{engine}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Zielordner
            <input className="field-input" value={config.target_root} onChange={(event) => updateConfig('target_root', event.target.value)} />
          </label>
          <label className="field">
            Dateitypen (CSV)
            <input className="field-input" value={fileTypesInput} onChange={(event) => setFileTypesInput(event.target.value)} />
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="field">
            Max PDF Seiten
            <input type="number" className="field-input" min={1} max={20} value={config.max_pdf_pages} onChange={(event) => updateConfig('max_pdf_pages', Number(event.target.value))} />
          </label>
          <label className="field">
            Max Bytes
            <input type="number" className="field-input" min={500} max={1000000} value={config.max_bytes_to_read} onChange={(event) => updateConfig('max_bytes_to_read', Number(event.target.value))} />
          </label>
          <label className="field">
            Timeout (Sek.)
            <input type="number" className="field-input" min={5} max={120} value={config.request_timeout} onChange={(event) => updateConfig('request_timeout', Number(event.target.value))} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={config.dry_run} onChange={(event) => updateConfig('dry_run', event.target.checked)} />
            Dry run
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={config.use_ocr} onChange={(event) => updateConfig('use_ocr', event.target.checked)} />
            OCR aktiv
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={config.deep_analysis} onChange={(event) => updateConfig('deep_analysis', event.target.checked)} />
            Deep analysis
          </label>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={async () => {
              try {
                setModelsLoading(true);
                setErrorText(null);
                const result = await fetchModels((config.llm_api_base || '').trim(), (config.llm_api_key || '').trim());
                setModels(result.models);
                if (result.models.length && !result.models.includes(config.model)) {
                  updateConfig('model', result.models[0]);
                }
                setInfoText(`${result.models.length} Modelle geladen.`);
              } catch (error) {
                setErrorText((error as Error).message);
              } finally {
                setModelsLoading(false);
              }
            }}
            disabled={modelsLoading || !(config.llm_api_base || '').trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wifi className={`h-4 w-4 ${modelsLoading ? 'animate-pulse' : ''}`} />
            Modelle laden
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setLoginLoading(true);
                setErrorText(null);
                const result = await testLogin({
                  apple_id: config.apple_id,
                  apple_password: config.apple_password,
                  two_factor_code: loginCode.trim() || undefined,
                });
                setInfoText(result.message);
              } catch (error) {
                setErrorText((error as Error).message);
              } finally {
                setLoginLoading(false);
              }
            }}
            disabled={loginLoading || !config.apple_id.trim() || !config.apple_password.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <TestTube2 className={`h-4 w-4 ${loginLoading ? 'animate-pulse' : ''}`} />
            Login testen
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setJobLoading(true);
                setErrorText(null);
                setInfoText(null);
                const started = await startJob(normalizeConfig(config, fileTypesInput));
                setJob(started);
                setInfoText(`Job ${started.job_id} gestartet.`);
              } catch (error) {
                setErrorText((error as Error).message);
              } finally {
                setJobLoading(false);
              }
            }}
            disabled={jobLoading || isJobActive || !config.apple_id.trim() || !config.apple_password.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            Sortierung starten
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!job) return;
              try {
                setErrorText(null);
                const stopped = await stopJob(job.job_id);
                setJob(stopped);
                setInfoText(`Job ${job.job_id} gestoppt.`);
              } catch (error) {
                setErrorText((error as Error).message);
              }
            }}
            disabled={!job || !isJobActive}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Square className="h-4 w-4" />
            Job stoppen
          </button>
        </div>
        <label className="field mt-3">
          2FA-Code fuer Login-Test (optional)
          <input className="field-input" value={loginCode} onChange={(event) => setLoginCode(event.target.value)} />
        </label>
        {models.length ? (
          <p className="mt-3 text-xs text-slate-500">Modelle: {models.join(', ')}</p>
        ) : null}
      </article>

      <article className="surface-card animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Job-Status</h3>
          <div className="inline-flex items-center gap-2">
            {job?.status ? <JobStatusBadge status={job.status} /> : null}
            {jobLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
          </div>
        </div>
        {job ? (
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <p><span className="text-slate-500">Job ID:</span> {job.job_id}</p>
            <p><span className="text-slate-500">Seen:</span> {job.seen_items}</p>
            <p><span className="text-slate-500">Processed:</span> {job.processed_files}</p>
            <p><span className="text-slate-500">Updated:</span> {new Date(job.updated_at).toLocaleString()}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Noch kein Job gestartet.</p>
        )}

        {job?.awaiting_two_factor ? (
          <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-orange-700">
              <ShieldCheck className="h-4 w-4" />
              Zwei-Faktor-Code erforderlich
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input className="field-input max-w-xs" value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value)} placeholder="2FA-Code" />
              <button
                type="button"
                onClick={async () => {
                  if (!job || !twoFactorCode.trim()) return;
                  try {
                    const updated = await submitTwoFactor(job.job_id, twoFactorCode.trim());
                    setJob(updated);
                    setTwoFactorCode('');
                    setInfoText('2FA-Code uebermittelt.');
                  } catch (error) {
                    setErrorText((error as Error).message);
                  }
                }}
                className="rounded-xl bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                2FA senden
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <JobLog logs={job?.logs || []} />
        </div>
      </article>
    </section>
  );
}
