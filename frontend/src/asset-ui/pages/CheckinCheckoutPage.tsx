import { ClipboardCheck, Handshake, Undo2 } from 'lucide-react';
import type { Asset } from '../types';

type CheckinCheckoutPageProps = {
  assets: Asset[];
};

export function CheckinCheckoutPage({ assets }: CheckinCheckoutPageProps) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Check-out / Check-in</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Ausgabe und Ruecknahme</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dokumentiere Ausgabe, geplante Rueckgabe und Zustand bei Ruecknahme.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Handshake className="h-4 w-4" />
            Check-out
          </h3>
          <div className="mt-4 grid gap-3">
            <label className="field">
              Asset auswaehlen
              <select className="field-input">
                {assets.map((asset) => (
                  <option key={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Mitarbeiter / Team / Veranstaltung
              <input className="field-input" placeholder="z. B. Event-Team Nord / Messe Koeln" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Ausgabe-Datum
                <input type="date" className="field-input" defaultValue="2026-03-09" />
              </label>
              <label className="field">
                Geplante Rueckgabe
                <input type="date" className="field-input" defaultValue="2026-03-12" />
              </label>
            </div>
            <label className="field">
              Notiz
              <textarea className="field-input min-h-[96px]" placeholder="Transporthinweise, Zubehoer, Besonderheiten" />
            </label>
            <button className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto">
              Ausgabe speichern
            </button>
          </div>
        </article>

        <article className="surface-card animate-fade-up">
          <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
            <Undo2 className="h-4 w-4" />
            Check-in
          </h3>
          <div className="mt-4 grid gap-3">
            <label className="field">
              Asset auswaehlen
              <select className="field-input">
                {assets.map((asset) => (
                  <option key={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Geplante Rueckgabe
                <input type="date" className="field-input" defaultValue="2026-03-10" />
              </label>
              <label className="field">
                Tatsaechliche Rueckgabe
                <input type="date" className="field-input" defaultValue="2026-03-09" />
              </label>
            </div>
            <label className="field">
              Zustand bei Rueckgabe
              <textarea
                className="field-input min-h-[96px]"
                placeholder="Kurzer Zustandsbericht inkl. Sichtpruefung"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked />
                Vollstaendig
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" />
                Beschaedigt
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked />
                Geprueft
              </label>
            </div>
            <button className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto">
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Ruecknahme speichern
              </span>
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
