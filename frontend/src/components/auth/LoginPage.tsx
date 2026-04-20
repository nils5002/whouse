import { Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';

type LoginPageProps = {
  onLogin: (payload: { identifier: string; password: string }) => Promise<void>;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!identifier.trim() || !password.trim()) {
      setError('Bitte Benutzername/E-Mail und Passwort eingeben.');
      return;
    }
    setBusy(true);
    try {
      await onLogin({ identifier: identifier.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-brand-200/55 blur-3xl" />
        <div className="absolute right-0 top-16 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
        <div className="surface-card w-full p-5 sm:p-6">
          <p className="page-kicker">Hardware WMS</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Anmelden</h1>
          <p className="mt-1 text-sm text-slate-500">Mit deinem Benutzerkonto einloggen.</p>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            <label className="field">
              E-Mail oder Benutzername
              <input
                className="field-input"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                autoFocus
              />
            </label>
            <label className="field">
              Passwort
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Anmeldung läuft...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Standardpasswort für bestehende Benutzer: <span className="font-semibold">Willkommen123!</span>
          </div>
        </div>
      </main>
    </div>
  );
}
