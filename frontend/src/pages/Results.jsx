import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Nav from '../components/Nav';
import { Eyebrow, Loader, Empty } from '../components/ui';
import { apiGet } from '../lib/api';
import Background from '../components/Background';

export default function Results() {
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const goHome = (hash) => {
    navigate('/');
    setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  useEffect(() => {
    apiGet('/api/results').then(setResults).catch(() => setResults([]));
  }, []);

  const winners = (results || []).filter((r) => r.position === 'Winner');
  const runners = (results || []).filter((r) => r.position === 'Runner-up');
  const others = (results || []).filter((r) => r.position !== 'Winner' && r.position !== 'Runner-up');

  return (
    <div className="relative min-h-screen isolate overflow-hidden bg-black text-white">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col bg-black/40 backdrop-blur-sm">
        <Nav />
        <div className="mx-auto w-full max-w-5xl px-4 pt-32 pb-20 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55 hover:text-cyan-300">
            <ArrowLeft size={13} /> Back to site
          </Link>
          <div className="mt-6">
            <Eyebrow light>Edition XI · graVITas 2026</Eyebrow>
            <h1 className="font-display mt-4 text-5xl tracking-tight sm:text-6xl">Results</h1>
          </div>
          <div className="mt-10">
            {!results ? (
              <Loader label="Loading results" />
            ) : results.length === 0 ? (
              <Empty title="Results not published yet" body="The jury is still deliberating. Results will appear here the moment the organizing committee publishes them — participants will also be notified." />
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2">
                  {winners.map((r) => (
                    <div key={r.id} className="bg-cyan-900/50 border border-cyan-400/30 p-8 text-center text-white">
                      <Trophy className="mx-auto text-cyan-300" size={30} strokeWidth={1.5} />
                      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-300">Winner</p>
                      <p className="font-display mt-2 text-4xl">{r.team_name}</p>
                      {r.category && <p className="mt-1 text-sm text-white/65">{r.category}</p>}
                      {r.description && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">{r.description}</p>}
                    </div>
                  ))}
                  {runners.map((r) => (
                    <div key={r.id} className="border border-white/15 bg-white/5 p-8 text-center backdrop-blur-md">
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-300">Runner-up</p>
                      <p className="font-display mt-2 text-4xl">{r.team_name}</p>
                      {r.category && <p className="mt-1 text-sm text-white/60">{r.category}</p>}
                      {r.description && <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/65">{r.description}</p>}
                    </div>
                  ))}
                </div>
                {others.length > 0 && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {others.map((r) => (
                      <div key={r.id} className="border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">{r.position}{r.category ? ` · ${r.category}` : ''}</p>
                        <p className="font-display mt-2 text-2xl">{r.team_name}</p>
                        {r.description && <p className="mt-2 text-sm leading-relaxed text-white/65">{r.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <Footer onNav={goHome} />
      </div>
    </div>
  );
}
