import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, UploadCloud, FileText, Github, ExternalLink, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui';
import { apiGet, apiSend } from '../lib/api';
import Background from '../components/Background';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function Submissions() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(undefined);
  const [subState, setSubState] = useState(null); // { currentRound, isOpen }
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [allSubmissions, setAllSubmissions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [file, setFile] = useState(null);
  const [github, setGithub] = useState('');
  const [deployed, setDeployed] = useState('');
  const [msg, setMsg] = useState(null);
  const [localErr, setLocalErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErr(null);
    try {
      await refreshProfile(user.id || user._id);
      const [t, st] = await Promise.all([
        apiGet(`/api/teams?user_id=${user.id}`),
        apiGet('/api/submissions/state').catch(() => null),
      ]);
      setTeam(t);
      setSubState(st || { currentRound: 0, isOpen: true });
      if (t) {
        try {
          const my = await apiGet(`/api/submissions/my?user_id=${user.id}`);
          if (my && my.success) {
            setCurrentSubmission(my.submission);
            if (my.submission) {
              setGithub(my.submission.githubUrl || '');
              setDeployed(my.submission.deployedUrl || '');
            } else {
              setGithub('');
              setDeployed('');
            }
          } else {
            setCurrentSubmission(null);
          }
          
          const allSubs = await apiGet(`/api/submissions?team_id=${t.id}`);
          setAllSubmissions(allSubs || []);
        } catch { 
          setCurrentSubmission(null); 
          setAllSubmissions([]);
        }
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

  const doSubmit = async (e) => {
    e.preventDefault();
    if (!subState || subState.currentRound === 0) return;
    
    setLocalErr(null); setMsg(null);
    
    if (!file && !currentSubmission) return setLocalErr('Choose your presentation file (PPT, PPTX, DOC, DOCX, PDF).');
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['ppt', 'pptx', 'doc', 'docx', 'pdf'].includes(ext)) return setLocalErr('Only PPT, PPTX, DOC, DOCX, or PDF files are allowed.');
      if (file.size > 15 * 1024 * 1024) return setLocalErr('File must be under 15 MB.');
    }
    if (github && !/^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(github))
      return setLocalErr('GitHub URL must look like https://github.com/owner/repo');
    
    if (deployed && !/^https?:\/\/.+/.test(deployed))
      return setLocalErr('Deployed Website URL must be a valid http/https URL');
      
    setBusy(true);
    try {
      let file_name = currentSubmission?.fileName || '';
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
      
      await apiSend('/api/submissions', 'POST', {
        team_id: team.id, user_id: user.id, file_name, file_base64, content_type, github_url: github || null, deployed_url: deployed || null,
      });
      
      setFile(null);
      setMsg('Submission received successfully.');
      await fetchAll(); // Re-fetch to reflect the actual database state
    } catch (e) { 
      setLocalErr(e instanceof Error ? e.message : 'Submission failed'); 
    } finally { 
      setBusy(false); 
    }
  };

  const renderCurrentRound = () => {
    if (!subState || subState.currentRound === 0) {
      return (
        <div className="border border-dashed border-white/20 p-8 text-center text-sm text-white/50 bg-white/5">
          <h2 className="font-display text-xl mb-2 text-white/40">SUBMISSION NOT STARTED</h2>
          <p>Submission rounds have not started yet.<br/>Please wait for the submission window to open.</p>
        </div>
      );
    }
    
    const round = subState.currentRound;
    const isOpen = subState.isOpen;
    const sub = currentSubmission;
    
    if (!isOpen) {
      return (
        <div className="border border-dashed border-white/20 p-8 text-center text-sm text-white/50 bg-white/5">
          <h2 className="font-display text-xl mb-2 text-white/40">ROUND {round} SUBMISSION ENDED</h2>
          <p>The Round {round} submission window has closed.</p>
        </div>
      );
    }
    
    // OPEN STATE
    return (
      <div className="border border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:px-6 bg-white/5 text-white">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"><UploadCloud size={14} className="text-cyan-400" /> ROUND {round} SUBMISSION</p>
          {sub ? (
            <span className="bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-400/30">SUBMITTED ✓</span>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">OPEN</span>
          )}
        </div>
        <div className="p-5 sm:p-6 bg-transparent text-white">
          {sub && (
            <div className="mb-5 grid gap-3 border border-white/15 bg-white/5 p-4 text-sm sm:grid-cols-2">
              <p className="flex items-start gap-2"><FileText size={15} className="mt-0.5 shrink-0 text-cyan-400" /><span><strong>{sub.fileName}</strong><br /><span className="text-xs text-white/55">Updated {fmtDate(sub.submittedAt)}</span></span></p>
              <div className="flex flex-col gap-1.5 text-[13px]">
                {/* Note: we don't have file_url directly in currentSubmission response, but the backend doesn't currently return it in /my. Let's rely on standard UI links. */}
                {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 underline underline-offset-4 hover:text-white"><Github size={12} /> {sub.githubUrl.replace('https://', '')}</a>}
                {sub.deployedUrl && <a href={sub.deployedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-cyan-300 underline underline-offset-4 hover:text-white"><Globe size={12} /> {sub.deployedUrl.replace('https://', '')}</a>}
              </div>
            </div>
          )}
          <form onSubmit={doSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Presentation file — PPT / PPTX / DOC / DOCX / PDF, max 15 MB</label>
              <input type="file" accept=".ppt,.pptx,.doc,.docx,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm text-white file:mr-4 file:border-0 file:bg-cyan-100 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-black" />
              {file && <p className="mt-1.5 text-xs text-white/60">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">GitHub URL — optional</label>
                <input className="w-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-300" placeholder="https://github.com/owner/repo" value={github} onChange={(e) => setGithub(e.target.value)} inputMode="url" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Deployed Website URL — optional</label>
                <input className="w-full border border-white/25 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-cyan-300" placeholder="https://my-startup.vercel.app" value={deployed} onChange={(e) => setDeployed(e.target.value)} inputMode="url" />
              </div>
            </div>
            {localErr && <p className="border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">{localErr}</p>}
            {msg && <p className="border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[13px] text-emerald-200">{msg}</p>}
            <button disabled={busy} className="inline-flex items-center gap-2 bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-cyan-100 disabled:opacity-50">
              {sub ? `Resubmit Round ${round}` : `Submit Round ${round}`}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderPreviousRounds = () => {
    if (!subState || subState.currentRound <= 1) return null;
    
    // Display read-only info for previous rounds (all rounds < currentRound)
    const prevSubs = allSubmissions.filter(s => s.round < subState.currentRound).sort((a, b) => a.round - b.round);
    
    if (prevSubs.length === 0) return null;
    
    return (
      <div className="mt-12">
        <h2 className="mb-4 font-display text-xl text-white/50 uppercase tracking-widest">Previous Submissions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {prevSubs.map(s => (
            <div key={s.round} className="border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">ROUND {s.round}</p>
                <span className="bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-400/30">SUBMITTED ✓</span>
              </div>
              <p className="flex items-start gap-2 mb-3 text-sm"><FileText size={14} className="mt-0.5 shrink-0 text-cyan-400" /><span><strong>{s.file_name}</strong></span></p>
              <div className="flex flex-col gap-1 text-[12px]">
                {s.file_url && <a href={s.file_url} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-4 hover:text-white">View file <ExternalLink size={10} className="inline ml-0.5 mb-0.5" /></a>}
                {s.github_url && <a href={s.github_url} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-4 hover:text-white">GitHub Repo</a>}
                {s.deployed_url && <a href={s.deployed_url} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-4 hover:text-white">Deployed Website</a>}
              </div>
            </div>
          ))}
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

              <div>
                {renderCurrentRound()}
                {renderPreviousRounds()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
