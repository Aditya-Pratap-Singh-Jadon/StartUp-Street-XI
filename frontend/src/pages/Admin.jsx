import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  CalendarClock,
  Megaphone,
  Trophy,
  Settings,
  Gavel,
  CircleHelp,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
  ExternalLink,
  FileText,
  Github,
  Eye,
  EyeOff,
  Star,
  RefreshCw,
  UserCog,
  X,
  Check,
  ChevronRight,
  Activity,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "../components/NotificationBell";
import { Loader, FieldError, inputCls, labelCls } from "../components/ui";
import { apiGet, apiSend } from "../lib/api";
import Background from "../components/Background";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "teams", label: "Teams", icon: Users },
  { id: "submissions", label: "Submissions", icon: UploadCloud },
  { id: "timeline", label: "Timeline", icon: CalendarClock },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "results", label: "Results", icon: Trophy },
  { id: "judges", label: "Jury", icon: Gavel },
  { id: "faqs", label: "FAQs", icon: CircleHelp },
  { id: "config", label: "Config", icon: Settings },
  { id: "admins", label: "Admins", icon: UserCog },
];

const POSITIONS = [
  "Winner",
  "Runner-up",
  "Recognized",
  "Special Mention",
];

function toLocalInput(iso) {
  if (!iso) return "";

  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function fromLocalInput(v) {
  if (!v) return null;
  return new Date(v).toISOString();
}

function fmtDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Admin() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
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

  const [teamQ, setTeamQ] = useState("");
  const [subQ, setSubQ] = useState("");
  const [subFilter, setSubFilter] = useState("all");
  const [submissionWindow, setSubmissionWindow] = useState({ isOpen: false });
  const [windowBusy, setWindowBusy] = useState(false);
  const [selectedSubmissionTeam, setSelectedSubmissionTeam] = useState(null);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [formBool, setFormBool] = useState({});
  const [busy, setBusy] = useState(false);

  const adminId = user?.id || "";

  const flash = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(null), 3500);
  };

  const fail = (e) => {
    setErr(
      e instanceof Error ? e.message : "Something went wrong."
    );
  };

  const fetchAll = async () => {
    if (!user) return;

    setLoading(true);
    setErr(null);

    try {
      const [
        s,
        t,
        sb,
        tl,
        an,
        r,
        j,
        f,
        c,
        sw,
        adm,
      ] = await Promise.all([
        apiGet(`/api/stats?admin_id=${user.id}`),
        apiGet(`/api/teams?all=1&admin_id=${user.id}`),
        apiGet(`/api/submissions?all=1&admin_id=${user.id}`),
        apiGet("/api/timeline?all=1"),
        apiGet("/api/announcements?all=1"),
        apiGet(`/api/results?all=1&admin_id=${user.id}`),
        apiGet("/api/judges?all=1"),
        apiGet("/api/faqs?all=1"),
        apiGet("/api/config"),
        apiGet("/api/submissions/state"),
        user?.role === "superadmin"
          ? apiGet(`/api/admins?admin_id=${user.id}`)
          : Promise.resolve([]),
      ]);

      setStats(s);
      setTeams(t);
      setSubs(sb);
      setTimeline(tl);
      setAnncs(an);
      setResults(r);
      setJudges(j);
      setFaqs(f);
      setCfg(c);
      setSubmissionWindow(sw || { currentRound: 0, isOpen: true });
      setAdminsList(adm);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (v === null || v === undefined) {
        f[k] = "";
      } else if (
        k === "event_time" ||
        k === "expires_at"
      ) {
        f[k] = toLocalInput(String(v));
      } else if (typeof v === "boolean") {
        return;
      } else {
        f[k] = String(v);
      }
    });

    setForm(f);

    setFormBool({
      published: !!row.published,
      is_completed: !!row.is_completed,
    });
  };

  const closeForm = () => {
    setEditing(null);
    setForm({});
    setFormBool({});
  };

  const saveRow = async () => {
    setBusy(true);
    setErr(null);

    try {
      if (tab === "timeline") {
        const payload = {
          admin_id: adminId,
          id: editing?.__new ? undefined : editing?.id,
          title: form.title,
          description: form.description,
          event_time: fromLocalInput(
            form.event_time || ""
          ),
          published: formBool.published !== false,
          is_completed: !!formBool.is_completed,
        };

        if (editing?.__new) {
          await apiSend("/api/timeline", "POST", payload);
        } else {
          await apiSend("/api/timeline", "PUT", payload);
        }

        setTimeline(await apiGet("/api/timeline?all=1"));
        flash("Timeline saved.");
      }

      if (tab === "announcements") {
        const payload = {
          admin_id: adminId,
          id: editing?.__new ? undefined : editing?.id,
          title: form.title,
          content: form.content,
          priority: form.priority || "normal",
          published: formBool.published !== false,
          expires_at: fromLocalInput(
            form.expires_at || ""
          ),
        };

        if (editing?.__new) {
          await apiSend(
            "/api/announcements",
            "POST",
            payload
          );
        } else {
          await apiSend(
            "/api/announcements",
            "PUT",
            payload
          );
        }

        setAnncs(
          await apiGet("/api/announcements?all=1")
        );

        flash("Announcement saved.");
      }

      if (tab === "results") {
        const payload = {
          admin_id: adminId,
          id: editing?.__new ? undefined : editing?.id,
          team_name: form.team_name,
          team_code: form.team_code,
          position: form.position || "Recognized",
          category: form.category,
          description: form.description,
          sort_order: parseInt(
            form.sort_order || "0",
            10
          ),
          published: !!formBool.published,
        };

        if (editing?.__new) {
          await apiSend("/api/results", "POST", payload);
        } else {
          await apiSend("/api/results", "PUT", payload);
        }

        setResults(
          await apiGet(
            `/api/results?all=1&admin_id=${adminId}`
          )
        );

        flash("Result saved.");
      }

      if (tab === "judges") {
        const payload = {
          admin_id: adminId,
          id: editing?.__new ? undefined : editing?.id,
          name: form.name,
          designation: form.designation,
          organization: form.organization,
          description: form.description,
          photo_url: form.photo_url,
          sort_order: parseInt(
            form.sort_order || "0",
            10
          ),
          published: formBool.published !== false,
        };

        if (editing?.__new) {
          await apiSend("/api/judges", "POST", payload);
        } else {
          await apiSend("/api/judges", "PUT", payload);
        }

        setJudges(await apiGet("/api/judges?all=1"));
        flash("Jury profile saved.");
      }

      if (tab === "faqs") {
        const payload = {
          admin_id: adminId,
          id: editing?.__new ? undefined : editing?.id,
          question: form.question,
          answer: form.answer,
          category: form.category || "General",
          sort_order: parseInt(
            form.sort_order || "0",
            10
          ),
          published: formBool.published !== false,
        };

        if (editing?.__new) {
          await apiSend("/api/faqs", "POST", payload);
        } else {
          await apiSend("/api/faqs", "PUT", payload);
        }

        setFaqs(await apiGet("/api/faqs?all=1"));
        flash("FAQ saved.");
      }

      if (tab === "admins") {
        const payload = {
          admin_id: adminId,
          email: form.email,
          name: form.name,
          password: form.password,
        };

        await apiSend("/api/admins", "POST", payload);

        setAdminsList(
          await apiGet(`/api/admins?admin_id=${adminId}`)
        );

        flash("Admin created.");
      }

      closeForm();

      const s = await apiGet(
        `/api/stats?admin_id=${adminId}`
      );

      setStats(s);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const delRow = async (
    endpoint,
    id,
    setter,
    current
  ) => {
    if (
      !confirm(
        "Delete this item? This cannot be undone."
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      await apiSend(endpoint, "DELETE", {
        admin_id: adminId,
        id,
      });

      setter(current.filter((r) => r.id !== id));
      flash("Deleted.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const moveTimeline = async (idx, dir) => {
    const j = idx + dir;

    if (j < 0 || j >= timeline.length) return;

    const order = [...timeline];
    const [item] = order.splice(idx, 1);

    order.splice(j, 0, item);
    setTimeline(order);

    try {
      await apiSend("/api/timeline", "PUT", {
        admin_id: adminId,
        action: "reorder",
        order: order.map((t) => t.id),
      });

      flash("Timeline order updated.");
    } catch (e) {
      fail(e);
      fetchAll();
    }
  };

  const setCurrent = async (id) => {
    try {
      await apiSend("/api/timeline", "PUT", {
        admin_id: adminId,
        action: "set_current",
        id,
      });

      setTimeline(
        await apiGet("/api/timeline?all=1")
      );

      setStats(
        await apiGet(
          `/api/stats?admin_id=${adminId}`
        )
      );

      flash("Current stage updated.");
    } catch (e) {
      fail(e);
    }
  };

  const togglePublish = async (
    endpoint,
    row,
    refresh
  ) => {
    try {
      await apiSend(endpoint, "PUT", {
        admin_id: adminId,
        id: row.id,
        published: !row.published,
      });

      await refresh();

      flash(
        row.published
          ? "Unpublished."
          : "Published successfully."
      );
    } catch (e) {
      fail(e);
    }
  };

  const saveConfig = async () => {
    setBusy(true);
    setErr(null);

    try {
      const values = {};

      [
        "team_min",
        "team_max",
        "current_stage",
        "event_note",
        "instagram_url",
        "linkedin_url",
        "contact_email",
        "website_url",
      ].forEach((k) => {
        values[k] =
          form[k] ?? cfg[k] ?? "";
      });

      [
        "allow_leave",
        "submissions_open",
        "allow_resubmission",
        "registration_open",
      ].forEach((k) => {
        values[k] =
          (
            formBool[k] ??
            (cfg[k] === "true")
          )
            ? "true"
            : "false";
      });

      const updated = await apiSend(
        "/api/config",
        "PUT",
        {
          admin_id: adminId,
          values,
        }
      );

      setCfg(updated);

      setStats(
        await apiGet(
          `/api/stats?admin_id=${adminId}`
        )
      );

      flash("Configuration saved.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const q = teamQ.trim().toLowerCase();

    if (!q) return true;

    return (
      t.name?.toLowerCase().includes(q) ||
      t.code?.toLowerCase().includes(q) ||
      (t.members || []).some(
        (m) =>
          m.profile?.name
            ?.toLowerCase()
            .includes(q) ||
          m.profile?.email
            ?.toLowerCase()
            .includes(q)
      )
    );
  });

  const filteredSubs = teams
    .flatMap((t) => {
      const teamSubs = subs.filter((s) => s.team_id === t.id);
      if (teamSubs.length === 0) {
        return [{ team: t, sub: null }];
      }
      return teamSubs.map((s) => ({ team: t, sub: s }));
    })
    .filter(({ team: t, sub }) => {
      const q = subQ.trim().toLowerCase();

      if (
        q &&
        !(
          t.name
            ?.toLowerCase()
            .includes(q) ||
          t.code
            ?.toLowerCase()
            .includes(q)
        )
      ) {
        return false;
      }

      if (subFilter === "submitted")
        return !!sub;

      if (subFilter === "missing")
        return !sub;

      if (subFilter === "github")
        return !!sub?.github_url;

      return true;
    })
    .sort((a, b) => {
      const at = a.sub?.created_at
        ? new Date(
          a.sub.created_at
        ).getTime()
        : 0;

      const bt = b.sub?.created_at
        ? new Date(
          b.sub.created_at
        ).getTime()
        : 0;

      return bt - at;
    });

  const F = ({
    k,
    label,
    textarea,
    type,
    placeholder,
  }) => (
    <div>
      <label
        className={labelCls}
        htmlFor={`f-${k}`}
      >
        {label}
      </label>

      {textarea ? (
        <textarea
          id={`f-${k}`}
          className={`${inputCls} mt-2 min-h-[110px]`}
          value={form[k] || ""}
          placeholder={placeholder}
          onChange={(e) =>
            setForm({
              ...form,
              [k]: e.target.value,
            })
          }
        />
      ) : (
        <input
          id={`f-${k}`}
          type={type || "text"}
          className={`${inputCls} mt-2`}
          value={form[k] || ""}
          placeholder={placeholder}
          onChange={(e) =>
            setForm({
              ...form,
              [k]: e.target.value,
            })
          }
        />
      )}
    </div>
  );

  const glass =
    "border border-white/[0.09] bg-[#071022]/75 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)]";

  const soft =
    "border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl";

  const action =
    "inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.035] px-3.5 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/55 transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06] hover:text-cyan-100";

  const primary =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#050816] transition duration-300 hover:bg-cyan-100 disabled:opacity-50";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#050816] text-white isolate">
      <Background />

      {/* atmospheric layer */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_15%_20%,rgba(91,140,255,0.12),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(139,92,246,0.10),transparent_34%)]" />

      <div className="relative z-10 flex h-[100dvh] flex-col overflow-hidden">
        {/* HEADER */}
        <header className="shrink-0 border-b border-white/[0.08] bg-[#050816]/80 backdrop-blur-2xl">
          <div className="mx-auto flex h-[64px] w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="group flex items-center gap-3"
            >
              <div className="flex h-9 overflow-hidden rounded-md border border-white/10 bg-white">
                <span className="flex items-center px-2.5 font-display text-[14px] font-black tracking-tight text-[#050816]">
                  STARTUP
                </span>

                <span className="flex items-center bg-[#38D9FF] px-2.5 font-display text-[14px] font-black tracking-tight text-[#050816]">
                  XI
                </span>
              </div>

              <div className="hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-[0.28em] text-white/30">
                  StartupStreet XI
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-white/60">
                  Organizer Console
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 border border-cyan-300/10 bg-cyan-300/[0.035] px-3 py-2 lg:flex">
                <Activity
                  size={11}
                  className="text-cyan-300"
                />

                <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                  System operational
                </span>
              </div>

              <NotificationBell
                userId={adminId}
              />

              <Link
                to="/dashboard"
                className="hidden h-9 items-center border border-white/[0.10] px-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/45 transition hover:border-cyan-300/25 hover:text-cyan-200 sm:flex"
              >
                Participant View
              </Link>

              <button
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.025] px-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/45 transition hover:border-white/20 hover:text-white"
              >
                <LogOut size={12} />

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <aside className="hidden w-[210px] shrink-0 border-r border-white/[0.07] bg-[#050816]/55 px-3 py-5 lg:block">
            <div className="mb-5 px-3">
              <p className="text-[8px] font-black uppercase tracking-[0.24em] text-white/20">
                Control center
              </p>

              <p className="mt-1 text-[10px] text-white/35">
                Manage the entire event.
              </p>
            </div>

            <nav className="space-y-1">
              {TABS.filter(
                (t) =>
                  (t.id !== "results" &&
                    t.id !== "admins") ||
                  user?.role === "superadmin"
              ).map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTab(item.id);
                      closeForm();
                      setErr(null);
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300 ${active
                        ? "border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-100"
                        : "border border-transparent text-white/35 hover:bg-white/[0.025] hover:text-white/70"
                      }`}
                  >
                    {active && (
                      <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,217,255,0.7)]" />
                    )}

                    <Icon
                      size={14}
                      className={
                        active
                          ? "text-cyan-300"
                          : "text-white/30 group-hover:text-white/60"
                      }
                    />

                    <span className="text-[9px] font-black uppercase tracking-[0.13em]">
                      {item.label}
                    </span>

                    {active && (
                      <ChevronRight
                        size={12}
                        className="ml-auto text-cyan-300/50"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto pt-8">
              <div className={`${soft} rounded-xl p-3`}>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/25">
                  Access
                </p>

                <p className="mt-1 text-[10px] font-semibold text-white/65">
                  {user.role === "superadmin"
                    ? "Superadmin"
                    : "Administrator"}
                </p>

                <p className="mt-0.5 truncate text-[8px] text-white/25">
                  {user.email}
                </p>
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="min-h-0 flex-1 overflow-hidden">
            {/* MOBILE NAV */}
            <div className="shrink-0 overflow-x-auto border-b border-white/[0.07] bg-[#050816]/70 px-4 py-2 lg:hidden">
              <div className="flex min-w-max gap-1.5">
                {TABS.filter(
                  (t) =>
                    (t.id !== "results" &&
                      t.id !== "admins") ||
                    user?.role === "superadmin"
                ).map((item) => {
                  const Icon = item.icon;
                  const active =
                    tab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTab(item.id);
                        closeForm();
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[8px] font-black uppercase tracking-[0.13em] ${active
                          ? "bg-cyan-300/10 text-cyan-200"
                          : "text-white/35"
                        }`}
                    >
                      <Icon size={12} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7 [scrollbar-width:thin]">
              {/* TOP BAR */}
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-cyan-300/65">
                    Organizer / {tab}
                  </p>

                  <h1 className="font-display mt-1 text-3xl tracking-tight text-white sm:text-4xl">
                    {TABS.find(
                      (t) => t.id === tab
                    )?.label || "Overview"}
                  </h1>
                </div>

                <button
                  onClick={fetchAll}
                  className={action}
                >
                  <RefreshCw size={11} />
                  Refresh
                </button>
              </div>

              {/* ALERTS */}
              {msg && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3 text-[10px] text-emerald-200">
                  <Check size={13} />
                  {msg}
                </div>
              )}

              {err && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-300/15 bg-red-300/[0.05] px-4 py-3 text-[10px] text-red-200">
                  <span>{err}</span>

                  <button
                    onClick={() => setErr(null)}
                    className="text-white/35 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex min-h-[60vh] items-center justify-center">
                  <Loader label="Loading organizer console" />
                </div>
              ) : (
                <>
                  {/* OVERVIEW */}
                  {tab === "overview" &&
                    stats && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                          {[
                            [
                              "Participants",
                              stats.participants ?? 0,
                              Users,
                              "cyan",
                            ],
                            [
                              "Teams",
                              stats.teams ?? 0,
                              LayoutDashboard,
                              "violet",
                            ],
                            [
                              "Submissions",
                              stats.submissions ?? 0,
                              UploadCloud,
                              "cyan",
                            ],
                            [
                              "GitHub links",
                              stats.github_count ?? 0,
                              Github,
                              "violet",
                            ],
                            [
                              "Pending",
                              stats.pending ?? 0,
                              Activity,
                              "violet",
                            ],
                            [
                              "Current stage",
                              stats.current_stage ?? "—",
                              CalendarClock,
                              "cyan",
                            ],
                            [
                              "Team limits",
                              `${stats.team_min}–${stats.team_max}`,
                              Users,
                              "violet",
                            ],
                            [
                              "Submissions",
                              stats.submissions_open ===
                                "true"
                                ? "OPEN"
                                : "CLOSED",
                              UploadCloud,
                              "cyan",
                            ],
                          ].map(
                            ([
                              label,
                              value,
                              Icon,
                              tone,
                            ]) => (
                              <div
                                key={label}
                                className={`${glass} rounded-xl p-4`}
                              >
                                <div className="flex items-start justify-between">
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone === "cyan"
                                        ? "bg-cyan-300/10 text-cyan-200"
                                        : "bg-violet-300/10 text-violet-200"
                                      }`}
                                  >
                                    <Icon size={14} />
                                  </div>

                                  <span className="font-mono text-[7px] text-white/15">
                                    LIVE
                                  </span>
                                </div>

                                <p className="font-display mt-5 truncate text-2xl tracking-tight sm:text-3xl">
                                  {String(value)}
                                </p>

                                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/30">
                                  {label}
                                </p>
                              </div>
                            )
                          )}
                        </div>

                        <div className="grid gap-5 xl:grid-cols-2">
                          <section
                            className={`${glass} rounded-2xl p-5 sm:p-6`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-white/30">
                                  Team analytics
                                </p>

                                <h2 className="font-display mt-1 text-xl">
                                  Team size
                                </h2>
                              </div>

                              <Users
                                size={15}
                                className="text-cyan-300/50"
                              />
                            </div>

                            {Object.keys(
                              stats.team_size_breakdown ||
                              {}
                            ).length === 0 ? (
                              <p className="mt-8 text-xs text-white/25">
                                No teams formed yet.
                              </p>
                            ) : (
                              <div className="mt-6 space-y-4">
                                {Object.entries(
                                  stats.team_size_breakdown ||
                                  {}
                                )
                                  .sort()
                                  .map(
                                    ([
                                      size,
                                      count,
                                    ]) => (
                                      <div
                                        key={size}
                                        className="flex items-center gap-3"
                                      >
                                        <span className="w-16 text-[9px] font-bold uppercase tracking-wider text-white/35">
                                          {size}{" "}
                                          member
                                          {size ===
                                            "1"
                                            ? ""
                                            : "s"}
                                        </span>

                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                                            style={{
                                              width: `${Math.min(
                                                100,
                                                (count /
                                                  Math.max(
                                                    1,
                                                    Number(
                                                      stats.teams
                                                    )
                                                  )) *
                                                100
                                              )}%`,
                                            }}
                                          />
                                        </div>

                                        <span className="w-6 text-right font-display text-lg">
                                          {count}
                                        </span>
                                      </div>
                                    )
                                  )}
                              </div>
                            )}
                          </section>

                          <section className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.025] p-5 sm:p-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-amber-200/65">
                                  Configuration check
                                </p>

                                <h2 className="font-display mt-1 text-xl text-white">
                                  Rulebook conflict
                                </h2>
                              </div>

                              <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.5)]" />
                            </div>

                            <p className="mt-4 text-xs leading-relaxed text-white/45">
                              Application brief requires{" "}
                              <strong className="text-white/75">
                                2–5 members
                              </strong>
                              ; Rule 2 states individuals /
                              2–4. The platform currently
                              enforces{" "}
                              <strong className="text-white/75">
                                {stats.team_min}–
                                {stats.team_max}
                              </strong>
                              .
                            </p>

                            <button
                              onClick={() =>
                                setTab("config")
                              }
                              className="mt-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-amber-200/80 hover:text-amber-100"
                            >
                              Open configuration
                              <ChevronRight size={11} />
                            </button>
                          </section>
                        </div>
                      </div>
                    )}

                  {/* TEAMS */}
                  {tab === "teams" && (
                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                          <Search
                            size={14}
                            className="absolute left-3.5 top-3.5 text-white/25"
                          />

                          <input
                            className={`${inputCls} pl-10`}
                            placeholder="Search team, code, member or email..."
                            value={teamQ}
                            onChange={(e) =>
                              setTeamQ(e.target.value)
                            }
                          />
                        </div>

                        <button
                          onClick={fetchAll}
                          className={action}
                        >
                          <RefreshCw size={12} />
                          Refresh
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/25">
                          {filteredTeams.length} of{" "}
                          {teams.length} teams
                        </p>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {filteredTeams.map((t) => (
                          <details
                            key={t.id}
                            className={`${glass} group overflow-hidden rounded-xl`}
                          >
                            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/[0.07] text-cyan-200">
                                <Users size={13} />
                              </div>

                              <span className="font-display text-lg tracking-tight">
                                {t.name}
                              </span>

                              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-mono text-[9px] font-bold tracking-widest text-cyan-200/70">
                                {t.code}
                              </span>

                              <span className="text-[9px] text-white/30">
                                {t.member_count}{" "}
                                member
                                {t.member_count === 1
                                  ? ""
                                  : "s"}
                              </span>

                              {t.submissions?.length > 0 ? (
                                <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-emerald-200">
                                  Submitted
                                </span>
                              ) : (
                                <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-white/25">
                                  Pending
                                </span>
                              )}

                              {t.is_selected_for_jury && (
                                <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-2 py-1 text-[7px] font-black uppercase tracking-[0.14em] text-violet-200">
                                  Jury
                                </span>
                              )}

                              <ChevronRight
                                size={13}
                                className="ml-auto text-white/20 transition group-open:rotate-90"
                              />
                            </summary>

                            <div className="grid gap-6 border-t border-white/[0.07] px-4 py-5 sm:px-5 lg:grid-cols-2">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                                  Members
                                </p>

                                <div className="mt-3 space-y-2">
                                  {(t.members || []).map(
                                    (m) => (
                                      <div
                                        key={m.user_id}
                                        className={`${soft} flex items-center justify-between rounded-lg px-3 py-2.5`}
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-[10px] font-semibold text-white/75">
                                            {m.profile?.name ||
                                              m.user_id.slice(
                                                0,
                                                8
                                              )}
                                          </p>

                                          <p className="truncate text-[8px] text-white/25">
                                            {m.profile
                                              ?.email || ""}
                                          </p>
                                        </div>

                                        {m.user_id ===
                                          t.leader_id && (
                                            <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-cyan-200">
                                              Leader
                                            </span>
                                          )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                                  Submission
                                </p>

                                <div className="mt-3 space-y-4">
                                  <div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                                      Round 1 Submission
                                    </p>

                                    <div className="mt-2">
                                      {t.submissions?.find(s => s.round === 1) ? (
                                        <div className="flex items-center justify-between">
                                          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">SUBMITTED ✓</p>
                                          <button
                                            onClick={() => setSelectedSubmissionTeam({ team: t, submission: t.submissions.find(s => s.round === 1) })}
                                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 transition border border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300 rounded-lg"
                                          >
                                            View
                                          </button>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">NOT SUBMITTED</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="border-t border-white/[0.07] pt-4">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
                                      Round 2 Submission
                                    </p>

                                    <div className="mt-2">
                                      {t.submissions?.find(s => s.round === 2) ? (
                                        <div className="flex items-center justify-between">
                                          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">SUBMITTED ✓</p>
                                          <button
                                            onClick={() => setSelectedSubmissionTeam({ team: t, submission: t.submissions.find(s => s.round === 2) })}
                                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 transition border border-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300 rounded-lg"
                                          >
                                            View
                                          </button>
                                        </div>
                                      ) : (
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1">NOT SUBMITTED</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-5 border-t border-white/[0.07] pt-4">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await apiSend(
                                          "/api/teams",
                                          "PUT",
                                          {
                                            admin_id:
                                              adminId,
                                            team_id:
                                              t.id,
                                            action:
                                              "toggle_jury_selection",
                                            is_selected_for_jury:
                                              !t.is_selected_for_jury,
                                          }
                                        );

                                        setTeams(
                                          teams.map(
                                            (x) =>
                                              x.id === t.id
                                                ? {
                                                  ...x,
                                                  is_selected_for_jury:
                                                    !t.is_selected_for_jury,
                                                }
                                                : x
                                          )
                                        );

                                        flash(
                                          !t.is_selected_for_jury
                                            ? "Team selected for jury."
                                            : "Team removed from jury."
                                        );
                                      } catch (e) {
                                        fail(e);
                                      }
                                    }}
                                    className={action}
                                  >
                                    <Trophy size={11} />
                                    {t.is_selected_for_jury
                                      ? "Remove from Jury"
                                      : "Select for Jury"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </details>
                        ))}

                        {filteredTeams.length ===
                          0 && (
                            <div
                              className={`${glass} rounded-xl p-12 text-center`}
                            >
                              <Users
                                size={22}
                                className="mx-auto text-white/15"
                              />

                              <p className="mt-3 text-[10px] font-semibold text-white/35">
                                No teams match your search.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* SUBMISSIONS */}
                  {tab === "submissions" && (
                    <div>
                      <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                          <Search
                            size={14}
                            className="absolute left-3.5 top-3.5 text-white/25"
                          />

                          <input
                            className={`${inputCls} pl-10`}
                            placeholder="Search team name or code..."
                            value={subQ}
                            onChange={(e) =>
                              setSubQ(e.target.value)
                            }
                          />
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto">
                          {[
                            "all",
                            "submitted",
                            "missing",
                            "github",
                          ].map((f) => (
                            <button
                              key={f}
                              onClick={() =>
                                setSubFilter(f)
                              }
                              className={`rounded-lg px-3 py-2.5 text-[8px] font-black uppercase tracking-[0.12em] transition ${subFilter === f
                                  ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                                  : "border border-white/[0.08] bg-white/[0.02] text-white/30 hover:text-white/60"
                                }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {user?.role === "superadmin" && (
                        <div className="mt-6 mb-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Submission Window</p>
                            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.1em] text-white/70">
                              CURRENT ROUND: {submissionWindow?.currentRound || 0}
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              STATUS: {submissionWindow?.currentRound === 0 ? <span className="text-white/50">NOT STARTED</span> : submissionWindow?.isOpen ? <span className="text-emerald-400">OPEN</span> : <span className="text-red-400">SUBMISSION ENDED</span>}
                            </p>
                            {submissionWindow?.updatedBy && (
                              <p className="mt-0.5 text-[9px] text-white/30">Last updated by {submissionWindow.updatedBy}</p>
                            )}
                          </div>
                          
                          {((submissionWindow?.currentRound || 0) < 2 || submissionWindow?.isOpen) && (
                            <button
                              disabled={windowBusy}
                              onClick={async () => {
                                setWindowBusy(true);
                                try {
                                  const action = submissionWindow?.isOpen ? 'end' : 'start';
                                  const res = await apiSend(`/api/submissions/state/${action}`, 'POST', { admin_id: user.id });
                                  setSubmissionWindow(res);
                                  flash(`Submission state updated successfully.`);
                                } catch (e) {
                                  fail(e);
                                } finally {
                                  setWindowBusy(false);
                                }
                              }}
                              className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition ${submissionWindow?.isOpen ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'} rounded-lg disabled:opacity-50`}
                            >
                              {submissionWindow?.isOpen ? `End Round ${submissionWindow?.currentRound}` : `Start Round ${submissionWindow?.currentRound ? submissionWindow.currentRound + 1 : 1}`}
                            </button>
                          )}
                        </div>
                      )}

                      <div className={`${glass} mt-4 overflow-hidden rounded-xl`}>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[800px] text-left">
                            <thead>
                              <tr className="border-b border-white/[0.07] text-[8px] font-black uppercase tracking-[0.16em] text-white/25">
                                <th className="px-4 py-3.5">
                                  Team
                                </th>
                                <th className="px-4 py-3.5">
                                  Round
                                </th>
                                <th className="px-4 py-3.5">
                                  File
                                </th>
                                <th className="px-4 py-3.5">
                                  Type
                                </th>
                                <th className="px-4 py-3.5">
                                  Submitted
                                </th>
                                <th className="px-4 py-3.5">
                                  GitHub
                                </th>
                                <th className="px-4 py-3.5">
                                  Status
                                </th>
                                <th className="px-4 py-3.5">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {filteredSubs.map(
                                ({
                                  team: t,
                                  sub,
                                }) => (
                                  <tr
                                    key={t.id}
                                    className="border-b border-white/[0.05] transition hover:bg-white/[0.018]"
                                  >
                                    <td className="px-4 py-3.5">
                                      <p className="text-[10px] font-semibold text-white/75">
                                        {t.name}
                                      </p>

                                      <p className="mt-1 font-mono text-[8px] text-white/25">
                                        {t.code}
                                      </p>
                                    </td>

                                    <td className="px-4 py-3.5 text-[10px] text-white/50">
                                      {sub ? `Round ${sub.round}` : "—"}
                                    </td>

                                    <td className="px-4 py-3.5">
                                      {sub ? (
                                        <span className="flex items-center gap-2 text-[9px] text-white/55">
                                          <FileText
                                            size={12}
                                            className="text-cyan-300"
                                          />
                                          {sub.file_name}
                                        </span>
                                      ) : (
                                        <span className="text-white/15">
                                          —
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3.5 text-[8px] uppercase text-white/35">
                                      {sub?.file_type ||
                                        "—"}
                                    </td>

                                    <td className="px-4 py-3.5 text-[8px] text-white/30">
                                      {sub
                                        ? new Date(
                                          sub.created_at
                                        ).toLocaleString(
                                          "en-IN"
                                        )
                                        : "—"}
                                    </td>

                                    <td className="px-4 py-3.5">
                                      {sub?.github_url ? (
                                        <a
                                          href={
                                            sub.github_url
                                          }
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-cyan-200 hover:text-cyan-100"
                                        >
                                          <Github
                                            size={11}
                                          />
                                          Open
                                        </a>
                                      ) : (
                                        <span className="text-white/15">
                                          —
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3.5">
                                      {sub ? (
                                        <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-2 py-1 text-[7px] font-black uppercase tracking-wider text-emerald-200">
                                          {sub.status}
                                        </span>
                                      ) : (
                                        <span className="text-[8px] uppercase text-white/20">
                                          Missing
                                        </span>
                                      )}
                                    </td>

                                    <td className="px-4 py-3.5">
                                      {sub && (
                                        <div className="flex gap-1.5">
                                          <a
                                            href={
                                              sub.file_url ? `${sub.file_url}&token=${localStorage.getItem('token')}` : "#"
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] text-white/30 hover:border-cyan-300/25 hover:text-cyan-200"
                                          >
                                            <Eye size={12} />
                                          </a>

                                          <button
                                            onClick={async () => {
                                              if (
                                                !confirm(
                                                  "Delete this submission?"
                                                )
                                              )
                                                return;

                                              try {
                                                await apiSend(
                                                  "/api/submissions",
                                                  "DELETE",
                                                  {
                                                    admin_id:
                                                      adminId,
                                                    id: sub.id,
                                                  }
                                                );

                                                setSubs(
                                                  subs.filter(
                                                    (s) =>
                                                      s.id !==
                                                      sub.id
                                                  )
                                                );

                                                flash(
                                                  "Submission deleted."
                                                );
                                              } catch (
                                              e
                                              ) {
                                                fail(e);
                                              }
                                            }}
                                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] text-white/25 hover:border-red-300/25 hover:text-red-200"
                                          >
                                            <Trash2
                                              size={12}
                                            />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>

                        {filteredSubs.length ===
                          0 && (
                            <div className="p-12 text-center">
                              <UploadCloud
                                size={22}
                                className="mx-auto text-white/15"
                              />

                              <p className="mt-3 text-[10px] text-white/30">
                                No submissions match this
                                filter.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* TIMELINE */}
                  {tab === "timeline" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] text-white/30">
                            {timeline.length} events
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Changes notify participants
                            instantly
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openNew(
                              {
                                sort_order:
                                  String(
                                    timeline.length
                                  ),
                              },
                              {
                                published: true,
                              }
                            )
                          }
                          className={primary}
                        >
                          <Plus size={12} />
                          New event
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {timeline.map((t, i) => (
                          <div
                            key={t.id}
                            className={`${glass} flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 ${t.is_current
                                ? "border-cyan-300/25 bg-cyan-300/[0.035]"
                                : ""
                              }`}
                          >
                            <span className="font-mono text-[9px] text-white/20">
                              {String(i + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-semibold text-white/75">
                                {t.title}

                                {!t.published && (
                                  <span className="ml-2 text-[7px] uppercase text-white/20">
                                    Draft
                                  </span>
                                )}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-white/25">
                                {t.event_time
                                  ? fmtDate(
                                    t.event_time
                                  )
                                  : "No time set"}

                                {t.description
                                  ? ` · ${t.description.slice(
                                    0,
                                    70
                                  )}`
                                  : ""}
                              </p>
                            </div>

                            {t.is_current && (
                              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[7px] font-black uppercase tracking-wider text-cyan-200">
                                Current
                              </span>
                            )}

                            <div className="flex items-center gap-1">
                              {[
                                [
                                  ArrowUp,
                                  () =>
                                    moveTimeline(
                                      i,
                                      -1
                                    ),
                                  "Move up",
                                ],
                                [
                                  ArrowDown,
                                  () =>
                                    moveTimeline(
                                      i,
                                      1
                                    ),
                                  "Move down",
                                ],
                                [
                                  Star,
                                  () =>
                                    setCurrent(
                                      t.id
                                    ),
                                  "Set current",
                                ],
                                [
                                  t.published
                                    ? Eye
                                    : EyeOff,
                                  () =>
                                    togglePublish(
                                      "/api/timeline",
                                      t,
                                      async () =>
                                        setTimeline(
                                          await apiGet(
                                            "/api/timeline?all=1"
                                          )
                                        )
                                    ),
                                  "Publish",
                                ],
                                [
                                  Pencil,
                                  () => openEdit(t),
                                  "Edit",
                                ],
                                [
                                  Trash2,
                                  () =>
                                    delRow(
                                      "/api/timeline",
                                      t.id,
                                      setTimeline,
                                      timeline
                                    ),
                                  "Delete",
                                ],
                              ].map(
                                ([
                                  Icon,
                                  actionFn,
                                  title,
                                ]) => (
                                  <button
                                    key={title}
                                    onClick={actionFn}
                                    title={title}
                                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 transition hover:border-cyan-300/25 hover:text-cyan-200"
                                  >
                                    <Icon size={11} />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ANNOUNCEMENTS */}
                  {tab === "announcements" && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] text-white/30">
                            {anncs.length} announcements
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Publishing notifies participants
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openNew(
                              {
                                priority: "normal",
                              },
                              {
                                published: true,
                              }
                            )
                          }
                          className={primary}
                        >
                          <Plus size={12} />
                          New
                        </button>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {anncs.map((a) => (
                          <div
                            key={a.id}
                            className={`${glass} rounded-xl p-4 sm:p-5`}
                          >
                            <div className="flex flex-wrap items-start gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/[0.07] text-cyan-200">
                                <Megaphone
                                  size={13}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-[11px] font-semibold text-white/80">
                                    {a.title}
                                  </p>

                                  <span
                                    className={`rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider ${a.priority ===
                                        "urgent"
                                        ? "bg-cyan-300/15 text-cyan-200"
                                        : a.priority ===
                                          "important"
                                          ? "border border-violet-300/20 text-violet-200"
                                          : "border border-white/[0.08] text-white/30"
                                      }`}
                                  >
                                    {a.priority}
                                  </span>

                                  {!a.published && (
                                    <span className="text-[7px] font-black uppercase text-white/20">
                                      Draft
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 whitespace-pre-line text-[10px] leading-relaxed text-white/40">
                                  {a.content}
                                </p>

                                <p className="mt-2 text-[8px] text-white/20">
                                  {fmtDate(
                                    a.created_at
                                  )}

                                  {a.expires_at
                                    ? ` · expires ${fmtDate(
                                      a.expires_at
                                    )}`
                                    : ""}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    togglePublish(
                                      "/api/announcements",
                                      a,
                                      async () =>
                                        setAnncs(
                                          await apiGet(
                                            "/api/announcements?all=1"
                                          )
                                        )
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                                >
                                  {a.published ? (
                                    <Eye size={11} />
                                  ) : (
                                    <EyeOff size={11} />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    openEdit(a)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                                >
                                  <Pencil size={11} />
                                </button>

                                <button
                                  onClick={() =>
                                    delRow(
                                      "/api/announcements",
                                      a.id,
                                      setAnncs,
                                      anncs
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-red-300/25 hover:text-red-200"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {anncs.length === 0 && (
                          <EmptyState
                            icon={Megaphone}
                            text="No announcements yet."
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* RESULTS */}
                  {tab === "results" && (
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="mr-auto">
                          <p className="text-[9px] text-white/30">
                            {results.length} result entries
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Hidden until published
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            try {
                              await apiSend(
                                "/api/results",
                                "PUT",
                                {
                                  admin_id:
                                    adminId,
                                  action:
                                    "publish_all",
                                }
                              );

                              setResults(
                                await apiGet(
                                  `/api/results?all=1&admin_id=${adminId}`
                                )
                              );

                              flash(
                                "All results published."
                              );
                            } catch (e) {
                              fail(e);
                            }
                          }}
                          className={action}
                        >
                          <Eye size={11} />
                          Publish all
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await apiSend(
                                "/api/results",
                                "PUT",
                                {
                                  admin_id:
                                    adminId,
                                  action:
                                    "unpublish_all",
                                }
                              );

                              setResults(
                                await apiGet(
                                  `/api/results?all=1&admin_id=${adminId}`
                                )
                              );

                              flash(
                                "All results hidden."
                              );
                            } catch (e) {
                              fail(e);
                            }
                          }}
                          className={action}
                        >
                          <EyeOff size={11} />
                          Hide all
                        </button>

                        <button
                          onClick={() =>
                            openNew(
                              {
                                position:
                                  "Recognized",
                                sort_order: "0",
                              },
                              {
                                published: false,
                              }
                            )
                          }
                          className={primary}
                        >
                          <Plus size={11} />
                          New result
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {results.map((r) => (
                          <div
                            key={r.id}
                            className={`${glass} flex flex-wrap items-center gap-3 rounded-xl px-4 py-3.5`}
                          >
                            <span
                              className={`rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider ${r.position ===
                                  "Winner"
                                  ? "bg-cyan-300/15 text-cyan-200"
                                  : "border border-white/[0.08] text-white/40"
                                }`}
                            >
                              {r.position}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-white/75">
                                {r.team_name}

                                {r.team_code && (
                                  <span className="ml-2 font-mono text-[8px] text-white/25">
                                    {r.team_code}
                                  </span>
                                )}

                                {!r.published && (
                                  <span className="ml-2 text-[7px] uppercase text-white/20">
                                    Hidden
                                  </span>
                                )}
                              </p>

                              <p className="mt-1 truncate text-[8px] text-white/25">
                                {r.category || ""}
                                {r.description
                                  ? ` · ${r.description.slice(
                                    0,
                                    80
                                  )}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  togglePublish(
                                    "/api/results",
                                    r,
                                    async () =>
                                      setResults(
                                        await apiGet(
                                          `/api/results?all=1&admin_id=${adminId}`
                                        )
                                      )
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                              >
                                {r.published ? (
                                  <Eye size={11} />
                                ) : (
                                  <EyeOff size={11} />
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  openEdit(r)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                              >
                                <Pencil size={11} />
                              </button>

                              <button
                                onClick={() =>
                                  delRow(
                                    "/api/results",
                                    r.id,
                                    setResults,
                                    results
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-red-300/25 hover:text-red-200"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}

                        {results.length === 0 && (
                          <EmptyState
                            icon={Trophy}
                            text="No results yet."
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* JUDGES */}
                  {tab === "judges" && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] text-white/30">
                            {judges.length} jury profiles
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Public profiles
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openNew(
                              {
                                sort_order: "0",
                              },
                              {
                                published: false,
                              }
                            )
                          }
                          className={primary}
                        >
                          <Plus size={11} />
                          New profile
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {judges.map((j) => (
                          <div
                            key={j.id}
                            className={`${glass} rounded-xl p-4`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-display truncate text-xl">
                                  {j.name}
                                </p>

                                <p className="mt-1 truncate text-[8px] text-white/30">
                                  {[
                                    j.designation,
                                    j.organization,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") ||
                                    "Profile to be revealed"}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    openEdit(j)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                                >
                                  <Pencil size={11} />
                                </button>

                                <button
                                  onClick={() =>
                                    delRow(
                                      "/api/judges",
                                      j.id,
                                      setJudges,
                                      judges
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-red-300/25 hover:text-red-200"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            {j.description && (
                              <p className="mt-4 line-clamp-3 text-[9px] leading-relaxed text-white/35">
                                {j.description}
                              </p>
                            )}

                            <div className="mt-4 border-t border-white/[0.06] pt-3">
                              <span
                                className={`text-[7px] font-black uppercase tracking-[0.15em] ${j.published
                                    ? "text-emerald-200/70"
                                    : "text-white/20"
                                  }`}
                              >
                                {j.published
                                  ? "Published"
                                  : "Hidden draft"}
                              </span>
                            </div>
                          </div>
                        ))}

                        {judges.length === 0 && (
                          <div className="col-span-full">
                            <EmptyState
                              icon={Gavel}
                              text="No jury profiles yet."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FAQ */}
                  {tab === "faqs" && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] text-white/30">
                            {faqs.length} FAQs
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Confirmed information only
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openNew(
                              {
                                category:
                                  "General",
                                sort_order: "0",
                              },
                              {
                                published: true,
                              }
                            )
                          }
                          className={primary}
                        >
                          <Plus size={11} />
                          New FAQ
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {faqs.map((f) => (
                          <div
                            key={f.id}
                            className={`${glass} rounded-xl p-4`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200">
                                <CircleHelp
                                  size={13}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[7px] font-black uppercase tracking-wider text-white/30">
                                    {f.category}
                                  </span>

                                  <p className="text-[10px] font-semibold text-white/75">
                                    {f.question}
                                  </p>
                                </div>

                                <p className="mt-2 whitespace-pre-line text-[9px] leading-relaxed text-white/35">
                                  {f.answer}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    openEdit(f)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-cyan-300/25 hover:text-cyan-200"
                                >
                                  <Pencil size={11} />
                                </button>

                                <button
                                  onClick={() =>
                                    delRow(
                                      "/api/faqs",
                                      f.id,
                                      setFaqs,
                                      faqs
                                    )
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-red-300/25 hover:text-red-200"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {faqs.length === 0 && (
                          <EmptyState
                            icon={CircleHelp}
                            text="No FAQs yet."
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* ADMINS */}
                  {tab === "admins" && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[9px] text-white/30">
                            {adminsList.length} admins
                          </p>

                          <p className="mt-1 text-[8px] uppercase tracking-[0.15em] text-white/20">
                            Administrative access
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openNew({}, {})
                          }
                          className={primary}
                        >
                          <Plus size={11} />
                          New admin
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2">
                        {adminsList.map((a) => (
                          <div
                            key={a.id}
                            className={`${glass} flex items-center justify-between gap-4 rounded-xl px-4 py-3.5`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                                <UserCog
                                  size={14}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold text-white/75">
                                  {a.name}

                                  <span className="ml-2 rounded-full border border-white/[0.08] px-2 py-0.5 text-[7px] font-black uppercase text-white/25">
                                    {a.role}
                                  </span>
                                </p>

                                <p className="mt-1 truncate text-[8px] text-white/25">
                                  {a.email}
                                </p>
                              </div>
                            </div>

                            {a.id !== user.id &&
                              a.role !==
                              "superadmin" && (
                                <button
                                  onClick={() =>
                                    delRow(
                                      "/api/admins",
                                      a.id,
                                      setAdminsList,
                                      adminsList
                                    )
                                  }
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.07] text-white/25 hover:border-red-300/25 hover:text-red-200"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CONFIG */}
                  {tab === "config" && (
                    <div className="grid gap-4 xl:grid-cols-2">
                      <section
                        className={`${glass} rounded-2xl p-5 sm:p-6`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                            <Settings size={14} />
                          </div>

                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
                              Event control
                            </p>

                            <h2 className="font-display text-xl">
                              Team & limits
                            </h2>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div>
                            <label
                              className={labelCls}
                              htmlFor="cfg-min"
                            >
                              Team minimum
                            </label>

                            <input
                              id="cfg-min"
                              type="number"
                              min={1}
                              max={10}
                              className={`${inputCls} mt-2`}
                              value={
                                form.team_min ??
                                cfg.team_min ??
                                "2"
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  team_min:
                                    e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <label
                              className={labelCls}
                              htmlFor="cfg-max"
                            >
                              Team maximum
                            </label>

                            <input
                              id="cfg-max"
                              type="number"
                              min={1}
                              max={10}
                              className={`${inputCls} mt-2`}
                              value={
                                form.team_max ??
                                cfg.team_max ??
                                "5"
                              }
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  team_max:
                                    e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-5 space-y-2">
                          {[
                            [
                              "allow_leave",
                              "Allow leaving teams",
                            ],
                            [
                              "submissions_open",
                              "Submissions open",
                            ],
                            [
                              "allow_resubmission",
                              "Allow resubmission",
                            ],
                            [
                              "registration_open",
                              "Registration open",
                            ],
                          ].map(([k, label]) => {
                            const on =
                              formBool[k] ??
                              (cfg[k] === "true");

                            const disabled =
                              k ===
                              "submissions_open" &&
                              user?.role !==
                              "superadmin";

                            return (
                              <div
                                key={k}
                                className={`flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.018] px-4 py-3 ${disabled
                                    ? "opacity-40"
                                    : ""
                                  }`}
                              >
                                <div>
                                  <p className="text-[9px] font-semibold text-white/60">
                                    {label}
                                  </p>

                                  {disabled && (
                                    <p className="mt-0.5 text-[7px] uppercase tracking-wider text-white/20">
                                      Superadmin only
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={on}
                                  disabled={disabled}
                                  onClick={() =>
                                    setFormBool({
                                      ...formBool,
                                      [k]: !on,
                                    })
                                  }
                                  className={`relative h-5 w-9 rounded-full transition ${on
                                      ? "bg-cyan-300"
                                      : "bg-white/10"
                                    }`}
                                >
                                  <span
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on
                                        ? "left-[18px]"
                                        : "left-0.5"
                                      }`}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-5">
                          <label
                            className={labelCls}
                            htmlFor="cfg-stage"
                          >
                            Current event stage
                          </label>

                          <input
                            id="cfg-stage"
                            className={`${inputCls} mt-2`}
                            value={
                              form.current_stage ??
                              cfg.current_stage ??
                              ""
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                current_stage:
                                  e.target.value,
                              })
                            }
                            placeholder="e.g. Ideation"
                          />
                        </div>

                        <div className="mt-4">
                          <label
                            className={labelCls}
                            htmlFor="cfg-note"
                          >
                            Organizer note
                          </label>

                          <textarea
                            id="cfg-note"
                            className={`${inputCls} mt-2 min-h-[100px]`}
                            value={
                              form.event_note ??
                              cfg.event_note ??
                              ""
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                event_note:
                                  e.target.value,
                              })
                            }
                          />
                        </div>

                        <button
                          onClick={saveConfig}
                          disabled={busy}
                          className={`${primary} mt-5 w-full`}
                        >
                          {busy
                            ? "Saving..."
                            : "Save configuration"}
                        </button>
                      </section>

                      <section
                        className={`${glass} rounded-2xl p-5 sm:p-6`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200">
                            <ExternalLink
                              size={14}
                            />
                          </div>

                          <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
                              Public presence
                            </p>

                            <h2 className="font-display text-xl">
                              Social & contact
                            </h2>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          {[
                            [
                              "instagram_url",
                              "Instagram URL",
                            ],
                            [
                              "linkedin_url",
                              "LinkedIn URL",
                            ],
                            [
                              "website_url",
                              "Website URL",
                            ],
                            [
                              "contact_email",
                              "Contact email",
                            ],
                          ].map(([k, label]) => (
                            <div key={k}>
                              <label
                                className={labelCls}
                                htmlFor={`cfg-${k}`}
                              >
                                {label}
                              </label>

                              <input
                                id={`cfg-${k}`}
                                className={`${inputCls} mt-2`}
                                value={
                                  form[k] ??
                                  cfg[k] ??
                                  ""
                                }
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    [k]: e.target.value,
                                  })
                                }
                                placeholder="Leave empty to hide"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
                          <p className="text-[8px] leading-relaxed text-white/25">
                            Empty links remain hidden from
                            the public site. Nothing is
                            automatically invented or
                            hardcoded.
                          </p>
                        </div>

                        <button
                          onClick={saveConfig}
                          disabled={busy}
                          className={`${primary} mt-5 w-full`}
                        >
                          {busy
                            ? "Saving..."
                            : "Save configuration"}
                        </button>
                      </section>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* EDITOR MODAL */}
      {editing &&
        tab !== "config" &&
        tab !== "overview" &&
        tab !== "teams" &&
        tab !== "submissions" && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020510]/80 p-4 backdrop-blur-md sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            <div
              className={`${glass} max-h-[92dvh] w-full max-w-2xl overflow-hidden rounded-2xl`}
            >
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-cyan-300/60">
                    Organizer editor
                  </p>

                  <h2 className="font-display mt-1 text-2xl tracking-tight">
                    {editing.__new
                      ? "Create"
                      : "Edit"}{" "}
                    {tab.slice(0, -1)}
                  </h2>
                </div>

                <button
                  onClick={closeForm}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/35 transition hover:border-white/20 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="max-h-[calc(92dvh-76px)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                <div className="space-y-4">
                  {tab === "timeline" && (
                    <>
                      <F
                        k="title"
                        label="Title"
                        placeholder="Event stage"
                      />

                      <F
                        k="description"
                        label="Description"
                        textarea
                        placeholder="Describe this stage..."
                      />

                      <F
                        k="event_time"
                        label="Date & time"
                        type="datetime-local"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                          <input
                            type="checkbox"
                            checked={
                              formBool.published !==
                              false
                            }
                            onChange={(e) =>
                              setFormBool({
                                ...formBool,
                                published:
                                  e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-cyan-300"
                          />
                          Published
                        </label>

                        <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                          <input
                            type="checkbox"
                            checked={
                              !!formBool.is_completed
                            }
                            onChange={(e) =>
                              setFormBool({
                                ...formBool,
                                is_completed:
                                  e.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-cyan-300"
                          />
                          Completed
                        </label>
                      </div>
                    </>
                  )}

                  {tab === "announcements" && (
                    <>
                      <F
                        k="title"
                        label="Title"
                        placeholder="Announcement title"
                      />

                      <F
                        k="content"
                        label="Content"
                        textarea
                        placeholder="Write the announcement..."
                      />

                      <div>
                        <label
                          className={labelCls}
                          htmlFor="f-priority"
                        >
                          Priority
                        </label>

                        <select
                          id="f-priority"
                          className={`${inputCls} mt-2`}
                          value={
                            form.priority ||
                            "normal"
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              priority:
                                e.target.value,
                            })
                          }
                        >
                          <option
                            value="normal"
                            className="bg-[#071022]"
                          >
                            Normal
                          </option>

                          <option
                            value="important"
                            className="bg-[#071022]"
                          >
                            Important
                          </option>

                          <option
                            value="urgent"
                            className="bg-[#071022]"
                          >
                            Urgent
                          </option>
                        </select>
                      </div>

                      <F
                        k="expires_at"
                        label="Expiry"
                        type="datetime-local"
                      />

                      <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                        <input
                          type="checkbox"
                          checked={
                            formBool.published !==
                            false
                          }
                          onChange={(e) =>
                            setFormBool({
                              ...formBool,
                              published:
                                e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-cyan-300"
                        />
                        Published
                      </label>
                    </>
                  )}

                  {tab === "results" && (
                    <>
                      <F
                        k="team_name"
                        label="Team name"
                      />

                      <F
                        k="team_code"
                        label="Team code"
                      />

                      <div>
                        <label
                          className={labelCls}
                          htmlFor="f-position"
                        >
                          Position
                        </label>

                        <select
                          id="f-position"
                          className={`${inputCls} mt-2`}
                          value={
                            form.position ||
                            "Recognized"
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              position:
                                e.target.value,
                            })
                          }
                        >
                          {POSITIONS.map((p) => (
                            <option
                              key={p}
                              value={p}
                              className="bg-[#071022]"
                            >
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <F
                        k="category"
                        label="Category"
                      />

                      <F
                        k="description"
                        label="Citation"
                        textarea
                      />

                      <F
                        k="sort_order"
                        label="Display order"
                        type="number"
                      />

                      <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                        <input
                          type="checkbox"
                          checked={
                            !!formBool.published
                          }
                          onChange={(e) =>
                            setFormBool({
                              ...formBool,
                              published:
                                e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-cyan-300"
                        />
                        Published
                      </label>
                    </>
                  )}

                  {tab === "judges" && (
                    <>
                      <F
                        k="name"
                        label="Name"
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <F
                          k="designation"
                          label="Designation"
                        />

                        <F
                          k="organization"
                          label="Organization"
                        />
                      </div>

                      <F
                        k="photo_url"
                        label="Photo URL"
                      />

                      <F
                        k="description"
                        label="Bio"
                        textarea
                      />

                      <F
                        k="sort_order"
                        label="Display order"
                        type="number"
                      />

                      <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                        <input
                          type="checkbox"
                          checked={
                            formBool.published !==
                            false
                          }
                          onChange={(e) =>
                            setFormBool({
                              ...formBool,
                              published:
                                e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-cyan-300"
                        />
                        Published
                      </label>
                    </>
                  )}

                  {tab === "faqs" && (
                    <>
                      <F
                        k="question"
                        label="Question"
                      />

                      <F
                        k="answer"
                        label="Answer"
                        textarea
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <F
                          k="category"
                          label="Category"
                        />

                        <F
                          k="sort_order"
                          label="Display order"
                          type="number"
                        />
                      </div>

                      <label className={`${soft} flex items-center gap-3 rounded-xl px-4 py-3 text-[9px] font-semibold text-white/60`}>
                        <input
                          type="checkbox"
                          checked={
                            formBool.published !==
                            false
                          }
                          onChange={(e) =>
                            setFormBool({
                              ...formBool,
                              published:
                                e.target.checked,
                            })
                          }
                          className="h-4 w-4 accent-cyan-300"
                        />
                        Published
                      </label>
                    </>
                  )}

                  {tab === "admins" && (
                    <>
                      <F
                        k="name"
                        label="Name"
                      />

                      <F
                        k="email"
                        label="Email"
                        type="email"
                      />

                      <F
                        k="password"
                        label="Password"
                        type="password"
                      />
                    </>
                  )}

                  <button
                    onClick={saveRow}
                    disabled={busy}
                    className={`${primary} mt-3 w-full py-3.5`}
                  >
                    {busy
                      ? "Saving..."
                      : editing.__new
                        ? "Create"
                        : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
      {selectedSubmissionTeam && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020510]/80 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setSelectedSubmissionTeam(null)}
        >
          <div
            className={`${glass} relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] p-6`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSubmissionTeam(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{selectedSubmissionTeam.team?.name || selectedSubmissionTeam.name} - ROUND {selectedSubmissionTeam.submission?.round} SUBMISSION</p>
            <h3 className="mt-1 font-display text-2xl text-white">SUBMISSION DETAILS</h3>
            
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Status</p>
                <p className="mt-1 text-sm font-semibold text-emerald-400">SUBMITTED ✓</p>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">PPT / PDF</p>
                <p className="mt-1 text-sm text-white">{selectedSubmissionTeam.submission?.file_name}</p>
                <a href={selectedSubmissionTeam.submission?.file_url ? `${selectedSubmissionTeam.submission.file_url}&token=${localStorage.getItem('token')}` : "#"} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300 hover:bg-white/10">
                  <ExternalLink size={12} /> View PPT
                </a>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">GitHub Repository</p>
                {selectedSubmissionTeam.submission?.github_url ? (
                  <a href={selectedSubmissionTeam.submission?.github_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300 hover:bg-white/10">
                    <Github size={12} /> Open Github
                  </a>
                ) : <p className="mt-1 text-sm text-white/30">—</p>}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Deployed Website</p>
                {selectedSubmissionTeam.submission?.deployed_url ? (
                  <a href={selectedSubmissionTeam.submission?.deployed_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300 hover:bg-white/10">
                    <ExternalLink size={12} /> Open Website
                  </a>
                ) : <p className="mt-1 text-sm text-white/30">—</p>}
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Submitted At</p>
                <p className="mt-1 text-sm text-white/70">{fmtDate(selectedSubmissionTeam.submission?.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] px-6 py-12 text-center">
      <Icon
        size={22}
        className="mx-auto text-white/15"
      />

      <p className="mt-3 text-[10px] text-white/30">
        {text}
      </p>
    </div>
  );
}