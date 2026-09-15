import { useEffect, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { apiGet, apiSend } from '../lib/api';

export default function NotificationBell({ userId, dark = false }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const fetchAll = async () => {
    try {
      const data = await apiGet(`/api/notifications?user_id=${userId}`);
      setItems(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unread = items.filter((n) => !n.read).length;

  const markOne = async (id) => {
    try {
      await apiSend('/api/notifications', 'PUT', { id, read: true });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      /* silent */
    }
  };

  const markAll = async () => {
    try {
      await apiSend('/api/notifications', 'PUT', { user_id: userId, mark_all: true });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silent */
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className="relative inline-flex h-10 w-10 items-center justify-center border border-white/15 text-[#F5F5DC] transition hover:border-red-500 hover:text-red-500"
      >
        <Bell className="h-4.5 w-4.5" size={18} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center bg-cyan-500 px-1 text-[10px] font-bold text-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] border border-white/15 bg-black/90 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F5F5DC]">Notifications</p>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={markAll} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:underline">
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close notifications" className="p-1 text-white/50 hover:text-white">
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/50">No notifications yet.</p>}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`block w-full border-b border-white/10 px-4 py-3 text-left transition hover:bg-white/5 ${n.read ? 'opacity-65' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 bg-cyan-400" aria-hidden />}
                    <div>
                      <p className="text-sm font-semibold text-white">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">{n.body}</p>}
                      <p className="mt-1 text-[11px] text-white/40">
                        {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
