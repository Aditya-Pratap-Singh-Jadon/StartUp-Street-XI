import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, UploadCloud, FileText, Github, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loader, FieldError } from '../components/ui';
import { apiGet, apiSend } from '../lib/api';
import Background from '../components/Background';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function Submissions() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(undefined);
  const [submissions, setSubmissions] = useState([]);
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [fileR1, setFileR1] = useState(null);
  const [githubR1, setGithubR1] = useState('');
  const [msgR1, setMsgR1] = useState(null);
  const [errR1, setErrR1] = useState(null);
  const [busyR1, setBusyR1] = useState(false);

  const [fileR2, setFileR2] = useState(null);
  const [githubR2, setGithubR2] = useState('');
  const [msgR2, setMsgR2] = useState(null);
  const [errR2, setErrR2] = useState(null);
  const [busyR2, setBusyR2] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      await refreshProfile(user.id || user._id);
      const [t, c] = await Promise.all([
        apiGet(`/api/teams?user_id=${user.id}`),
        apiGet('/api/config'),
      ]);
      setTeam(t);
      setCfg(c);
      if (t) {
        try {
          const s = await apiGet(`/api/submissions?team_id=${t.id}`);
          setSubmissions(s || []);
          const r1 = s?.find((x) => x.round === 1);
          if (r1) setGithubR1(r1.github_url || '');
          const r2 = s?.find((x) => x.round === 2);
          if (r2) setGithubR2(r2.github_url || '');
        } catch { setSubmissions([]); }
      } else {
        navigate('/dashboard'); // No team, nothing to submit
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load submissions portal');
    } finally {
      setLoading(false);
    }
  }, [user, refreshProfile, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!user) return null;

  const subsOpen = (cfg.submissions_open || 'false') === 'true';

  const doSubmit = async (e, round) => {
    e.preventDefault();
    const isR1 = round === 1;
    const file = isR1 ? fileR1 : fileR2;
    const github = (isR1 ? githubR1 : githubR2).trim();
    const setMsg = isR1 ? setMsgR1 : setMsgR2;
    const setLocalErr = isR1 ? setErrR1 : setErrR2;
    const setBusy = isR1 ? setBusyR1 : setBusyR2;
    const sub = submissions.find(s => s.round === round);

    setLocalErr(null); setMsg(null);
    
    if (!file && !sub) return setLocalErr('Choose your presentation file (PPT, PPTX, DOC, DOCX).');
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['ppt', 'pptx', 'doc', 'docx'].includes(ext)) return setLocalErr('Only PPT, PPTX, DOC or DOCX files are allowed.');
      if (file.size > 15 * 1024 * 1024) return setLocalErr('File must be under 15 MB.');
    }
    if (github && !/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(github))
      return setLocalErr('GitHub URL must look like https://github.com/owner/repo');
      
    setBusy(true);
    try {
      let file_name = sub?.file_name || '';
      let file_base64 = '';
      let content_type = '';
      if (file) {
        file_name = file.name;
        content_type = file.type || 'application/octet-stream';
        file_base64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result).split(',')[1] || '');
          r.onerror = () => reject(new Error('Could not read file'));
          r.readAsDataURL(file);
        });
      }
      
      const saved = await apiSend('/api/submissions', sub ? 'PUT' : 'POST', {
        team_id: team.id, user_id: user.id, round, file_name, file_base64, content_type, github_url: github || null,
      });
      
      setSubmissions(prev => {
        const next = [...prev];
        const idx = next.findIndex(x => x.round === round);
        if (idx >= 0) next[idx] = saved;
        else next.push(saved);
        return next;
      });
      if (isR1) setFileR1(null); else setFileR2(null);
      setMsg(sub ? 'Resubmission saved successfully.' : 'Submission received.');
    } catch (e) { setLocalErr(e instanceof Error ? e.message : 'Submission failed'); }
    finally { setBusy(false); }
  };

  const renderForm = (round) => {
    const sub = submissions.find(s => s.round === round);
    const isR1 = round === 1;
    const file = isR1 ? fileR1 : fileR2;
    const setFile = isR1 ? setFileR1 : setFileR2;
    const github = isR1 ? githubR1 : githubR2;
    const setGithub = isR1 ? setGithubR1 : setGithubR2;
    const busy = isR1 ? busyR1 : busyR2;
    const msg = isR1 ? msgR1 : msgR2;
    const localErr = isR1 ? errR1 : errR2;

    return (
      <div className="border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:px-6 bg-white/5 text-white">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"><UploadCloud size={14} className="text-cyan-400" /> Round {round} Submission</p>
          {sub ? (
            <span className="bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-400/30">Submitted</span>
          ) : (
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] border ${subsOpen ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-white/20 text-white/60'}`}>{subsOpen ? 'Open' : 'Closed'}</span>
          )}
        </div>
        <div className="p-5 sm:p-6 bg-transparent text-white">
          {sub && (
            <div className="mb-5 grid gap-3 border border-white/15 bg-white/5 p-4 text-sm sm:grid-cols-2">
              <p className="flex items-start gap-2"><FileText size={15} className="mt-0.5 shrink-0 text-cyan-400" /><span><strong>{sub.file_name}</strong><br /><span className="text-xs text-white/55">Updated {fmtDate(sub.updated_at)}</span></span></p>
              <div className="flex flex-col gap-1.5 text-[13px]">
                <a href={sub.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 underline underline-offset-4 hover:text-white">View file <ExternalLink size={12} /></a>
                {sub.github_url && <a href={sub.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 underline underline-offset-4 hover:text-white"><Github size={12} /> {sub.github_url.replace('https://', '')}</a>}
              </div>
            </div>
          )}
          {subsOpen ? (
            <form onSubmit={(e) => doSubmit(e, round)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Presentation file — PPT / PPTX / DOC / DOCX, max 15 MB</label>
                <input type="file" accept=".ppt,.pptx,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm text-white file:mr-4 file:border-0 file:bg-cyan-100 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-black" />
                {file && <p className="mt-1.5 text-xs text-white/60">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">GitHub repository URL — optional</label>
                <input className="w-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-300" placeholder="https://github.com/owner/repo" value={github} onChange={(e) => setGithub(e.target.value)} inputMode="url" />
              </div>
              {localErr && <p className="border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">{localErr}</p>}
              {msg && <p className="border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[13px] text-emerald-200">{msg}</p>}
              <button disabled={busy} className="inline-flex items-center gap-2 bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-cyan-100 disabled:opacity-50">
                {sub ? 'Resubmit' : 'Submit for review'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-white/65">Submissions are currently closed.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen isolate overflow-hidden bg-black text-white">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col bg-black/40 backdrop-blur-sm">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 hover:text-cyan-300">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">Submissions Portal</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
          {loading ? (
            <Loader label="Loading submissions" />
          ) : err ? (
            <div className="border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">{err} <button onClick={fetchAll} className="font-semibold text-white underline">Retry</button></div>
          ) : (
            <div className="space-y-10">
              <div>
                <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Submissions Portal</h1>
                <p className="mt-2 text-sm text-white/60">Manage your documents for the internal and jury reviews.</p>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 font-display text-2xl">Internal Review</h2>
                  {renderForm(1)}
                </div>

                {team?.is_selected_for_jury ? (
                  <div>
                    <h2 className="mb-4 font-display text-2xl flex items-center gap-3">Jury Review <span className="bg-cyan-900/50 border border-cyan-400/30 px-2 py-0.5 text-xs text-cyan-300 uppercase tracking-widest font-bold">Unlocked</span></h2>
                    {renderForm(2)}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/20 p-8 text-center text-sm text-white/50 bg-white/5">
                    <h2 className="font-display text-xl mb-2 text-white/40">Jury Review</h2>
                    <p>This round is locked. Only teams selected for the jury round can submit here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
