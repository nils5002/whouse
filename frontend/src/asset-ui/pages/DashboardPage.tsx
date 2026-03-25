import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Wrench,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { StatusBadge } from '../components/StatusBadge';
import type { ActivityItem, Asset, MaintenanceItem, ReservationItem } from '../types';

type DashboardPageProps = {
  assets: Asset[];
  activities: ActivityItem[];
  reservations: ReservationItem[];
  maintenanceItems: MaintenanceItem[];
};

export function DashboardPage({
  assets,
  activities,
  reservations,
  maintenanceItems,
}: DashboardPageProps) {
  const totalAssets = assets.length;
  const available = assets.filter((asset) => asset.status === 'Verfuegbar').length;
  const reserved = assets.filter((asset) => asset.status === 'Reserviert').length;
  const inUse = assets.filter((asset) => ['Ausgegeben', 'Unterwegs'].includes(asset.status)).length;
  const inMaintenance = assets.filter((asset) => asset.status === 'In Wartung').length;
  const overdue = assets.filter((asset) => asset.nextReturn.includes('ueberfaellig')).length;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Dashboard</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Operativer Ueberblick</h2>
        <p className="mt-1 text-sm text-slate-500">
          Echtzeitstatus fuer Inventar, Reservierungen, Rueckgaben und Wartung.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Gesamtanzahl Assets"
          value={String(totalAssets)}
          trend="Aktiver Bestand in allen Standorten"
          tone="neutral"
          icon={Boxes}
        />
        <KpiCard
          title="Verfuegbar"
          value={String(available)}
          trend="Sofort einsatzbereit"
          tone="positive"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Reserviert"
          value={String(reserved)}
          trend="In den naechsten 72h geplant"
          tone="warning"
          icon={CalendarClock}
        />
        <KpiCard
          title="Im Einsatz"
          value={String(inUse)}
          trend="Ausgegeben oder unterwegs"
          tone="neutral"
          icon={CircleDashed}
        />
        <KpiCard
          title="In Wartung"
          value={String(inMaintenance)}
          trend="Aktiv in Reparatur oder Pruefung"
          tone="warning"
          icon={Wrench}
        />
        <KpiCard
          title="Ueberfaellig zurueckzugeben"
          value={String(overdue)}
          trend="Rueckgabe sofort verfolgen"
          tone="critical"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <article className="surface-card animate-fade-up xl:col-span-5">
          <h3 className="text-base font-semibold text-slate-900">Heutige Aktivitaeten</h3>
          <ul className="mt-4 space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/60"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                  <span className="text-xs text-slate-500">{activity.timestamp}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{activity.detail}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card animate-fade-up xl:col-span-4">
          <h3 className="text-base font-semibold text-slate-900">Bevorstehende Rueckgaben</h3>
          <div className="mt-3 space-y-2">
            {assets
              .filter((asset) => asset.nextReturn !== '-')
              .slice(0, 5)
              .map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-500">{asset.assignedTo}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{asset.nextReturn}</p>
                </div>
              ))}
          </div>
        </article>

        <article className="surface-card animate-fade-up xl:col-span-3">
          <h3 className="text-base font-semibold text-slate-900">Neueste Reservierungen</h3>
          <div className="mt-3 space-y-2">
            {reservations.slice(0, 4).map((reservation) => (
              <div key={reservation.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{reservation.team}</p>
                  <StatusBadge value={reservation.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{reservation.period}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card animate-fade-up xl:col-span-12">
          <h3 className="text-base font-semibold text-slate-900">Wartungen / Defekte</h3>
          <div className="mt-3 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[650px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Asset</th>
                  <th className="px-3 py-2">Problem</th>
                  <th className="px-3 py-2">Prioritaet</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Faellig</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceItems.map((item) => (
                  <tr key={item.id} className="rounded-xl bg-slate-50 text-slate-700">
                    <td className="rounded-l-xl px-3 py-2.5 font-medium text-slate-900">{item.assetName}</td>
                    <td className="px-3 py-2.5">{item.issue}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={item.priority} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge value={item.status} />
                    </td>
                    <td className="rounded-r-xl px-3 py-2.5">{item.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 md:hidden">
            {maintenanceItems.map((item) => (
              <article key={`mobile-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.assetName}</p>
                  <StatusBadge value={item.status} />
                </div>
                <p className="mt-1 text-xs text-slate-600">{item.issue}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <StatusBadge value={item.priority} />
                  <span>Faellig: {item.dueDate}</span>
                </div>
              </article>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
