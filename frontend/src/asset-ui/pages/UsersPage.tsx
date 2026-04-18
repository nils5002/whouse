import { Shield, UserPlus } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import type { UserItem } from '../types';

export function UsersPage({ users, onInviteUser }: { users: UserItem[]; onInviteUser: () => void }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Benutzerverwaltung</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Teamzugriff</h2>
          <p className="mt-1 text-sm text-slate-500">
            Schlankes Rollenmodell mit Admin und Mitarbeiter sowie Aktiv/Inaktiv-Status.
          </p>
        </div>
        <button
          className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-auto"
          onClick={onInviteUser}
        >
          <span className="inline-flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Benutzer einladen
          </span>
        </button>
      </div>

      <article className="surface-card animate-fade-up">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">E-Mail</th>
                <th className="px-3 py-2">Rolle</th>
                <th className="px-3 py-2">Abteilung / Standort</th>
                <th className="px-3 py-2">Letzte Aktivität</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="rounded-xl bg-slate-50 text-slate-700">
                  <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">{user.name}</td>
                  <td className="px-3 py-3">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <Shield className="h-3.5 w-3.5" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {(user.department || '-') + ' / ' + (user.location || '-')}
                  </td>
                  <td className="px-3 py-3">{user.lastActive}</td>
                  <td className="rounded-r-xl px-3 py-3">
                    <StatusBadge value={user.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {users.map((user) => (
            <article key={`mobile-${user.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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
              <p className="mt-2 text-xs text-slate-500">
                {(user.department || '-') + ' / ' + (user.location || '-')}
              </p>
              <p className="mt-2 text-xs text-slate-500">Letzte Aktivität: {user.lastActive}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

