import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from './ui';

export default function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader label="Checking access" />
      </div>
    );
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (adminOnly && !isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <p className="font-display text-4xl text-ink">Restricted area</p>
        <p className="max-w-md text-sm text-ink/60">
          This dashboard is reserved for Startup Street XI organizers.
          {profile ? ` Your account (${profile.email}) does not have admin access.` : ' Your account does not have admin access.'}
        </p>
        <a href="/dashboard" className="bg-wine px-6 py-3 text-sm font-semibold text-paper">
          Go to participant dashboard
        </a>
      </div>
    );
  return <>{children}</>;
}
