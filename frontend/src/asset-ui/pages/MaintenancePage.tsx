import { AlertCircle, Wrench } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppDialog } from '../../components/dialogs/AppDialogProvider';
import { StatusBadge } from '../components/StatusBadge';
import type { Asset, MaintenanceItem } from '../types';

type MaintenancePageProps = {
  maintenanceItems: MaintenanceItem[];
  assets: Asset[];
  onOpenAssetDetail: (assetId: string) => void;
  onOpenInventoryWithQuery: (query: string) => void;
  onCreateMaintenance: (payload: { assetName: string; issue: string; comment: string }) => void;
};

type StatusColumn = {
  title: 'Offen' | 'In Bearbeitung' | 'Erledigt';
  tone: string;
};

const columns: StatusColumn[] = [
  { title: 'Offen', tone: 'border-rose-200 bg-rose-50/75' },
  { title: 'In Bearbeitung', tone: 'border-amber-200 bg-amber-50/75' },
  { title: 'Erledigt', tone: 'border-emerald-200 bg-emerald-50/75' },
];

export function MaintenancePage({
  maintenanceItems,
  assets,
  onOpenAssetDetail,
  onOpenInventoryWithQuery,
  onCreateMaintenance,
}: MaintenancePageProps) {
  const { alert } = useAppDialog();
  const [formError, setFormError] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [issue, setIssue] = useState('');
  const [comment, setComment] = useState('');
  const [priority, setPriority] = useState<MaintenanceItem['priority']>('Mittel');
  const [status, setStatus] = useState<MaintenanceItem['status']>('Offen');
  const [location, setLocation] = useState('Werkstatt');

  const openCount = maintenanceItems.filter((item) => item.status === 'Offen').length;
  const inProgressCount = maintenanceItems.filter((item) => item.status === 'In Bearbeitung').length;
  const doneCount = maintenanceItems.filter((item) => item.status === 'Erledigt').length;

  const grouped = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        items: maintenanceItems.filter((item) => item.status === column.title),
      })),
    [maintenanceItems],
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="page-kicker">Defekte / Tickets</p>
          <h2 className="page-title">Ticketübersicht</h2>
          <p className="page-subtitle">Was ist kaputt, was ist in Arbeit und was ist abgeschlossen.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-xs font-semibold text-rose-700">Offen</p>
            <p className="text-lg font-semibold text-rose-800">{openCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-semibold text-amber-700">In Bearbeitung</p>
            <p className="text-lg font-semibold text-amber-800">{inProgressCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-semibold text-emerald-700">Erledigt</p>
            <p className="text-lg font-semibold text-emerald-800">{doneCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <article className="surface-card animate-fade-up xl:col-span-8">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Wrench className="h-4 w-4" />
            Ticketboard
          </h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {grouped.map((column) => (
              <div key={column.title} className={`rounded-2xl border p-3 ${column.tone}`}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {column.title} ({column.items.length})
                </p>
                <div className="mt-2 space-y-2">
                  {column.items.length ? (
                    column.items.map((item) => (
                      <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.assetName}</p>
                          <StatusBadge value={item.priority} />
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{item.issue}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Gemeldet: {item.reportedAt} • Fällig: {item.dueDate}
                        </p>
                        <p className="mt-2 text-xs text-slate-600">{item.comment}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => {
                              const match = assets.find((asset) => asset.name === item.assetName);
                              if (match) {
                                onOpenAssetDetail(match.id);
                                return;
                              }
                              onOpenInventoryWithQuery(item.assetName);
                            }}
                          >
                            Asset öffnen
                          </button>
                          <button
                            type="button"
                            className="btn-ghost px-2 py-1 text-xs"
                            onClick={() => onOpenInventoryWithQuery(item.assetName)}
                          >
                            Bestand prüfen
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-500">
                      Keine Tickets
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card animate-fade-up xl:col-span-4">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <AlertCircle className="h-4 w-4" />
            Defektmeldung erfassen
          </h3>
          {formError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Gerätebezug</h4>
              <div className="mt-2 grid gap-2">
                <label className="field">
                  Asset *
                  <input
                    list="maintenance-asset-options"
                    className="field-input"
                    placeholder="Asset-ID oder Name"
                    value={assetName}
                    onChange={(event) => setAssetName(event.target.value)}
                  />
                  <datalist id="maintenance-asset-options">
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.name} />
                    ))}
                  </datalist>
                </label>
                <label className="field">
                  Standort
                  <input
                    className="field-input"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Fehlerbild</h4>
              <div className="mt-2 grid gap-2">
                <label className="field">
                  Problemkurztext *
                  <input
                    className="field-input"
                    placeholder="z. B. Display flackert"
                    value={issue}
                    onChange={(event) => setIssue(event.target.value)}
                  />
                </label>
                <label className="field">
                  Detaillierte Beschreibung
                  <textarea
                    className="field-input min-h-[90px]"
                    placeholder="Symptome, Zeitpunkt, Auswirkung"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                </label>
                <label className="field">
                  Optionales Foto
                  <input className="field-input py-2" type="file" accept="image/*" />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-sm font-semibold text-slate-900">Bearbeitungsstatus</h4>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="field">
                  Priorität
                  <select
                    className="field-input"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value as MaintenanceItem['priority'])}
                  >
                    <option value="Niedrig">Niedrig</option>
                    <option value="Mittel">Mittel</option>
                    <option value="Hoch">Hoch</option>
                    <option value="Kritisch">Kritisch</option>
                  </select>
                </label>
                <label className="field">
                  Ticketstatus
                  <select
                    className="field-input"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as MaintenanceItem['status'])}
                  >
                    <option value="Offen">Offen</option>
                    <option value="In Bearbeitung">In Bearbeitung</option>
                    <option value="Erledigt">Erledigt</option>
                  </select>
                </label>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={async () => {
                if (!assetName.trim() || !issue.trim()) {
                  setFormError('Bitte Asset und Problemkurztext ausfüllen, bevor du das Ticket anlegst.');
                  return;
                }
                setFormError(null);
                onCreateMaintenance({
                  assetName: assetName.trim(),
                  issue: issue.trim(),
                  comment: comment.trim(),
                  priority,
                  status,
                  location: location.trim() || 'Werkstatt',
                });
                setAssetName('');
                setIssue('');
                setComment('');
                setPriority('Mittel');
                setStatus('Offen');
                setLocation('Werkstatt');
                await alert({
                  title: 'Ticket erstellt',
                  message: 'Die Defektmeldung wurde erfolgreich erfasst.',
                });
              }}
            >
              Meldung anlegen
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
