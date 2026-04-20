import { Shield, Trash2, UserPlus, Users2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppDialog } from '../../components/dialogs/AppDialogProvider';
import { StatusBadge } from '../components/StatusBadge';
import type { ActivityItem, Asset, UserItem } from '../types';

type UserFormState = {
  id?: string;
  name: string;
  email: string;
  role: UserItem['role'];
  status: UserItem['status'];
  department: string;
  location: string;
};

function emptyUserForm(): UserFormState {
  return {
    name: '',
    email: '',
    role: 'Mitarbeiter',
    status: 'Aktiv',
    department: '',
    location: '',
  };
}

export function UsersPage({
  users,
  currentUserId,
  assets,
  activities,
  onOpenInventoryWithQuery,
  onInviteUser,
  onEditUser,
  onDeleteUser,
}: {
  users: UserItem[];
  currentUserId: string;
  assets: Asset[];
  activities: ActivityItem[];
  onOpenInventoryWithQuery: (query: string) => void;
  onInviteUser: (payload: {
    name: string;
    email: string;
    role: UserItem['role'];
    status: UserItem['status'];
    department?: string;
    location?: string;
  }) => Promise<void>;
  onEditUser: (payload: {
    id: string;
    name: string;
    email: string;
    role: UserItem['role'];
    status: UserItem['status'];
    department?: string;
    location?: string;
  }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}) {
  const { confirm, alert } = useAppDialog();
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyUserForm());

  const adminCount = users.filter((user) => user.role === 'Admin').length;
  const activeCount = users.filter((user) => user.status === 'Aktiv').length;
  const loanedAssets = assets.filter((asset) => asset.status === 'Verliehen' && asset.assignedTo !== '-');

  const recentActivityByUser = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    for (const user of users) {
      const related = activities
        .filter((entry) => entry.detail.toLowerCase().includes(user.name.toLowerCase()))
        .slice(0, 2);
      map.set(user.id, related);
    }
    return map;
  }, [activities, users]);

  const openCreate = () => {
    setForm(emptyUserForm());
    setError(null);
    setActionError(null);
    setFormOpen(true);
  };

  const openEdit = (user: UserItem) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department ?? '',
      location: user.location ?? '',
    });
    setError(null);
    setActionError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setSaving(false);
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Bitte Name ausfüllen.';
    if (!form.email.trim()) return 'Bitte E-Mail oder Benutzername ausfüllen.';
    return null;
  };

  const submit = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await onEditUser({
          id: form.id,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          department: form.department.trim() || undefined,
          location: form.location.trim() || undefined,
        });
      } else {
        await onInviteUser({
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          department: form.department.trim() || undefined,
          location: form.location.trim() || undefined,
        });
      }
      closeForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Benutzer konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: UserItem) => {
    if (user.id === currentUserId) {
      setActionError('Du kannst deinen eigenen Benutzer nicht löschen.');
      return;
    }

    const accepted = await confirm({
      title: 'Benutzer wirklich löschen?',
      message: `Möchtest du ${user.name} wirklich löschen? Der Benutzer wird deaktiviert und aus aktiven Listen entfernt. Diese Aktion kann in der Oberfläche nicht rückgängig gemacht werden.`,
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
    });
    if (!accepted) return;

    setDeletingUserId(user.id);
    setActionError(null);
    try {
      await onDeleteUser(user.id);
      await alert({
        title: 'Benutzer gelöscht',
        message: `${user.name} wurde deaktiviert und aus der aktiven Liste entfernt.`,
      });
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : 'Benutzer konnte nicht gelöscht werden.',
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="page-kicker">Benutzerverwaltung</p>
          <h2 className="page-title">Teamzugriff</h2>
          <p className="page-subtitle">
            Klare Rollen für Admin, Projektmanager und Mitarbeiter mit nachvollziehbarem Aktivitätsstatus.
          </p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={openCreate}>
          <UserPlus className="h-4 w-4" />
          Benutzer anlegen
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gesamt</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{users.length}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Aktive Nutzer</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{activeCount}</p>
        </div>
        <div className="surface-card p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Admins</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{adminCount}</p>
        </div>
      </div>

      <article className="surface-card animate-fade-up">
        {actionError ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="soft-scrollbar hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">E-Mail</th>
                <th className="px-3 py-2">Rolle</th>
                <th className="px-3 py-2">Abteilung / Standort</th>
                <th className="px-3 py-2">Letzte Aktivität</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="rounded-xl bg-slate-50 text-slate-700">
                  <td className="rounded-l-xl px-3 py-3">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                  </td>
                  <td className="px-3 py-3">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className="status-chip border-slate-200 bg-slate-100 text-slate-700">
                      <Shield className="h-3.5 w-3.5" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">{(user.department || '-') + ' / ' + (user.location || '-')}</td>
                  <td className="px-3 py-3">{user.lastActive}</td>
                  <td className="px-3 py-3">
                    <StatusBadge value={user.status} />
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => openEdit(user)}>
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        className="btn-secondary border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                          void removeUser(user);
                        }}
                        disabled={deletingUserId === user.id || user.id === currentUserId}
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          {user.id === currentUserId ? 'Eigener Account' : deletingUserId === user.id ? 'Lösche...' : 'Löschen'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {users.map((user) => (
            <article key={`mobile-${user.id}`} className="surface-muted p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <StatusBadge value={user.status} />
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Shield className="h-3.5 w-3.5" />
                {user.role}
              </div>
              <p className="mt-2 text-xs text-slate-500">{(user.department || '-') + ' / ' + (user.location || '-')}</p>
              <p className="mt-2 text-xs text-slate-500">Letzte Aktivität: {user.lastActive}</p>
              <button type="button" className="btn-secondary mt-3 px-2.5 py-1.5 text-xs" onClick={() => openEdit(user)}>
                Bearbeiten
              </button>
              <button
                type="button"
                className="btn-secondary mt-2 border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  void removeUser(user);
                }}
                disabled={deletingUserId === user.id || user.id === currentUserId}
              >
                <span className="inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" />
                  {user.id === currentUserId ? 'Eigener Account' : deletingUserId === user.id ? 'Lösche...' : 'Löschen'}
                </span>
              </button>
            </article>
          ))}
        </div>

        {!users.length ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            <Users2 className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2">Noch keine Benutzer vorhanden.</p>
          </div>
        ) : null}
      </article>

      <article className="surface-card animate-fade-up">
        <h3 className="text-base font-semibold text-slate-900">Zugeordnete Hardware und letzte Aktivitäten</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {users.slice(0, 6).map((user) => {
            const assigned = loanedAssets.filter((asset) => asset.assignedTo.toLowerCase().includes(user.name.toLowerCase()));
            const recent = recentActivityByUser.get(user.id) ?? [];
            return (
              <div key={`ctx-${user.id}`} className="surface-muted p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <StatusBadge value={user.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Zugeordnete Geräte: <span className="font-semibold text-slate-700">{assigned.length}</span>
                </p>
                {assigned.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {assigned.slice(0, 3).map((asset) => (
                      <button
                        type="button"
                        key={`${user.id}-${asset.id}`}
                        className="btn-secondary px-2 py-1 text-xs"
                        onClick={() => onOpenInventoryWithQuery(asset.name)}
                      >
                        {asset.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">Keine aktuelle Ausleihe.</p>
                )}
                {recent.length ? (
                  <ul className="mt-2 space-y-1">
                    {recent.map((entry) => (
                      <li key={entry.id} className="text-xs text-slate-600">
                        {entry.title}: {entry.detail}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </article>

      {formOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/55 p-3 sm:items-center">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-panel sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Benutzerverwaltung</p>
                <h3 className="text-lg font-semibold text-slate-900">{form.id ? 'Benutzer bearbeiten' : 'Benutzer anlegen'}</h3>
              </div>
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={closeForm}>
                Schließen
              </button>
            </div>

            {error ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            ) : null}

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Grunddaten</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="field">
                    Name *
                    <input
                      className="field-input"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    E-Mail / Benutzername *
                    <input
                      className="field-input"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Rolle und Zugriff</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="field">
                    Rolle
                    <select
                      className="field-input"
                      value={form.role}
                      onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserItem['role'] }))}
                    >
                      <option value="Admin">Admin / Techniker</option>
                      <option value="Projektmanager">Projektmanager</option>
                      <option value="Mitarbeiter">Mitarbeiter / Junior</option>
                      <option value="Junior">Junior</option>
                    </select>
                  </label>
                  <label className="field">
                    Status
                    <select
                      className="field-input"
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as UserItem['status'] }))}
                    >
                      <option value="Aktiv">Aktiv</option>
                      <option value="Inaktiv">Inaktiv</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h4 className="text-sm font-semibold text-slate-900">Organisation</h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="field">
                    Abteilung
                    <input
                      className="field-input"
                      value={form.department}
                      onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                    />
                  </label>
                  <label className="field">
                    Standort
                    <input
                      className="field-input"
                      value={form.location}
                      onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-white pt-3">
              <button type="button" className="btn-secondary" onClick={closeForm}>
                Abbrechen
              </button>
              <button type="button" className="btn-primary" onClick={() => void submit()} disabled={saving}>
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
