import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { friendlyAuthError } from '../auth/authErrors';
import { AuthShell } from '../components/AuthShell';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Habit Tracker" subtitle="Sign in to track your habits">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl">
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <label className="mb-1 block text-sm font-medium text-slate-600">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-green-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-green-600">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
