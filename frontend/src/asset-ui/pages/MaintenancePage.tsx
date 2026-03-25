import { AlertCircle, Wrench } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import type { MaintenanceItem } from '../types';

type MaintenancePageProps = {
  maintenanceItems: MaintenanceItem[];
};

export function MaintenancePage({ maintenanceItems }: MaintenancePageProps) {
  const criticalOpen = maintenanceItems.filter(
    (item) => item.priority === 'Kritisch' && item.status !== 'Abgeschlossen',
  ).length;
  const waitingParts = maintenanceItems.filter((item) => item.status === 'Wartet auf Teile').length;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Wartung / Defekte</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Service Queue</h2>
          <p className="mt-1 text-sm text-slate-500">
            Priorisiere gemeldete Schaeden und steuere Reparaturfortschritte.
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-xs text-rose-700">Kritisch offen</p>
            <p className="text-lg font-semibold text-rose-800">{criticalOpen}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-700">Wartet auf Teile</p>
            <p className="text-lg font-semibold text-amber-800">{waitingParts}</p>
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
                <th className="px-3 py-2">Wartungsdatum</th>
                <th className="px-3 py-2">Prioritaet</th>
                <th className="px-3 py-2">Reparaturstatus</th>
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
                    <p className="text-xs text-slate-500">Faellig: {item.dueDate}</p>
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
                Gemeldet: {item.reportedAt} • Faellig: {item.dueDate}
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
        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Wrench className="h-4 w-4" />
            Aktionsempfehlungen
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg bg-slate-50 px-3 py-2">Dell Latitude 7440 priorisiert an externen Service senden.</li>
            <li className="rounded-lg bg-slate-50 px-3 py-2">Epson Tonerlieferung pruefen und Einbaufenster setzen.</li>
            <li className="rounded-lg bg-slate-50 px-3 py-2">Verlustfall Brother ADS mit Logistikpartner eskalieren.</li>
          </ul>
        </article>

        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <AlertCircle className="h-4 w-4" />
            Defektmeldung erfassen
          </h3>
          <div className="mt-3 grid gap-3">
            <input className="field-input" placeholder="Asset-ID oder Name" />
            <input className="field-input" placeholder="Problemkurztext" />
            <textarea className="field-input min-h-[90px]" placeholder="Detailierte Fehlerbeschreibung" />
            <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Meldung anlegen
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
