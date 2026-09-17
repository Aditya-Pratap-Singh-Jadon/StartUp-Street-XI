import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  CheckCheck,
  X,
  ArrowUpRight,
} from "lucide-react";
import { apiGet, apiSend } from "../lib/api";

export default function NotificationBell({ userId }) {
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
      await apiSend("/api/notifications", "PUT", {
        id,
        read: true,
      });

      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch {
      /* silent */
    }
  };

  const markAll = async () => {
    try {
      await apiSend("/api/notifications", "PUT", {
        user_id: userId,
        mark_all: true,
      });

      setItems((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch {
      /* silent */
    }
  };

  /*
   * The dropdown is rendered through a portal directly into <body>.
   * This completely avoids z-index / backdrop-filter / overflow-hidden
   * stacking-context problems from the dashboard.
   */
  const notificationPanel =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <>
        {/* BACKDROP */}
        <div
          className="fixed inset-0 z-9998 bg-black/10"
          onClick={() => setOpen(false)}
        />

        {/* PANEL */}
        <div
          className="fixed right-4 top-18.25 z-9999 w-[min(92vw,390px)] overflow-hidden rounded-[16px] border border-white/13 bg-[#071022]/98 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:right-5 lg:right-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* atmospheric glow */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-cyan-300/[0.07] blur-3xl" />

          {/* HEADER */}
          <div className="relative flex items-center justify-between border-b border-white/8 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                <Bell size={13} />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
                  Notifications
                </p>

                <p className="mt-0.5 text-[8px] text-white/28">
                  {unread > 0
                    ? `${unread} unread ${unread === 1 ? "update" : "updates"
                    }`
                    : "You're all caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-200/70 transition hover:bg-cyan-300/[0.07] hover:text-cyan-100"
                >
                  <CheckCheck size={11} />
                  <span className="hidden sm:inline">
                    Mark all read
                  </span>
                </button>
              )}

              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/5 hover:text-white/70"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="max-h-[min(65vh,430px)] overflow-y-auto [scrollbar-width:thin]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/3 text-white/25">
                  <Bell size={17} />
                </div>

                <p className="mt-3 text-[10px] font-semibold text-white/45">
                  No notifications yet
                </p>

                <p className="mt-1 text-[8px] text-white/20">
                  Updates from StartupStreet will appear here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markOne(n.id)}
                  className={`group relative block w-full border-b border-white/5.5 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-white/[0.035] ${n.read ? "opacity-55" : ""
                    }`}
                >
                  {!n.read && (
                    <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(56,217,255,0.4)]" />
                  )}

                  <div className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${n.read
                          ? "bg-white/[0.035] text-white/25"
                          : "border border-cyan-300/10 bg-cyan-300/[0.07] text-cyan-200"
                        }`}
                    >
                      <Bell size={12} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-[11px] font-semibold ${n.read
                              ? "text-white/55"
                              : "text-white/85"
                            }`}
                        >
                          {n.title}
                        </p>

                        {!n.read && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(56,217,255,0.8)]" />
                        )}
                      </div>

                      {n.body && (
                        <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-white/38">
                          {n.body}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[8px] text-white/22">
                          {new Date(
                            n.created_at
                          ).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>

                        <ArrowUpRight
                          size={10}
                          className="text-white/10 transition group-hover:text-cyan-200/60"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* FOOTER */}
          {items.length > 0 && (
            <div className="border-t border-white/8 px-4 py-2">
              <p className="text-center text-[7px] font-bold uppercase tracking-[0.2em] text-white/18">
                StartupStreet XI · Participant Console
              </p>
            </div>
          )}
        </div>
      </>,
      document.body
    );

  return (
    <>
      {/* BELL */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""
          }`}
        className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300 ${open
            ? "border-cyan-300/30 bg-cyan-300/8 text-cyan-200"
            : "border-white/10 bg-white/2.5 text-white/45 hover:border-cyan-300/25 hover:bg-cyan-300/5 hover:text-cyan-200"
          }`}
      >
        <Bell
          size={14}
          strokeWidth={1.8}
          className={`transition-transform duration-300 ${open
              ? "rotate-[-8deg]"
              : "group-hover:rotate-[8deg]"
            }`}
        />

        {unread > 0 && (
          <>
            <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_9px_rgba(56,217,255,0.9)]" />

            <span className="absolute -right-1.5 -top-1.5 flex h-4.25 min-w-4.25 items-center justify-center rounded-full border border-[#071022] bg-cyan-300 px-1 text-[7px] font-black text-[#04101c] shadow-[0_0_14px_rgba(56,217,255,0.25)]">
              {unread > 9 ? "9+" : unread}
            </span>
          </>
        )}
      </button>

      {notificationPanel}
    </>
  );
}