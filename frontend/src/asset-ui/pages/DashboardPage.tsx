import {
  Boxes,
  CheckCircle2,
  Handshake,
  TriangleAlert,
} from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
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
  const available = assets.filter((asset) => asset.status === 'Verfügbar').length;
  const loaned = assets.filter((asset) => asset.status === 'Verliehen').length;
  const defective = assets.filter((asset) => asset.status === 'Defekt').length;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Dashboard</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Kernübersicht</h2>
        <p className="mt-1 text-sm text-slate-500">Nur die wichtigsten Zahlen für den Tagesbetrieb.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Gesamtanzahl Assets"
          value={String(totalAssets)}
          trend="Aktiver Bestand"
          tone="neutral"
          icon={Boxes}
        />
        <KpiCard
          title="Verfügbar"
          value={String(available)}
          trend="Direkt ausleihbar"
          tone="positive"
          icon={CheckCircle2}
        />
        <KpiCard
          title="Verliehen"
          value={String(loaned)}
          trend="Aktuell ausgegeben"
          tone="warning"
          icon={Handshake}
        />
        <KpiCard
          title="Defekte Geräte"
          value={String(defective)}
          trend="Benötigen Bearbeitung"
          tone="critical"
          icon={TriangleAlert}
        />
      </div>

      <div className="grid gap-4">
        <article className="surface-card animate-fade-up">
          <h3 className="text-base font-semibold text-slate-900">Letzte Aktivitäten</h3>
          <ul className="mt-4 space-y-3">
            {activities.slice(0, 12).map((activity) => (
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
      </div>
    </section>
  );
}

