import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthShell } from '../components/AuthShell';

/**
 * Shown to a signed-in user whose account has not yet been approved by the
 * admin. Automatically forwards to the app once approval comes through (the
 * `approved` flag updates live from Firestore).
 */
export function PendingApprovalPage() {
  const { user, approved, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (approved || isAdmin) navigate('/', { replace: true });
  }, [approved, isAdmin, navigate]);

  return (
    <AuthShell title="Almost there">
      <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          Waiting for approval
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
          Your account (<span className="font-medium">{user?.email}</span>) has
          been created. An admin needs to approve it before you can start
          tracking. This page will update automatically once you're approved.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </AuthShell>
  );
}
