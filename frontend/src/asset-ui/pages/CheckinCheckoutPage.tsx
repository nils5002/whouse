import { ChevronDown, ChevronUp, ClipboardCheck, Handshake, ScanLine, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDialog } from '../../components/dialogs/AppDialogProvider';
import { listPlannings, type PlanningListItem } from '../../services/wmsApi';
import { resolveAssetByScan } from '../qr';
import { QrScannerDialog } from '../components/QrScannerDialog';
import { StatusBadge } from '../components/StatusBadge';
import type { AppRole, Asset, UserItem } from '../types';

type CheckinCheckoutPageProps = {
  assets: Asset[];
  users: UserItem[];
  activeRole: AppRole;
  projectContext: string;
  onProjectContextChange: (value: string) => void;
  onCheckout: (payload: {
    assetId: string;
    assignee: string;
    projectName?: string;
    bookedBy?: string;
    dueDate: string;
    note: string;
  }) => void;
  onCheckin: (payload: { assetId: string; condition: string; returnedBy?: string; projectName?: string }) => void;
};

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseProjectFromAsset(asset: Asset): string {
  const projectLine = asset.notes
    .split('\n')
    .reverse()
    .find((line) => line.trim().toLowerCase().startsWith('projekt:'));
  if (!projectLine) return '';
  return projectLine.replace(/^projekt:\s*/i, '').trim();
}

function parseProjectFromAssignedTo(asset: Asset): string {
  const parts = asset.assignedTo.split('·').map((item) => item.trim()).filter(Boolean);
  if (parts.length < 2) return '';
  return parts[parts.length - 1];
}

export function CheckinCheckoutPage({
  assets,
  users,
  activeRole,
  projectContext,
  onProjectContextChange,
  onCheckout,
  onCheckin,
}: CheckinCheckoutPageProps) {
  const { alert } = useAppDialog();
  const today = useMemo(() => toIsoDate(new Date()), []);
  const plusTwoDays = useMemo(() => toIsoDate(new Date(Date.now() + 2 * 86400000)), []);

  const [checkoutAssetId, setCheckoutAssetId] = useState<string>(assets[0]?.id ?? '');
  const [checkoutAssignee, setCheckoutAssignee] = useState('');
  const [checkoutProject, setCheckoutProject] = useState('');
  const [checkoutBookedBy, setCheckoutBookedBy] = useState('Lager');
  const [checkoutDueDate, setCheckoutDueDate] = useState(plusTwoDays);
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutScan, setCheckoutScan] = useState('');

  const [checkinAssetId, setCheckinAssetId] = useState<string>(assets[0]?.id ?? '');
  const [checkinCondition, setCheckinCondition] = useState('');
  const [checkinReturnedBy, setCheckinReturnedBy] = useState('Lager');
  const [checkinProject, setCheckinProject] = useState('');
  const [checkinScan, setCheckinScan] = useState('');
  const [scannerTarget, setScannerTarget] = useState<'checkout' | 'checkin' | null>(null);
  const [showCheckoutOptions, setShowCheckoutOptions] = useState(false);
  const [showCheckinOptions, setShowCheckinOptions] = useState(false);
  const [planningProjects, setPlanningProjects] = useState<PlanningListItem[]>([]);
  const [preferAutoFocus, setPreferAutoFocus] = useState(false);
  const checkoutScanRef = useRef<HTMLInputElement | null>(null);
  const checkoutPersonRef = useRef<HTMLInputElement | null>(null);
  const checkoutProjectRef = useRef<HTMLInputElement | null>(null);
  const checkoutSubmitRef = useRef<HTMLButtonElement | null>(null);
  const checkinScanRef = useRef<HTMLInputElement | null>(null);
  const checkinProjectRef = useRef<HTMLInputElement | null>(null);
  const checkinSubmitRef = useRef<HTMLButtonElement | null>(null);

  const focusElement = (element: HTMLElement | null) => {
    if (!element) return;
    window.requestAnimationFrame(() => {
      element.focus();
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.select();
      }
    });
  };

  useEffect(() => {
    void (async () => {
      try {
        const planning = await listPlannings();
        setPlanningProjects(planning.filter((item) => ['Geplant', 'Bestätigt', 'Entwurf'].includes(item.status)));
      } catch {
        setPlanningProjects([]);
      }
    })();
  }, []);

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

  const checkoutAsset = assets.find((asset) => asset.id === checkoutAssetId) ?? null;
  const checkinAsset = assets.find((asset) => asset.id === checkinAssetId) ?? null;
  const checkoutContextProject = checkoutAsset
    ? parseProjectFromAsset(checkoutAsset) || parseProjectFromAssignedTo(checkoutAsset)
    : '';
  const checkinContextProject = checkinAsset
    ? parseProjectFromAsset(checkinAsset) || parseProjectFromAssignedTo(checkinAsset)
    : '';

  const userOptions = users.map((user) => user.name);
  const projectOptions = useMemo(() => {
    const options = planningProjects.map((planning) => `${planning.customerName} · ${planning.projectName}`);
    if (projectContext.trim()) {
      options.unshift(projectContext.trim());
    }
    return [...new Set(options)];
  }, [planningProjects, projectContext]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const touchLike = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    setPreferAutoFocus(!touchLike || window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    if (!preferAutoFocus) return;
    focusElement(checkoutScanRef.current);
  }, [preferAutoFocus]);

  useEffect(() => {
    if (!checkoutProject.trim() && projectContext.trim()) {
      setCheckoutProject(projectContext.trim());
    }
  }, [projectContext, checkoutProject]);

  useEffect(() => {
    if (!checkinProject.trim() && projectContext.trim()) {
      setCheckinProject(projectContext.trim());
    }
  }, [projectContext, checkinProject]);

  const applyCheckoutScan = async (): Promise<boolean> => {
    const asset = resolveAssetByScan(checkoutScan, assets);
    if (!asset) {
      await alert({
        title: 'Scan fehlgeschlagen',
        message: 'Unbekannter QR-Code. Bitte erneut scannen oder Inventarnummer nutzen.',
      });
      focusElement(checkoutScanRef.current);
      return false;
    }
    setCheckoutAssetId(asset.id);
    const parsedProject = parseProjectFromAsset(asset);
    if (parsedProject && !checkoutProject) {
      setCheckoutProject(parsedProject);
    }
    focusElement(checkoutPersonRef.current);
    return true;
  };

  const applyCheckinScan = async (): Promise<boolean> => {
    const asset = resolveAssetByScan(checkinScan, assets);
    if (!asset) {
      await alert({
        title: 'Scan fehlgeschlagen',
        message: 'Unbekannter QR-Code. Bitte erneut scannen oder Inventarnummer nutzen.',
      });
      focusElement(checkinScanRef.current);
      return false;
    }
    setCheckinAssetId(asset.id);
    const parsedProject = parseProjectFromAsset(asset);
    if (parsedProject) {
      setCheckinProject(parsedProject);
    }
    const shouldConfirmProject = !parsedProject && !checkinProject.trim() && !projectContext.trim();
    focusElement(shouldConfirmProject ? checkinProjectRef.current : checkinSubmitRef.current);
    return true;
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
        const parsedProject = parseProjectFromAsset(asset);
        if (parsedProject) setCheckoutProject(parsedProject);
        focusElement(checkoutPersonRef.current);
      } else {
        void alert({
          title: 'Scan erkannt',
          message: 'QR-Code erkannt, aber kein passendes Asset gefunden.',
        });
        focusElement(checkoutScanRef.current);
      }
    }
    if (scannerTarget === 'checkin') {
      setCheckinScan(value);
      const asset = resolveAssetByScan(value, assets);
      if (asset) {
        setCheckinAssetId(asset.id);
        const parsedProject = parseProjectFromAsset(asset);
        if (parsedProject) setCheckinProject(parsedProject);
        const shouldConfirmProject = !parsedProject && !checkinProject.trim() && !projectContext.trim();
        focusElement(shouldConfirmProject ? checkinProjectRef.current : checkinSubmitRef.current);
      } else {
        void alert({
          title: 'Scan erkannt',
          message: 'QR-Code erkannt, aber kein passendes Asset gefunden.',
        });
        focusElement(checkinScanRef.current);
      }
    }
    setScannerTarget(null);
  };

  const checkoutNow = async () => {
    if (!checkoutAssetId) {
      await alert({
        title: 'Asset fehlt',
        message: 'Bitte zuerst ein Asset für den Check-out auswählen.',
      });
      focusElement(checkoutScanRef.current);
      return;
    }
    if (!checkoutAssignee.trim()) {
      await alert({
        title: 'Person fehlt',
        message: 'Bitte Person/Mitarbeiter angeben.',
      });
      focusElement(checkoutPersonRef.current);
      return;
    }
    if (checkoutAsset?.status === 'Verliehen') {
      await alert({
        title: 'Gerät bereits vergeben',
        message: `Dieses Gerät ist aktuell bereits auf "${checkoutAsset.assignedTo}" gebucht.`,
      });
      focusElement(checkoutScanRef.current);
      return;
    }

    const normalizedProject =
      checkoutProject.trim() ||
      projectContext.trim() ||
      checkoutContextProject ||
      projectOptions[0] ||
      'Allgemeiner Einsatz';

    onCheckout({
      assetId: checkoutAssetId,
      assignee: checkoutAssignee.trim(),
      projectName: normalizedProject,
      bookedBy: checkoutBookedBy.trim() || 'Lager',
      dueDate: checkoutDueDate,
      note: checkoutNote.trim(),
    });
    setCheckoutProject(normalizedProject);
    setCheckoutAssignee('');
    setCheckoutNote('');
    setCheckoutScan('');
    focusElement(checkoutScanRef.current);
  };

  const checkinNow = async () => {
    if (!checkinAssetId) {
      await alert({
        title: 'Asset fehlt',
        message: 'Bitte zuerst ein Asset für den Check-in auswählen.',
      });
      focusElement(checkinScanRef.current);
      return;
    }
    if (checkinAsset?.status === 'Verfügbar') {
      await alert({
        title: 'Bereits zurückgegeben',
        message: 'Dieses Gerät ist bereits als verfügbar markiert.',
      });
      focusElement(checkinScanRef.current);
      return;
    }
    if (checkinContextProject && checkinProject.trim() && checkinProject.trim() !== checkinContextProject) {
      await alert({
        title: 'Falsches Projekt',
        message: `Das Gerät ist aktuell für "${checkinContextProject}" verbucht.`,
      });
      focusElement(checkinProjectRef.current);
      return;
    }

    onCheckin({
      assetId: checkinAssetId,
      condition: checkinCondition.trim() || 'Zustand geprüft.',
      returnedBy: checkinReturnedBy.trim() || 'Lager',
      projectName: checkinProject.trim() || checkinContextProject || projectContext.trim(),
    });
    setCheckinCondition('');
    setCheckinScan('');
    focusElement(checkinScanRef.current);
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="page-kicker">Ein-/Auslagerung</p>
        <h2 className="page-title">Schnellmodus Ausgabe & Rückgabe</h2>
        <p className="page-subtitle">
          Primärfluss: Scan → Person → Projekt → Buchen. Zusätzliche Angaben nur bei Bedarf.
        </p>
      </div>

      {activeRole === 'Mitarbeiter' && !projectContext.trim() ? (
        <article className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Projektkontext fehlt</p>
          <p className="mt-1">
            Für saubere Zuordnung zuerst Projektkontext setzen oder im Schritt 3 ein Projekt wählen.
          </p>
          <label className="field mt-2">
            Projektkontext (schnell setzen)
            <input
              className="field-input bg-white"
              placeholder="z. B. Kunde X · Akkreditierung 2026"
              value={projectContext}
              onChange={(event) => onProjectContextChange(event.target.value)}
            />
          </label>
        </article>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="surface-card animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <Handshake className="h-4 w-4 text-brand-700" />
              Check-out
            </h3>
            <span className="status-chip border-brand-200 bg-brand-50 text-brand-700">
              <span className="status-dot bg-brand-600" />
              Schnellmodus
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Schritt 1</p>
              <label className="field mt-1">
                Gerät scannen
                <div className="flex gap-2">
                  <input
                    ref={checkoutScanRef}
                    autoFocus={preferAutoFocus}
                    className="field-input"
                    placeholder="Scan-Text einfügen oder leer lassen für Kamera"
                    value={checkoutScan}
                    onChange={(event) => setCheckoutScan(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      void applyCheckoutScan();
                    }}
                  />
                  <button type="button" className="btn-secondary px-3 text-xs" onClick={detectCheckout}>
                    <ScanLine className="h-3.5 w-3.5" />
                    Scannen
                  </button>
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 2</p>
              <label className="field mt-1">
                Person / Mitarbeiter
                <input
                  ref={checkoutPersonRef}
                  list="checkout-person-options"
                  className="field-input"
                  placeholder="z. B. Max Mustermann"
                  value={checkoutAssignee}
                  onChange={(event) => setCheckoutAssignee(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    focusElement(checkoutProjectRef.current);
                  }}
                />
                <datalist id="checkout-person-options">
                  {userOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 3</p>
              <label className="field mt-1">
                Projekt
                <input
                  ref={checkoutProjectRef}
                  list="checkout-project-options"
                  className="field-input"
                  placeholder="Projekt wählen oder eintragen"
                  value={checkoutProject}
                  onChange={(event) => setCheckoutProject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    focusElement(checkoutSubmitRef.current);
                  }}
                />
                <datalist id="checkout-project-options">
                  {projectOptions.map((project) => (
                    <option key={project} value={project} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 4</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                <span>{checkoutAsset?.name ?? 'Kein Gerät ausgewählt'}</span>
                {checkoutAsset ? <StatusBadge value={checkoutAsset.status} /> : null}
              </div>
              <button ref={checkoutSubmitRef} className="btn-primary mt-3 w-full" onClick={() => void checkoutNow()}>
                <Handshake className="h-4 w-4" />
                Jetzt ausgeben
              </button>
            </div>

            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={() => setShowCheckoutOptions((prev) => !prev)}
            >
              {showCheckoutOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showCheckoutOptions ? 'Weniger Optionen' : 'Mehr Optionen'}
            </button>

            {showCheckoutOptions ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="field">
                  Asset auswählen (fallback)
                  <select
                    className="field-input"
                    value={checkoutAssetId}
                    onChange={(event) => setCheckoutAssetId(event.target.value)}
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="field">
                    Geplante Rückgabe
                    <input
                      type="date"
                      className="field-input"
                      value={checkoutDueDate}
                      onChange={(event) => setCheckoutDueDate(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    Gebucht durch
                    <input
                      className="field-input"
                      value={checkoutBookedBy}
                      onChange={(event) => setCheckoutBookedBy(event.target.value)}
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
              </div>
            ) : null}
          </div>
        </article>

        <article className="surface-card animate-fade-up">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
              <Undo2 className="h-4 w-4 text-slate-700" />
              Check-in
            </h3>
            <span className="status-chip border-slate-200 bg-slate-50 text-slate-700">
              <span className="status-dot bg-slate-600" />
              Schnellmodus
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 1</p>
              <label className="field mt-1">
                Gerät scannen
                <div className="flex gap-2">
                  <input
                    ref={checkinScanRef}
                    className="field-input"
                    placeholder="Scan-Text einfügen oder leer lassen für Kamera"
                    value={checkinScan}
                    onChange={(event) => setCheckinScan(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      void applyCheckinScan();
                    }}
                  />
                  <button type="button" className="btn-secondary px-3 text-xs" onClick={detectCheckin}>
                    <ScanLine className="h-3.5 w-3.5" />
                    Scannen
                  </button>
                </div>
              </label>
            </div>

            {checkinAsset ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Schritt 2</p>
                <p className="mt-1 font-semibold text-slate-900">{checkinAsset.name}</p>
                <p className="mt-1 text-slate-700">Aktuell gebucht auf: {checkinAsset.assignedTo}</p>
                <p className="text-slate-700">Projekt: {checkinContextProject || checkinProject || projectContext || '-'}</p>
                <p className="mt-1 text-xs text-slate-600">Status: <StatusBadge value={checkinAsset.status} /></p>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 3</p>
              <label className="field mt-1">
                Projekt (optional bestätigen)
                <input
                  ref={checkinProjectRef}
                  list="checkin-project-options"
                  className="field-input"
                  value={checkinProject}
                  onChange={(event) => setCheckinProject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    focusElement(checkinSubmitRef.current);
                  }}
                />
                <datalist id="checkin-project-options">
                  {projectOptions.map((project) => (
                    <option key={project} value={project} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Schritt 4</p>
              <button ref={checkinSubmitRef} className="btn-dark mt-2 w-full" onClick={() => void checkinNow()}>
                <ClipboardCheck className="h-4 w-4" />
                Rücknahme bestätigen
              </button>
              <p className="mt-2 text-xs text-slate-500">Rückgabedatum: {today}</p>
            </div>

            <button
              type="button"
              className="btn-secondary w-full justify-center"
              onClick={() => setShowCheckinOptions((prev) => !prev)}
            >
              {showCheckinOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showCheckinOptions ? 'Weniger Optionen' : 'Mehr Optionen'}
            </button>

            {showCheckinOptions ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="field">
                  Asset auswählen (fallback)
                  <select
                    className="field-input"
                    value={checkinAssetId}
                    onChange={(event) => setCheckinAssetId(event.target.value)}
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Rücknahme durch
                  <input
                    className="field-input"
                    value={checkinReturnedBy}
                    onChange={(event) => setCheckinReturnedBy(event.target.value)}
                  />
                </label>
                <label className="field">
                  Rücknahme-Notiz
                  <textarea
                    className="field-input min-h-[96px]"
                    placeholder="Kurzer Zustandsbericht (optional)"
                    value={checkinCondition}
                    onChange={(event) => setCheckinCondition(event.target.value)}
                  />
                </label>
              </div>
            ) : null}
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
