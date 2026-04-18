import { Download, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import type { Asset } from '../types';
import {
  getHardwareImportRun,
  runHardwareImport,
  type HardwareImportRunResponse,
} from '../../services/wmsApi';

type ImportExportPageProps = {
  assets: Asset[];
  onImported: () => Promise<void>;
};

export function ImportExportPage({ assets, onImported }: ImportExportPageProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<HardwareImportRunResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeImport = async (dryRun: boolean) => {
    setIsRunning(true);
    setError(null);
    try {
      const started = await runHardwareImport(dryRun);
      const finalState = await getHardwareImportRun(started.run_id);
      setRunResult(finalState);
      if (!dryRun) {
        await onImported();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    } finally {
      setIsRunning(false);
    }
  };

  const exportAssetsCsv = () => {
    const header = [
      'Name',
      'Kategorie',
      'Seriennummer',
      'Inventarnummer',
      'Status',
      'Standort',
      'ZugewiesenAn',
      'Notizen',
      'QR',
    ];
    const rows = assets.map((asset) => [
      asset.name,
      asset.category,
      asset.serialNumber,
      asset.tagNumber,
      asset.status,
      asset.location,
      asset.assignedTo,
      asset.notes.replaceAll('\n', ' '),
      asset.qrCode ?? '',
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventar-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Import / Export</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Datenmanagement</h2>
        <p className="mt-1 text-sm text-slate-500">
          Excel-Bestand importieren und Inventar als CSV exportieren.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileSpreadsheet className="h-4 w-4" />
            Excel-Import
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nutzt die Dateien aus dem Ordner <span className="font-medium">Hardwarebestand</span>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              onClick={() => {
                void executeImport(true);
              }}
              disabled={isRunning}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Dry-Run
              </span>
            </button>
            <button
              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              onClick={() => {
                void executeImport(false);
              }}
              disabled={isRunning}
            >
              Import starten
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
          {runResult ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-900">
                Lauf #{runResult.run_id} · Status: {runResult.status}
              </p>
              <p className="mt-1 text-slate-600">
                Dateien {runResult.files_processed}/{runResult.files_total}, Zeilen {runResult.rows_total}
              </p>
              <p className="text-slate-600">
                Erstellt {runResult.created_count}, Aktualisiert {runResult.updated_count}, Übersprungen {runResult.skipped_count}, Fehler {runResult.error_count}
              </p>
              {runResult.errors.length ? (
                <ul className="mt-3 space-y-1 text-xs text-rose-700">
                  {runResult.errors.slice(0, 5).map((item) => (
                    <li key={`${item.file_name}-${item.row_number}`}>
                      {item.file_name} · Zeile {item.row_number}: {item.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Download className="h-4 w-4" />
            Export
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Exportiert den aktuellen Bestand als CSV für Office/BI-Tools.
          </p>
          <div className="mt-4">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={exportAssetsCsv}
            >
              Inventar als CSV exportieren
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">{assets.length} Assets im aktuellen Export.</p>
        </article>
      </div>
    </section>
  );
}

