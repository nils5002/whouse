import { ClipboardCheck, Handshake, ScanLine, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QrScannerDialog } from '../components/QrScannerDialog';
import { resolveAssetByScan } from '../qr';
import { useAppDialog } from '../../components/dialogs/AppDialogProvider';
import type { Asset } from '../types';

type CheckinCheckoutPageProps = {
  assets: Asset[];
  onCheckout: (payload: { assetId: string; assignee: string; dueDate: string; note: string }) => void;
  onCheckin: (payload: { assetId: string; condition: string }) => void;
};

export function CheckinCheckoutPage({ assets, onCheckout, onCheckin }: CheckinCheckoutPageProps) {
  const { alert } = useAppDialog();
  const today = new Date().toISOString().slice(0, 10);
  const plusTwoDays = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const [checkoutAssetId, setCheckoutAssetId] = useState<string>(assets[0]?.id ?? '');
  const [checkoutAssignee, setCheckoutAssignee] = useState('');
  const [checkoutDueDate, setCheckoutDueDate] = useState(plusTwoDays);
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutScan, setCheckoutScan] = useState('');
  const [checkinAssetId, setCheckinAssetId] = useState<string>(assets[0]?.id ?? '');
  const [checkinCondition, setCheckinCondition] = useState('');
  const [checkinScan, setCheckinScan] = useState('');
  const [scannerTarget, setScannerTarget] = useState<'checkout' | 'checkin' | null>(null);

  useEffect(() => {
    if (!assets.length) {
      setCheckoutAssetId('');
      setCheckinAssetId('');
      return;
    }
    if (!assets.some((asset) => asset.id === checkoutAssetId)) {
      setCheckoutAssetId(assets[0].id);
    }
    if (!assets.some((asset) => asset.id === checkinAssetId)) {
      setCheckinAssetId(assets[0].id);
    }
  }, [assets, checkoutAssetId, checkinAssetId]);

  const applyCheckoutScan = async () => {
    const asset = resolveAssetByScan(checkoutScan, assets);
    if (!asset) {
      await alert({
        title: 'Scan fehlgeschlagen',
        message: 'QR-Code nicht erkannt. Bitte erneut scannen oder Inventarnummer nutzen.',
      });
      return;
    }
    setCheckoutAssetId(asset.id);
  };

  const applyCheckinScan = async () => {
    const asset = resolveAssetByScan(checkinScan, assets);
    if (!asset) {
      await alert({
        title: 'Scan fehlgeschlagen',
        message: 'QR-Code nicht erkannt. Bitte erneut scannen oder Inventarnummer nutzen.',
      });
      return;
    }
    setCheckinAssetId(asset.id);
  };

  const detectCheckout = () => {
    if (checkoutScan.trim()) {
      void applyCheckoutScan();
      return;
    }
    setScannerTarget('checkout');
  };

  const detectCheckin = () => {
    if (checkinScan.trim()) {
      void applyCheckinScan();
      return;
    }
    setScannerTarget('checkin');
  };

  const onDetectedByCamera = (value: string) => {
    if (scannerTarget === 'checkout') {
      setCheckoutScan(value);
      const asset = resolveAssetByScan(value, assets);
      if (asset) {
        setCheckoutAssetId(asset.id);
      } else {
        void alert({
          title: 'Scan erkannt',
          message: 'QR-Code erkannt, aber kein passendes Asset gefunden.',
        });
      }
    }
    if (scannerTarget === 'checkin') {
      setCheckinScan(value);
      const asset = resolveAssetByScan(value, assets);
      if (asset) {
        setCheckinAssetId(asset.id);
      } else {
        void alert({
          title: 'Scan erkannt',
          message: 'QR-Code erkannt, aber kein passendes Asset gefunden.',
        });
      }
    }
    setScannerTarget(null);
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Ein-/Auslagerung</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Ausgabe und Rückgabe</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dokumentiere Ausgabe, geplante Rückgabe und Zustand bei Rücknahme.
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
              QR scannen (Check-out)
              <div className="flex gap-2">
                <input
                  className="field-input"
                  placeholder="Scan-Text einfügen oder leer lassen für Kamera"
                  value={checkoutScan}
                  onChange={(event) => setCheckoutScan(event.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  onClick={detectCheckout}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  Erkennen
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Tipp: Auf iPhone Feld leer lassen und <span className="font-medium">Erkennen</span> drücken.
              </p>
            </label>
            <label className="field">
              Asset auswählen
              <select
                className="field-input"
                value={checkoutAssetId}
                onChange={(event) => setCheckoutAssetId(event.target.value)}
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Mitarbeiter / Team / Veranstaltung
              <input
                className="field-input"
                placeholder="z. B. Event-Team Nord / Messe Köln"
                value={checkoutAssignee}
                onChange={(event) => setCheckoutAssignee(event.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Ausgabe-Datum
                <input type="date" className="field-input" defaultValue={today} />
              </label>
              <label className="field">
                Geplante Rückgabe
                <input
                  type="date"
                  className="field-input"
                  value={checkoutDueDate}
                  onChange={(event) => setCheckoutDueDate(event.target.value)}
                />
              </label>
            </div>
            <label className="field">
              Notiz
              <textarea
                className="field-input min-h-[96px]"
                placeholder="Transporthinweise, Zubehör, Besonderheiten"
                value={checkoutNote}
                onChange={(event) => setCheckoutNote(event.target.value)}
              />
            </label>
            <button
              className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto"
              onClick={() => {
                if (!checkoutAssetId) return;
                onCheckout({
                  assetId: checkoutAssetId,
                  assignee: checkoutAssignee.trim() || 'Nicht angegeben',
                  dueDate: checkoutDueDate,
                  note: checkoutNote.trim(),
                });
                setCheckoutAssignee('');
                setCheckoutNote('');
                setCheckoutScan('');
              }}
            >
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
              QR scannen (Check-in)
              <div className="flex gap-2">
                <input
                  className="field-input"
                  placeholder="Scan-Text einfügen oder leer lassen für Kamera"
                  value={checkinScan}
                  onChange={(event) => setCheckinScan(event.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  onClick={detectCheckin}
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  Erkennen
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Tipp: Auf iPhone Feld leer lassen und <span className="font-medium">Erkennen</span> drücken.
              </p>
            </label>
            <label className="field">
              Asset auswählen
              <select
                className="field-input"
                value={checkinAssetId}
                onChange={(event) => setCheckinAssetId(event.target.value)}
              >
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field">
                Geplante Rückgabe
                <input type="date" className="field-input" defaultValue={checkoutDueDate} />
              </label>
              <label className="field">
                Tatsächliche Rückgabe
                <input type="date" className="field-input" defaultValue={today} />
              </label>
            </div>
            <label className="field">
              Zustand bei Rückgabe
              <textarea
                className="field-input min-h-[96px]"
                placeholder="Kurzer Zustandsbericht inkl. Sichtprüfung"
                value={checkinCondition}
                onChange={(event) => setCheckinCondition(event.target.value)}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked />
                Vollständig
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" />
                Beschädigt
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked />
                Geprüft
              </label>
            </div>
            <button
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
              onClick={() => {
                if (!checkinAssetId) return;
                onCheckin({
                  assetId: checkinAssetId,
                  condition: checkinCondition.trim() || 'Zustand geprüft.',
                });
                setCheckinCondition('');
                setCheckinScan('');
              }}
            >
              <span className="inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Rücknahme speichern
              </span>
            </button>
          </div>
        </article>
      </div>
      {scannerTarget ? (
        <QrScannerDialog
          title={scannerTarget === 'checkout' ? 'Check-out QR scannen' : 'Check-in QR scannen'}
          onDetected={onDetectedByCamera}
          onClose={() => setScannerTarget(null)}
        />
      ) : null}
    </section>
  );
}

