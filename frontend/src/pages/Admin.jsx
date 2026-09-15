import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UploadCloud, CalendarClock, Megaphone, Trophy,
  Settings, Gavel, CircleHelp, LogOut, Plus, Pencil, Trash2, ArrowUp, ArrowDown,
  Search, ExternalLink, FileText, Github, Eye, EyeOff, Star, RefreshCw, UserCog,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { Loader, FieldError, inputCls, labelCls } from '../components/ui';
import { apiGet, apiSend } from '../lib/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'submissions', label: 'Submissions', icon: UploadCloud },
  { id: 'timeline', label: 'Timeline', icon: CalendarClock },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'results', label: 'Results', icon: Trophy },
  { id: 'judges', label: 'Jury', icon: Gavel },
  { id: 'faqs', label: 'FAQs', icon: CircleHelp },
  { id: 'config', label: 'Config', icon: Settings },
  { id: 'admins', label: 'Admins', icon: UserCog },
];

const POSITIONS = ['Winner', 'Runner-up', 'Recognized', 'Special Mention'];

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v) {
  if (!v) return null;
  return new Date(v).toISOString();
}

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [subs, setSubs] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [anncs, setAnncs] = useState([]);
  const [results, setResults] = useState([]);
  const [judges, setJudges] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [cfg, setCfg] = useState({});
  const [adminsList, setAdminsList] = useState([]);
  const [teamQ, setTeamQ] = useState('');
  const [subQ, setSubQ] = useState('');
  const [subFilter, setSubFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formBool, setFormBool] = useState({});
  const [busy, setBusy] = useState(false);

  const adminId = user?.id || '';
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 3500); };
  const fail = (e) => setErr(e instanceof Error ? e.message : 'Operation failed');

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true); setErr(null);
    try {
      const [s, t, sb, tl, an, r, j, f, c, adm] = await Promise.all([
        apiGet(`/api/stats?admin_id=${user.id}`),
        apiGet(`/api/teams?all=1&admin_id=${user.id}`),
        apiGet(`/api/submissions?all=1&admin_id=${user.id}`),
        apiGet('/api/timeline?all=1'),
        apiGet('/api/announcements?all=1'),
        apiGet(`/api/results?all=1&admin_id=${user.id}`),
        apiGet('/api/judges?all=1'),
        apiGet('/api/faqs?all=1'),
        apiGet('/api/config'),
        user?.role === 'superadmin' ? apiGet(`/api/admins?admin_id=${user.id}`) : Promise.resolve([]),
      ]);
      setStats(s); setTeams(t); setSubs(sb); setTimeline(tl); setAnncs(an); setResults(r); setJudges(j); setFaqs(f); setCfg(c); setAdminsList(adm);
    } catch (e) { fail(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const openNew = (defaults = {}, bools = {}) => {
    setEditing({ __new: true });
    setForm(defaults);
    setFormBool(bools);
  };
  const openEdit = (row) => {
    setEditing(row);
    const f = {};
    Object.entries(row).forEach(([k, v]) => {
      if (v === null || v === undefined) f[k] = '';
      else if (k === 'event_time' || k === 'expires_at') f[k] = toLocalInput(String(v));
      else if (typeof v === 'boolean') return;
      else f[k] = String(v);
    });
    setForm(f);
    setFormBool({ published: !!row.published, is_completed: !!row.is_completed });
  };
  const closeForm = () => { setEditing(null); setForm({}); setFormBool({}); };

  const saveRow = async () => {
    setBusy(true); setErr(null);
    try {
      if (tab === 'timeline') {
        const payload = {
          admin_id: adminId, id: editing?.__new ? undefined : editing?.id,
          title: form.title, description: form.description,
          event_time: fromLocalInput(form.event_time || ''),
          published: formBool.published !== false,
          is_completed: !!formBool.is_completed,
        };
        if (editing?.__new) await apiSend('/api/timeline', 'POST', payload);
        else await apiSend('/api/timeline', 'PUT', payload);
        setTimeline(await apiGet('/api/timeline?all=1'));
        flash('Timeline saved — participants notified instantly.');
      } else if (tab === 'announcements') {
        const payload = {
          admin_id: adminId, id: editing?.__new ? undefined : editing?.id,
          title: form.title, content: form.content, priority: form.priority || 'normal',
          published: formBool.published !== false,
          expires_at: fromLocalInput(form.expires_at || ''),
        };
        if (editing?.__new) await apiSend('/api/announcements', 'POST', payload);
        else await apiSend('/api/announcements', 'PUT', payload);
        setAnncs(await apiGet('/api/announcements?all=1'));
        flash('Announcement saved — participants notified instantly.');
      } else if (tab === 'results') {
        const payload = {
          admin_id: adminId, id: editing?.__new ? undefined : editing?.id,
          team_name: form.team_name, team_code: form.team_code, position: form.position || 'Recognized',
          category: form.category, description: form.description,
          sort_order: parseInt(form.sort_order || '0', 10), published: !!formBool.published,
        };
        if (editing?.__new) await apiSend('/api/results', 'POST', payload);
        else await apiSend('/api/results', 'PUT', payload);
        setResults(await apiGet(`/api/results?all=1&admin_id=${adminId}`));
        flash('Result saved. Publish to reveal it to participants.');
      } else if (tab === 'judges') {
        const payload = {
          admin_id: adminId, id: editing?.__new ? undefined : editing?.id,
          name: form.name, designation: form.designation, organization: form.organization,
          description: form.description, photo_url: form.photo_url,
          sort_order: parseInt(form.sort_order || '0', 10), published: formBool.published !== false,
        };
        if (editing?.__new) await apiSend('/api/judges', 'POST', payload);
        else await apiSend('/api/judges', 'PUT', payload);
        setJudges(await apiGet('/api/judges?all=1'));
        flash('Jury profile saved.');
      } else if (tab === 'faqs') {
        const payload = {
          admin_id: adminId, id: editing?.__new ? undefined : editing?.id,
          question: form.question, answer: form.answer, category: form.category || 'General',
          sort_order: parseInt(form.sort_order || '0', 10), published: formBool.published !== false,
        };
        if (editing?.__new) await apiSend('/api/faqs', 'POST', payload);
        else await apiSend('/api/faqs', 'PUT', payload);
        setFaqs(await apiGet('/api/faqs?all=1'));
        flash('FAQ saved.');
      } else if (tab === 'admins') {
        const payload = {
          admin_id: adminId, email: form.email, name: form.name, password: form.password
        };
        await apiSend('/api/admins', 'POST', payload);
        setAdminsList(await apiGet(`/api/admins?admin_id=${adminId}`));
        flash('Admin created successfully.');
      }
      closeForm();
      const s = await apiGet(`/api/stats?admin_id=${adminId}`);
      setStats(s);
    } catch (e) { fail(e); }
    finally { setBusy(false); }
  };

  const delRow = async (endpoint, id, setter, current) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setBusy(true);
    try {
      await apiSend(endpoint, 'DELETE', { admin_id: adminId, id });
      setter(current.filter((r) => r.id !== id));
      flash('Deleted.');
    } catch (e) { fail(e); }
    finally { setBusy(false); }
  };

  const moveTimeline = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= timeline.length) return;
    const order = [...timeline];
    const [item] = order.splice(idx, 1);
    order.splice(j, 0, item);
    setTimeline(order);
    try {
      await apiSend('/api/timeline', 'PUT', { admin_id: adminId, action: 'reorder', order: order.map((t) => t.id) });
      flash('Timeline order updated — participants notified.');
    } catch (e) { fail(e); fetchAll(); }
  };

  const setCurrent = async (id) => {
    try {
      await apiSend('/api/timeline', 'PUT', { admin_id: adminId, action: 'set_current', id });
      setTimeline(await apiGet('/api/timeline?all=1'));
      setStats(await apiGet(`/api/stats?admin_id=${adminId}`));
      flash('Current stage updated — participants notified.');
    } catch (e) { fail(e); }
  };

  const togglePublish = async (endpoint, row, refresh) => {
    try {
      await apiSend(endpoint, 'PUT', { admin_id: adminId, id: row.id, published: !row.published });
      await refresh();
      flash(row.published ? 'Unpublished.' : 'Published — participants notified.');
    } catch (e) { fail(e); }
  };

  const saveConfig = async () => {
    setBusy(true); setErr(null);
    try {
      const values = {};
      ['team_min', 'team_max', 'current_stage', 'event_note', 'instagram_url', 'linkedin_url', 'contact_email', 'website_url'].forEach((k) => { values[k] = form[k] ?? cfg[k] ?? ''; });
      ['allow_leave', 'submissions_open', 'allow_resubmission', 'registration_open'].forEach((k) => {
        values[k] = (formBool[k] ?? (cfg[k] === 'true')) ? 'true' : 'false';
      });
      const updated = await apiSend('/api/config', 'PUT', { admin_id: adminId, values });
      setCfg(updated);
      setStats(await apiGet(`/api/stats?admin_id=${adminId}`));
      flash('Event configuration saved. Limits apply immediately.');
    } catch (e) { fail(e); }
    finally { setBusy(false); }
  };

  const filteredTeams = teams.filter((t) => {
    const q = teamQ.trim().toLowerCase();
    if (!q) return true;
    return t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q) ||
      (t.members || []).some((m) => m.profile?.name?.toLowerCase().includes(q) || m.profile?.email?.toLowerCase().includes(q));
  });

  const submittedIds = new Set(subs.map((s) => s.team_id));
  const filteredSubs = teams
    .map((t) => ({ team: t, sub: subs.find((s) => s.team_id === t.id) || null }))
    .filter(({ team: t, sub }) => {
      const q = subQ.trim().toLowerCase();
      if (q && !(t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q))) return false;
      if (subFilter === 'submitted') return !!sub;
      if (subFilter === 'missing') return !sub;
      if (subFilter === 'github') return !!sub?.github_url;
      return true;
    })
    .sort((a, b) => {
      const at = a.sub?.created_at ? new Date(a.sub.created_at).getTime() : 0;
      const bt = b.sub?.created_at ? new Date(b.sub.created_at).getTime() : 0;
      return bt - at;
    });

  const F = ({ k, label, textarea, type }) => (
    <div>
      <label className={labelCls} htmlFor={`f-${k}`}>{label}</label>
      {textarea ? (
        <textarea id={`f-${k}`} className={`${inputCls} min-h-[96px]`} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input id={`f-${k}`} type={type || 'text'} className={inputCls} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="bg-paper px-2 py-1 font-display text-sm font-bold text-ink">SS—XI</Link>
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-paper/60">Organizer console</span>
          </div>
          <div className="flex items-center gap-2.5">
            <NotificationBell userId={adminId} dark />
            <Link to="/dashboard" className="hidden border border-paper/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-paper/80 hover:border-paper sm:inline-block">Participant view</Link>
            <button onClick={() => { signOut(); navigate('/'); }} className="inline-flex items-center gap-1.5 border border-paper/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-paper/80 hover:border-paper">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {msg && <p className="mb-4 border border-emerald-700/25 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{msg}</p>}
        {err && <p className="mb-4 border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine" role="alert">{err} <button onClick={() => setErr(null)} className="ml-2 underline">Dismiss</button></p>}

        {/* tabs */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-1.5 border-b border-ink/12 pb-px sm:flex-wrap" role="tablist" aria-label="Admin sections">
            {TABS.filter(t => (t.id !== 'results' && t.id !== 'admins') || user?.role === 'superadmin').map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { setTab(t.id); closeForm(); setErr(null); }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition ${tab === t.id ? 'bg-ink text-paper' : 'text-ink/55 hover:bg-cream hover:text-ink'}`}>
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Loader label="Loading organizer console" />
        ) : (
          <div className="mt-6">
            {tab === 'overview' && stats && (
              <div>
                <div className="grid grid-cols-2 gap-px border border-ink/12 bg-ink/12 lg:grid-cols-4">
                  {[
                    ['Registered participants', String(stats.participants ?? 0)],
                    ['Total teams', String(stats.teams ?? 0)],
                    ['Submissions', String(stats.submissions ?? 0)],
                    ['GitHub links', String(stats.github_count ?? 0)],
                    ['Pending submissions', String(stats.pending ?? 0)],
                    ['Current stage', String(stats.current_stage ?? '—')],
                    ['Team limits', `${stats.team_min}–${stats.team_max}`],
                    ['Submissions', stats.submissions_open === 'true' ? 'OPEN' : 'CLOSED'],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-paper p-5">
                      <p className="font-display truncate text-2xl sm:text-3xl" title={v}>{v}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/50">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="border border-ink/12 bg-white/70 p-5 sm:p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/55">Team-size breakdown</p>
                    {Object.keys((stats.team_size_breakdown) || {}).length === 0 ? (
                      <p className="mt-3 text-sm text-ink/50">No teams formed yet.</p>
                    ) : (
                      <div className="mt-4 space-y-2.5">
                        {Object.entries((stats.team_size_breakdown) || {}).sort().map(([size, count]) => (
                          <div key={size} className="flex items-center gap-3">
                            <span className="w-16 text-xs font-bold text-ink/60">{size} member{size === '1' ? '' : 's'}</span>
                            <div className="h-2.5 flex-1 bg-cream"><div className="h-full bg-wine" style={{ width: `${Math.min(100, (count / Math.max(1, Number(stats.teams))) * 100)}%` }} /></div>
                            <span className="w-8 text-right font-display text-lg">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border border-wine/25 bg-wine/[0.04] p-5 sm:p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-wine">Rulebook conflict — action needed</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/75">
                      Application brief requires <strong>2–5 members</strong>; Rule 2 states individuals / 2–4.
                      The platform enforces <strong>{String(stats.team_min)}–{String(stats.team_max)}</strong>. Reconcile the rulebook
                      and adjust Team limits in Config before check-in.
                    </p>
                    <button onClick={() => setTab('config')} className="mt-4 bg-wine px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-paper hover:bg-wine-deep">Open config</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'teams' && (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute top-3 left-3.5 text-ink/35" />
                    <input className={`${inputCls} pl-10`} placeholder="Search team name, code, member or email…" value={teamQ} onChange={(e) => setTeamQ(e.target.value)} />
                  </div>
                  <button onClick={fetchAll} className="inline-flex items-center gap-1.5 border border-ink/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] hover:border-wine hover:text-wine"><RefreshCw size={13} /> Refresh</button>
                </div>
                <p className="mt-3 text-xs text-ink/50">{filteredTeams.length} of {teams.length} teams</p>
                <div className="mt-3 space-y-3">
                  {filteredTeams.map((t) => (
                    <details key={t.id} className="border border-ink/12 bg-white/70">
                      <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                        <span className="font-display text-xl">{t.name}</span>
                        <span className="bg-ink px-2 py-0.5 font-mono text-[11px] font-bold tracking-widest text-paper">{t.code}</span>
                        <span className="text-xs text-ink/55">{t.member_count} member{t.member_count === 1 ? '' : 's'} · {t.leader_id ? '' : ''}leader {t.members?.find((m) => m.user_id === t.leader_id)?.profile?.name || '—'}</span>
                        {t.submission ? <span className="bg-emerald-700/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Submitted</span>
                          : <span className="border border-ink/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/50">Pending</span>}
                        {t.is_selected_for_jury && <span className="bg-wine px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-paper">Jury</span>}
                      </summary>
                      <div className="border-t border-ink/10 px-4 py-4 sm:px-5">
                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/50">Members</p>
                            <ul className="mt-2 space-y-1.5">
                              {(t.members || []).map((m) => (
                                <li key={m.user_id} className="text-[13px]">
                                  <span className="font-semibold">{m.profile?.name || m.user_id.slice(0, 8)}</span>
                                  <span className="text-ink/50"> · {m.profile?.email || ''}</span>
                                  {m.user_id === t.leader_id && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-wine">Leader</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink/50">Submission</p>
                            {t.submission ? (
                              <div className="mt-2 text-[13px]">
                                <p className="font-medium">{t.submission.file_name}</p>
                                {t.submission.github_url && <a href={t.submission.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-wine underline">{t.submission.github_url} <ExternalLink size={11} /></a>}
                                <p className="text-ink/50">{new Date(t.submission.created_at).toLocaleString('en-IN')}</p>
                              </div>
                            ) : <p className="mt-2 text-[13px] text-ink/50">No submission yet.</p>}
                            <p className="mt-2 text-[11px] text-ink/40">Created {new Date(t.created_at).toLocaleString('en-IN')}</p>
                            <div className="mt-4 border-t border-ink/10 pt-4">
                              <button onClick={async () => {
                                try {
                                  await apiSend('/api/teams', 'PUT', { admin_id: adminId, team_id: t.id, action: 'toggle_jury_selection', is_selected_for_jury: !t.is_selected_for_jury });
                                  setTeams(teams.map(x => x.id === t.id ? { ...x, is_selected_for_jury: !t.is_selected_for_jury } : x));
                                  flash(`Team ${!t.is_selected_for_jury ? 'selected for jury' : 'removed from jury'}`);
                                } catch (e) { fail(e); }
                              }} className="inline-flex items-center gap-1.5 border border-wine/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-wine hover:bg-wine hover:text-paper">
                                {t.is_selected_for_jury ? 'Remove from Jury' : 'Select for Jury'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                  {filteredTeams.length === 0 && <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No teams match your search.</p>}
                </div>
              </div>
            )}

            {tab === 'submissions' && (
              <div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute top-3 left-3.5 text-ink/35" />
                    <input className={`${inputCls} pl-10`} placeholder="Search team name or code…" value={subQ} onChange={(e) => setSubQ(e.target.value)} />
                  </div>
                  <div className="flex gap-1.5">
                    {(['all', 'submitted', 'missing', 'github']).map((f) => (
                      <button key={f} onClick={() => setSubFilter(f)} className={`px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] ${subFilter === f ? 'bg-ink text-paper' : 'border border-ink/15 text-ink/60 hover:text-ink'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto border border-ink/12 bg-white/70">
                  <table className="w-full min-w-[760px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-ink/12 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/50">
                        <th className="px-4 py-3">Team</th><th className="px-4 py-3">File</th><th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Submitted</th><th className="px-4 py-3">GitHub</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubs.map(({ team: t, sub }) => (
                        <tr key={t.id} className="border-b border-ink/8 last:border-0 hover:bg-cream/50">
                          <td className="px-4 py-3"><p className="font-semibold">{t.name}</p><p className="font-mono text-[11px] text-ink/50">{t.code}</p></td>
                          <td className="px-4 py-3">{sub ? <span className="inline-flex items-center gap-1.5"><FileText size={13} className="text-wine" />{sub.file_name}</span> : <span className="text-ink/40">—</span>}</td>
                          <td className="px-4 py-3 uppercase">{sub?.file_type || '—'}</td>
                          <td className="px-4 py-3 text-xs text-ink/60">{sub ? new Date(sub.created_at).toLocaleString('en-IN') : '—'}</td>
                          <td className="px-4 py-3">{sub?.github_url ? <a href={sub.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-wine underline"><Github size={13} /> Open</a> : <span className="text-ink/40">—</span>}</td>
                          <td className="px-4 py-3">{sub ? <span className="bg-emerald-700/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">{sub.status}</span> : <span className="text-ink/40">missing</span>}</td>
                          <td className="px-4 py-3">
                            {sub && (
                              <div className="flex gap-1.5">
                                <a href={sub.file_url} target="_blank" rel="noreferrer" aria-label="View file" className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Eye size={14} /></a>
                                <button aria-label="Delete submission" onClick={async () => { if (!confirm('Delete this submission?')) return; try { await apiSend('/api/submissions', 'DELETE', { admin_id: adminId, id: sub.id }); setSubs(subs.filter((s) => s.id !== sub.id)); flash('Submission deleted.'); } catch (e) { fail(e); } }} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={14} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSubs.length === 0 && <p className="p-8 text-center text-sm text-ink/50">No rows match this filter.</p>}
                </div>
              </div>
            )}

            {tab === 'timeline' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink/60">{timeline.length} events · drag order with arrows · changes notify participants instantly</p>
                  <button onClick={() => openNew({ sort_order: String(timeline.length) }, { published: true })} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New event</button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {timeline.map((t, i) => (
                    <div key={t.id} className={`flex flex-wrap items-center gap-3 border px-4 py-3 sm:px-5 ${t.is_current ? 'border-wine bg-wine/[0.05]' : 'border-ink/12 bg-white/70'}`}>
                      <span className="font-mono text-xs font-bold text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{t.title} {!t.published && <span className="ml-1 text-[10px] font-bold uppercase text-ink/40">(draft)</span>}</p>
                        <p className="truncate text-xs text-ink/50">{t.event_time ? new Date(t.event_time).toLocaleString('en-IN') : 'No time set'}{t.description ? ` · ${t.description.slice(0, 80)}` : ''}</p>
                      </div>
                      {t.is_current && <span className="bg-wine px-2 py-0.5 text-[10px] font-bold uppercase text-paper">Current</span>}
                      <div className="flex items-center gap-1">
                        <button aria-label="Move up" onClick={() => moveTimeline(i, -1)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><ArrowUp size={13} /></button>
                        <button aria-label="Move down" onClick={() => moveTimeline(i, 1)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><ArrowDown size={13} /></button>
                        <button onClick={() => setCurrent(t.id)} title="Mark as current stage" className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Star size={13} /></button>
                        <button onClick={() => togglePublish('/api/timeline', t, async () => setTimeline(await apiGet('/api/timeline?all=1')))} title={t.published ? 'Unpublish' : 'Publish'} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine">{t.published ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                        <button aria-label="Edit" onClick={() => openEdit(t)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Pencil size={13} /></button>
                        <button aria-label="Delete" onClick={() => delRow('/api/timeline', t.id, setTimeline, timeline)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No timeline events yet. Create the first one.</p>}
                </div>
              </div>
            )}

            {tab === 'announcements' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink/60">{anncs.length} announcements · publishing notifies all participants</p>
                  <button onClick={() => openNew({ priority: 'normal' }, { published: true })} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New</button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {anncs.map((a) => (
                    <div key={a.id} className="border border-ink/12 bg-white/70 px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="font-semibold">{a.title}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${a.priority === 'urgent' ? 'bg-wine text-paper' : a.priority === 'important' ? 'border border-wine/40 text-wine' : 'border border-ink/20 text-ink/50'}`}>{a.priority}</span>
                        {!a.published && <span className="text-[10px] font-bold uppercase text-ink/40">Draft</span>}
                        <span className="ml-auto flex gap-1">
                          <button onClick={() => togglePublish('/api/announcements', a, async () => setAnncs(await apiGet('/api/announcements?all=1')))} title={a.published ? 'Unpublish' : 'Publish'} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine">{a.published ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                          <button aria-label="Edit" onClick={() => openEdit(a)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Pencil size={13} /></button>
                          <button aria-label="Delete" onClick={() => delRow('/api/announcements', a.id, setAnncs, anncs)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] whitespace-pre-line text-ink/65">{a.content}</p>
                      <p className="mt-1 text-[11px] text-ink/40">{new Date(a.created_at).toLocaleString('en-IN')}{a.expires_at ? ` · expires ${new Date(a.expires_at).toLocaleString('en-IN')}` : ''}</p>
                    </div>
                  ))}
                  {anncs.length === 0 && <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No announcements yet.</p>}
                </div>
              </div>
            )}

            {tab === 'results' && (
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="mr-auto text-sm text-ink/60">{results.length} entries · hidden until published</p>
                  <button onClick={async () => { try { await apiSend('/api/results', 'PUT', { admin_id: adminId, action: 'publish_all' }); setResults(await apiGet(`/api/results?all=1&admin_id=${adminId}`)); flash('All results published — participants notified.'); } catch (e) { fail(e); } }} className="border border-wine/40 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-wine hover:bg-wine hover:text-paper">Publish all</button>
                  <button onClick={async () => { try { await apiSend('/api/results', 'PUT', { admin_id: adminId, action: 'unpublish_all' }); setResults(await apiGet(`/api/results?all=1&admin_id=${adminId}`)); flash('All results hidden.'); } catch (e) { fail(e); } }} className="border border-ink/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] hover:border-wine hover:text-wine">Hide all</button>
                  <button onClick={() => openNew({ position: 'Recognized', sort_order: '0' }, { published: false })} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New result</button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {results.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-3 border border-ink/12 bg-white/70 px-4 py-3 sm:px-5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.position === 'Winner' ? 'bg-wine text-paper' : 'border border-wine/40 text-wine'}`}>{r.position}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{r.team_name} {r.team_code && <span className="font-mono text-xs text-ink/50">{r.team_code}</span>} {!r.published && <span className="text-[10px] font-bold uppercase text-ink/40">(hidden)</span>}</p>
                        <p className="truncate text-xs text-ink/50">{r.category || ''}{r.description ? ` · ${r.description.slice(0, 80)}` : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => togglePublish('/api/results', r, async () => setResults(await apiGet(`/api/results?all=1&admin_id=${adminId}`)))} title={r.published ? 'Unpublish' : 'Publish'} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine">{r.published ? <Eye size={13} /> : <EyeOff size={13} />}</button>
                        <button aria-label="Edit" onClick={() => openEdit(r)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Pencil size={13} /></button>
                        <button aria-label="Delete" onClick={() => delRow('/api/results', r.id, setResults, results)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No results yet. Add winners only after the jury decides — nothing is invented here.</p>}
                </div>
              </div>
            )}

            {tab === 'judges' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink/60">{judges.length} jury profiles · no invented names — placeholders only</p>
                  <button onClick={() => openNew({ sort_order: '0' }, { published: false })} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New profile</button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {judges.map((j) => (
                    <div key={j.id} className="border border-ink/12 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl">{j.name}</p>
                          <p className="text-xs text-ink/55">{[j.designation, j.organization].filter(Boolean).join(' · ') || 'Profile to be revealed'}</p>
                        </div>
                        <span className="flex gap-1">
                          <button aria-label="Edit" onClick={() => openEdit(j)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Pencil size={13} /></button>
                          <button aria-label="Delete" onClick={() => delRow('/api/judges', j.id, setJudges, judges)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                        </span>
                      </div>
                      {j.description && <p className="mt-2 line-clamp-3 text-[13px] text-ink/65">{j.description}</p>}
                      <p className="mt-2 text-[11px] text-ink/40">{j.published ? 'Published on site' : 'Hidden draft'}</p>
                    </div>
                  ))}
                  {judges.length === 0 && <p className="col-span-full border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No jury profiles yet — the public site shows tasteful “To be announced” placeholders.</p>}
                </div>
              </div>
            )}

            {tab === 'faqs' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink/60">{faqs.length} FAQs · only confirmed information</p>
                  <button onClick={() => openNew({ category: 'General', sort_order: '0' }, { published: true })} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New FAQ</button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {faqs.map((f) => (
                    <div key={f.id} className="border border-ink/12 bg-white/70 px-4 py-3.5 sm:px-5">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/60">{f.category}</span>
                        <p className="flex-1 font-semibold">{f.question}</p>
                        <span className="flex gap-1">
                          <button aria-label="Edit" onClick={() => openEdit(f)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Pencil size={13} /></button>
                          <button aria-label="Delete" onClick={() => delRow('/api/faqs', f.id, setFaqs, faqs)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] whitespace-pre-line text-ink/65">{f.answer}</p>
                    </div>
                  ))}
                  {faqs.length === 0 && <p className="border border-dashed border-ink/20 p-8 text-center text-sm text-ink/50">No FAQs yet.</p>}
                </div>
              </div>
            )}

            {tab === 'admins' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink/60">{adminsList.length} admins</p>
                  <button onClick={() => openNew({}, {})} className="inline-flex items-center gap-1.5 bg-wine px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-paper hover:bg-wine-deep"><Plus size={13} /> New admin</button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {adminsList.map(a => (
                    <div key={a.id} className="flex items-center justify-between border border-ink/12 bg-white/70 px-4 py-3">
                      <div>
                        <p className="font-semibold">{a.name} <span className="ml-2 bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase">{a.role}</span></p>
                        <p className="text-xs text-ink/50">{a.email}</p>
                      </div>
                      {a.id !== user.id && a.role !== 'superadmin' && (
                        <button onClick={() => delRow('/api/admins', a.id, setAdminsList, adminsList)} className="border border-ink/15 p-1.5 hover:border-wine hover:text-wine"><Trash2 size={13} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'config' && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-ink/12 bg-white/70 p-5 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/55">Team & event limits</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div><label className={labelCls} htmlFor="cfg-min">Team min</label><input id="cfg-min" type="number" min={1} max={10} className={inputCls} value={form.team_min ?? cfg.team_min ?? '2'} onChange={(e) => setForm({ ...form, team_min: e.target.value })} /></div>
                    <div><label className={labelCls} htmlFor="cfg-max">Team max</label><input id="cfg-max" type="number" min={1} max={10} className={inputCls} value={form.team_max ?? cfg.team_max ?? '5'} onChange={(e) => setForm({ ...form, team_max: e.target.value })} /></div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {[
                      ['allow_leave', 'Allow leaving teams'],
                      ['submissions_open', 'Submissions open (notifies everyone)'],
                      ['allow_resubmission', 'Allow resubmission'],
                      ['registration_open', 'Registration open'],
                    ].map(([k, l]) => {
                      const on = formBool[k] ?? (cfg[k] === 'true');
                      const disabled = k === 'submissions_open' && user?.role !== 'superadmin';
                      return (
                        <label key={k} className={`flex ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} items-center justify-between gap-3 border border-ink/12 px-4 py-3 text-sm`}>
                          <span>{l} {disabled && '(Superadmin only)'}</span>
                          <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => setFormBool({ ...formBool, [k]: !on })}
                            className={`relative h-6 w-11 shrink-0 transition ${on ? 'bg-wine' : 'bg-ink/20'}`}>
                            <span className={`absolute top-0.5 h-5 w-5 bg-paper transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4"><label className={labelCls} htmlFor="cfg-stage">Current event stage</label><input id="cfg-stage" className={inputCls} value={form.current_stage ?? cfg.current_stage ?? ''} onChange={(e) => setForm({ ...form, current_stage: e.target.value })} placeholder="e.g. Ideation" /></div>
                  <div className="mt-4"><label className={labelCls} htmlFor="cfg-note">Organizer note</label><textarea id="cfg-note" className={`${inputCls} min-h-[80px]`} value={form.event_note ?? cfg.event_note ?? ''} onChange={(e) => setForm({ ...form, event_note: e.target.value })} /></div>
                </div>
                <div className="border border-ink/12 bg-white/70 p-5 sm:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/55">Social & contact (public footer)</p>
                  <div className="mt-4 space-y-4">
                    {[['instagram_url', 'Instagram URL'], ['linkedin_url', 'LinkedIn URL'], ['website_url', 'Website URL'], ['contact_email', 'Contact email']].map(([k, l]) => (
                      <div key={k}><label className={labelCls} htmlFor={`cfg-${k}`}>{l}</label><input id={`cfg-${k}`} className={inputCls} value={form[k] ?? cfg[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder="Leave empty to hide" /></div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-ink/50">Empty links are hidden from the public footer — nothing is invented or hardcoded.</p>
                  <button onClick={saveConfig} disabled={busy} className="mt-6 w-full bg-wine px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-paper hover:bg-wine-deep disabled:opacity-50">Save configuration</button>
                  <FieldError message={null} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* editor modal */}
      {editing && tab !== 'config' && tab !== 'overview' && tab !== 'teams' && tab !== 'submissions' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-ink/15 bg-paper">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
              <p className="font-display text-2xl">{editing.__new ? 'New' : 'Edit'} {tab.slice(0, -1)}</p>
              <button onClick={closeForm} className="border border-ink/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:border-wine hover:text-wine">Close</button>
            </div>
            <div className="space-y-4 px-5 py-5 sm:px-6">
              {tab === 'timeline' && (<>
                <F k="title" label="Title" />
                <F k="description" label="Description" textarea />
                <F k="event_time" label="Date & time" type="datetime-local" />
                <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={formBool.published !== false} onChange={(e) => setFormBool({ ...formBool, published: e.target.checked })} className="h-4 w-4 accent-[#5e1224]" /> Published</label>
              </>)}
              {tab === 'announcements' && (<>
                <F k="title" label="Title" />
                <F k="content" label="Content" textarea />
                <div><label className={labelCls} htmlFor="f-priority">Priority</label>
                  <select id="f-priority" className={inputCls} value={form.priority || 'normal'} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
                  </select></div>
                <F k="expires_at" label="Expiry (optional)" type="datetime-local" />
                <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={formBool.published !== false} onChange={(e) => setFormBool({ ...formBool, published: e.target.checked })} className="h-4 w-4 accent-[#5e1224]" /> Published (publishing notifies everyone)</label>
              </>)}
              {tab === 'results' && (<>
                <F k="team_name" label="Team name" />
                <F k="team_code" label="Team code (optional)" />
                <div><label className={labelCls} htmlFor="f-position">Position</label>
                  <select id="f-position" className={inputCls} value={form.position || 'Recognized'} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select></div>
                <F k="category" label="Category (optional)" />
                <F k="description" label="Citation (optional)" textarea />
                <F k="sort_order" label="Order" type="number" />
                <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={!!formBool.published} onChange={(e) => setFormBool({ ...formBool, published: e.target.checked })} className="h-4 w-4 accent-[#5e1224]" /> Published (visible to everyone + notifies)</label>
              </>)}
              {tab === 'judges' && (<>
                <F k="name" label="Name" />
                <F k="designation" label="Designation" />
                <F k="organization" label="Organization" />
                <F k="photo_url" label="Photo URL" />
                <F k="description" label="Bio" textarea />
                <F k="sort_order" label="Order" type="number" />
                <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={formBool.published !== false} onChange={(e) => setFormBool({ ...formBool, published: e.target.checked })} className="h-4 w-4 accent-[#5e1224]" /> Published</label>
              </>)}
              {tab === 'faqs' && (<>
                <F k="question" label="Question" />
                <F k="answer" label="Answer (confirmed info only)" textarea />
                <F k="category" label="Category" />
                <F k="sort_order" label="Order" type="number" />
                <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" checked={formBool.published !== false} onChange={(e) => setFormBool({ ...formBool, published: e.target.checked })} className="h-4 w-4 accent-[#5e1224]" /> Published</label>
              </>)}
              {tab === 'admins' && (<>
                <F k="name" label="Name" />
                <F k="email" label="Email" type="email" />
                <F k="password" label="Password" type="password" />
              </>)}
              <button onClick={saveRow} disabled={busy} className="w-full bg-wine px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-paper hover:bg-wine-deep disabled:opacity-50">
                {busy ? 'Saving…' : editing.__new ? 'Create' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
