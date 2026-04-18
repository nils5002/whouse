import type { Asset } from '../types';

const CATEGORY_ORDER = [
  'iPads',
  'Notebooks',
  'Smartphones',
  'QR-Code-Scanner',
  'Handhelds',
  'Drucker',
  'Kartendrucker',
  'Switches',
  'Router',
  'LTE-Router',
];

type CategoriesPageProps = {
  assets: Asset[];
};

export function CategoriesPage({ assets }: CategoriesPageProps) {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    counts.set(asset.category, (counts.get(asset.category) ?? 0) + 1);
  }

  const rows = CATEGORY_ORDER.map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }));

  const uncategorized = Array.from(counts.entries())
    .filter(([category]) => !CATEGORY_ORDER.includes(category))
    .map(([category, count]) => ({ category, count }));

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Kategorien</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Gerätearten</h2>
        <p className="mt-1 text-sm text-slate-500">
          Einheitliche Kategorisierung für Import, Inventar und Auswertungen.
        </p>
      </div>

      <article className="surface-card animate-fade-up">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {rows.map((item) => (
            <div key={item.category} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{item.count}</p>
            </div>
          ))}
        </div>
      </article>

      {uncategorized.length ? (
        <article className="surface-card animate-fade-up">
          <h3 className="text-base font-semibold text-slate-900">Nicht zugeordnete Kategorien</h3>
          <p className="mt-1 text-sm text-slate-500">
            Diese Werte stammen aus Alt-Daten und sollten langfristig bereinigt werden.
          </p>
          <ul className="mt-3 space-y-2">
            {uncategorized.map((item) => (
              <li
                key={item.category}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-amber-900">{item.category}</span>
                <span className="text-amber-700">{item.count}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}

