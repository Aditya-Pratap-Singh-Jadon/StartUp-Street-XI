import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { inputCls, labelCls, FieldError } from '../components/ui';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperadmin, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin || isSuperadmin) navigate('/admin', { replace: true });
      else {
        setErr('Access denied. You do not have admin privileges.');
      }
    }
  }, [user, loading, isAdmin, isSuperadmin, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    const cleanEmail = email.trim().toLowerCase();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return setErr('Enter a valid email address.');
    if (password.length < 6) return setErr('Password must be at least 6 characters.');
    
    setBusy(true);
    try {
      await login(cleanEmail, password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Authentication failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-16 sm:px-10">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink/55 hover:text-wine">
          <ArrowLeft size={14} /> Back to site
        </Link>
        <h1 className="font-display mt-6 text-4xl font-medium tracking-tight sm:text-5xl">
          Organizer Login
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Sign in to access the event management console.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" type="email" className={inputCls} placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <input id="password" type="password" className={inputCls} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          
          <FieldError message={err} />
          
          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 bg-wine px-6 py-3.5 text-sm font-semibold tracking-wide text-paper transition hover:bg-wine-deep disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] leading-relaxed tracking-wide text-ink/40 uppercase">
          Startup Street XI · CSED, VIT Vellore · graVITas 2026
        </p>
      </div>
    </div>
  );
}
