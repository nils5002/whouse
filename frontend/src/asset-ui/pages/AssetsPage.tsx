import { Filter, Plus, ScanLine, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AssetQuickView } from '../components/AssetQuickView';
import { StatusBadge } from '../components/StatusBadge';
import { useAppDialog } from '../../components/dialogs/AppDialogProvider';
import type { Asset } from '../types';

type AssetsPageProps = {
  assets: Asset[];
  initialSearch?: string;
  onOpenDetail: (assetId: string) => void;
  onCreateAsset: () => void;
  onReserveAsset: (assetId: string) => void;
  onCheckoutAsset: (assetId: string) => void;
  onCheckinAsset: (assetId: string) => void;
};

export function AssetsPage({
  assets,
  initialSearch,
  onOpenDetail,
  onCreateAsset,
  onReserveAsset,
  onCheckoutAsset,
  onCheckinAsset,
}: AssetsPageProps) {
  const { prompt, alert } = useAppDialog();
  const [search, setSearch] = useState(initialSearch ?? '');
  const [category, setCategory] = useState('Alle Kategorien');
  const [location, setLocation] = useState('Alle Standorte');
  const [status, setStatus] = useState('Alle Status');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyBroken, setOnlyBroken] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);

  const categories = ['Alle Kategorien', ...new Set(assets.map((asset) => asset.category))];
  const locations = ['Alle Standorte', ...new Set(assets.map((asset) => asset.location))];
  const statuses = ['Alle Status', ...new Set(assets.map((asset) => asset.status))];

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        const matchesSearch = [asset.name, asset.tagNumber, asset.serialNumber, asset.assignedTo]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesCategory = category === 'Alle Kategorien' || asset.category === category;
        const matchesLocation = location === 'Alle Standorte' || asset.location === location;
        const matchesStatus = status === 'Alle Status' || asset.status === status;
        const matchesAvailable = !onlyAvailable || asset.status === 'Verfügbar';
        const matchesBroken = !onlyBroken || ['Defekt', 'In Wartung'].includes(asset.status);
        return (
          matchesSearch &&
          matchesCategory &&
          matchesLocation &&
          matchesStatus &&
          matchesAvailable &&
          matchesBroken
        );
      }),
    [assets, category, location, onlyAvailable, onlyBroken, search, status],
  );

  const quickViewAsset = assets.find((asset) => asset.id === quickViewId) ?? null;

  useEffect(() => {
    setSearch(initialSearch ?? '');
  }, [initialSearch]);

  const resetFilters = () => {
    setSearch('');
    setCategory('Alle Kategorien');
    setLocation('Alle Standorte');
    setStatus('Alle Status');
    setOnlyAvailable(false);
    setOnlyBroken(false);
  };

  const openByQrOrTag = async () => {
    const input = await prompt({
      title: 'Gerät suchen',
      message: 'Inventarnummer oder Seriennummer',
      placeholder: 'z. B. IMP-... oder SN-...',
      submitLabel: 'Suchen',
    });
    if (!input?.trim()) return;
    const needle = input.trim().toLowerCase();
    const match = assets.find(
      (asset) =>
        asset.tagNumber.toLowerCase() === needle ||
        asset.serialNumber.toLowerCase() === needle,
    );
    if (!match) {
      await alert({
        title: 'Keine Übereinstimmung',
        message: 'Kein Asset mit dieser Inventar- oder Seriennummer gefunden.',
      });
      return;
    }
    setQuickViewId(match.id);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Inventar</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Gerätebestand</h2>
          <p className="mt-1 text-sm text-slate-500">Suchen, filtern und direkt bearbeiten.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <button
            className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto"
            onClick={onCreateAsset}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Asset hinzufügen
            </span>
          </button>
          <button
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            onClick={() => {
              if (filteredAssets[0]) onCheckoutAsset(filteredAssets[0].id);
            }}
          >
            Ausgeben
          </button>
          <button
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
            onClick={() => {
              if (filteredAssets[0]) onCheckinAsset(filteredAssets[0].id);
            }}
          >
            Zurücknehmen
          </button>
        </div>
      </div>

      <article className="surface-card animate-fade-up">
        <div className="grid gap-3 xl:grid-cols-12">
          <div className="relative xl:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach Asset, Inventarnummer oder Seriennummer"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none ring-brand-300 placeholder:text-slate-400 focus:ring-2"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 xl:col-span-2"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 xl:col-span-2"
          >
            {locations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 xl:col-span-2"
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 xl:col-span-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              onClick={resetFilters}
            >
              <Filter className="h-4 w-4" />
              Reset
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                void openByQrOrTag();
              }}
            >
              <ScanLine className="h-4 w-4" />
              QR
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(event) => setOnlyAvailable(event.target.checked)}
              className="rounded border-slate-300"
            />
            Nur verfügbare Assets
          </label>
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={onlyBroken}
              onChange={(event) => setOnlyBroken(event.target.checked)}
              className="rounded border-slate-300"
            />
            Nur defekte Assets
          </label>
          <p className="text-slate-500">{filteredAssets.length} Treffer</p>
        </div>

        <div className="mt-4 hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[940px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Kategorie</th>
                <th className="px-3 py-2">Standort</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Zugewiesen an</th>
                <th className="px-3 py-2">Nächste Rückgabe</th>
                <th className="px-3 py-2">QR / Inventar</th>
                <th className="px-3 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="rounded-xl bg-slate-50 text-slate-700">
                  <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">{asset.name}</td>
                  <td className="px-3 py-3">{asset.category}</td>
                  <td className="px-3 py-3">{asset.location}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={asset.status} />
                  </td>
                  <td className="px-3 py-3">{asset.assignedTo}</td>
                  <td className="px-3 py-3">{asset.nextReturn}</td>
                  <td className="px-3 py-3 font-medium">{asset.tagNumber}</td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => setQuickViewId(asset.id)}
                    >
                      Schnellansicht
                    </button>
                    <button
                      type="button"
                      className="ml-2 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                      onClick={() => onOpenDetail(asset.id)}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 lg:hidden">
          {filteredAssets.map((asset) => (
            <article key={asset.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">{asset.name}</h4>
                  <p className="text-xs text-slate-500">
                    {asset.category} • {asset.location}
                  </p>
                </div>
                <StatusBadge value={asset.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">{asset.tagNumber}</p>
                <button
                  type="button"
                  className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white"
                  onClick={() => setQuickViewId(asset.id)}
                >
                  Schnellansicht
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>

      <AssetQuickView
        asset={quickViewAsset}
        onClose={() => setQuickViewId(null)}
        onOpenDetail={onOpenDetail}
        onReserve={onReserveAsset}
        onCheckout={onCheckoutAsset}
      />
    </section>
  );
}

