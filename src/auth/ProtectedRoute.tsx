import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

/**
 * Gates the main app:
 * - not signed in  -> /login
 * - signed in but not approved (and not admin) -> /pending
 * Admins and approved users pass through.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready, approved, isAdmin } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center py-20 text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!approved && !isAdmin) {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
