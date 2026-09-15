import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Users, Check, X, ArrowLeft, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui';
import { apiGet, apiSend, inviteLink } from '../lib/api';



export default function JoinTeam() {
  const { code = '' } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!code) { setState('error'); setErr('No team code provided.'); return; }
    apiGet(`/api/teams?code=${encodeURIComponent(code)}`)
      .then((t) => { setTeam(t); setState('ready'); })
      .catch((e) => { setState('error'); setErr(e instanceof Error ? e.message : 'Team not found'); });
  }, [code]);

  const doJoin = async () => {
    if (!user || !team) return;
    setBusy(true); setErr(null);
    try {
      await apiSend('/api/teams', 'POST', { action: 'join', code: team.code, user_id: user.id });
      setDone(`You joined ${team.name}. Redirecting to your dashboard…`);
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not join team'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-lg border border-ink/12 bg-white/70">
        <div className="border-b border-ink/10 px-6 py-4 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/55 hover:text-wine">
            <ArrowLeft size={13} /> Startup Street XI
          </Link>
        </div>
        <div className="px-6 py-8 sm:px-8">
          {loading || state === 'loading' ? (
            <Loader label="Finding your team" />
          ) : state === 'error' || !team ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-wine">Invite invalid</p>
              <h1 className="font-display mt-3 text-3xl">We couldn't find that team.</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{err || 'The Team Code may be mistyped or the team may have been disbanded. Ask your team leader for a fresh invite link.'}</p>
              <Link to="/dashboard" className="mt-6 inline-block bg-ink px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-paper">Go to dashboard</Link>
            </>
          ) : !user ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-wine">Team invite · {team.code}</p>
              <h1 className="font-display mt-3 text-4xl tracking-tight">You've been invited to {team.name}.</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">
                {team.member_count} of {team.team_max} seats filled. Sign in or create your participant account first —
                you'll return here to accept the invite. Nothing is auto-joined.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <Link to={`/login?next=${encodeURIComponent(`/join-team/${team.code}`)}`} className="flex-1 bg-wine px-6 py-3 text-center text-[12px] font-bold uppercase tracking-[0.16em] text-paper hover:bg-wine-deep">
                  Login / Register to continue
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-wine"><Users size={13} /> Team invite · {team.code}</p>
              <h1 className="font-display mt-3 text-4xl tracking-tight">Join {team.name}?</h1>
              <div className="mt-4 border border-ink/12 bg-cream/60 p-4">
                <p className="text-[13px] text-ink/65">{team.member_count} of {team.team_max} seats filled · {team.members.length} member{team.members.length === 1 ? '' : 's'}:</p>
                <ul className="mt-2.5 space-y-1.5">
                  {team.members.map((m) => (
                    <li key={m.user_id} className="flex items-center gap-2 text-sm">
                      <span className={`flex h-7 w-7 items-center justify-center font-display text-xs italic ${m.user_id === team.leader_id ? 'bg-wine text-paper' : 'bg-beige/70 text-ink'}`}>
                        {(m.profile?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className="font-medium">{m.profile?.name || 'Member'}</span>
                      {m.user_id === team.leader_id && <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-wine">Leader</span>}
                    </li>
                  ))}
                </ul>
              </div>
              {err && <p className="mt-4 border border-wine/30 bg-wine/5 px-3.5 py-2.5 text-[13px] text-wine">{err}</p>}
              {done ? (
                <p className="mt-4 border border-emerald-700/25 bg-emerald-50 px-3.5 py-2.5 text-[13px] text-emerald-900">{done}</p>
              ) : (
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                  <button onClick={doJoin} disabled={busy || team.member_count >= team.team_max} className="inline-flex flex-1 items-center justify-center gap-2 bg-wine px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-paper hover:bg-wine-deep disabled:opacity-50">
                    <Check size={15} /> Join team
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="inline-flex flex-1 items-center justify-center gap-2 border border-ink/25 px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] hover:border-wine hover:text-wine">
                    <X size={15} /> Decline
                  </button>
                </div>
              )}
              {team.member_count >= team.team_max && <p className="mt-3 text-[13px] text-wine">This team is full ({team.team_max} members).</p>}
              <button onClick={() => navigator.clipboard?.writeText(inviteLink(team.code)).catch(() => {})} className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-wine">
                <Copy size={12} /> Copy invite link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
