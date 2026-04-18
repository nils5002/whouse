import { AlertCircle, Wrench } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import type { MaintenanceItem } from '../types';

type MaintenancePageProps = {
  maintenanceItems: MaintenanceItem[];
  onCreateMaintenance: (payload: { assetName: string; issue: string; comment: string }) => void;
};

export function MaintenancePage({ maintenanceItems, onCreateMaintenance }: MaintenancePageProps) {
  const [assetName, setAssetName] = useState('');
  const [issue, setIssue] = useState('');
  const [comment, setComment] = useState('');
  const openCount = maintenanceItems.filter((item) => item.status === 'Offen').length;
  const inProgressCount = maintenanceItems.filter((item) => item.status === 'In Bearbeitung').length;
  const doneCount = maintenanceItems.filter((item) => item.status === 'Erledigt').length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Defekte / Tickets</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Ticketübersicht</h2>
          <p className="mt-1 text-sm text-slate-500">
            Defekte melden, bearbeiten und abschließen.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-xs text-rose-700">Offen</p>
            <p className="text-lg font-semibold text-rose-800">{openCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">In Bearbeitung</p>
            <p className="text-lg font-semibold text-amber-800">{inProgressCount}</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">Erledigt</p>
            <p className="text-lg font-semibold text-emerald-800">{doneCount}</p>
          </div>
        </div>
      </div>

      <article className="surface-card animate-fade-up">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Schaden</th>
                <th className="px-3 py-2">Gemeldet / Fällig</th>
              <th className="px-3 py-2">Priorität</th>
                <th className="px-3 py-2">Ticketstatus</th>
                <th className="px-3 py-2">Kommentar</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceItems.map((item) => (
                <tr key={item.id} className="rounded-xl bg-slate-50 text-slate-700">
                  <td className="rounded-l-xl px-3 py-3">
                    <p className="font-medium text-slate-900">{item.assetName}</p>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </td>
                  <td className="px-3 py-3">{item.issue}</td>
                  <td className="px-3 py-3">
                    <p>{item.reportedAt}</p>
                    <p className="text-xs text-slate-500">Fällig: {item.dueDate}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={item.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-xs text-slate-600">{item.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 lg:hidden">
          {maintenanceItems.map((item) => (
            <article key={`mobile-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{item.assetName}</p>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.location}</p>
              <p className="mt-2 text-sm text-slate-700">{item.issue}</p>
              <p className="mt-1 text-xs text-slate-500">
                Gemeldet: {item.reportedAt} • Fällig: {item.dueDate}
              </p>
              <div className="mt-2">
                <StatusBadge value={item.priority} />
              </div>
              <p className="mt-2 text-xs text-slate-600">{item.comment}</p>
            </article>
          ))}
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card animate-fade-up lg:col-span-2">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <AlertCircle className="h-4 w-4" />
            Defektmeldung erfassen
          </h3>
          <div className="mt-3 grid gap-3">
            <input
              className="field-input"
              placeholder="Asset-ID oder Name"
              value={assetName}
              onChange={(event) => setAssetName(event.target.value)}
            />
            <input
              className="field-input"
              placeholder="Problemkurztext"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
            />
            <textarea
              className="field-input min-h-[90px]"
              placeholder="Detailierte Fehlerbeschreibung"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <label className="field">
              Optionales Foto
              <input className="field-input py-2" type="file" accept="image/*" />
            </label>
            <button
              className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              onClick={() => {
                if (!assetName.trim() || !issue.trim()) return;
                onCreateMaintenance({ assetName: assetName.trim(), issue: issue.trim(), comment: comment.trim() });
                setAssetName('');
                setIssue('');
                setComment('');
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

