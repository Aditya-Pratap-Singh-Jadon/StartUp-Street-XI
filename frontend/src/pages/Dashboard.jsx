import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  Check,
  LogOut,
  Plus,
  UserMinus,
  Crown,
  Pencil,
  Megaphone,
  CalendarClock,
  UploadCloud,
  ArrowUpRight,
  Trophy,
  Sparkles,
  UserRound,
  Clock3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Countdown, { useCountdown } from "../components/Countdown";
import NotificationBell from "../components/NotificationBell";
import {
  Loader,
  FieldError,
  inputCls,
  labelCls,
} from "../components/ui";
import { apiGet, apiSend, inviteLink } from "../lib/api";
import Background from "../components/Background";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const HOSTELS = [
  "MH-A", "MH-B", "MH-BX", "MH-C", "MH-D", "MH-DX", "MH-E",
  "MH-F", "MH-G", "MH-H", "MH-J", "MH-JX", "MH-K", "MH-L",
  "MH-M", "MH-MX", "MH-N", "MH-NX", "MH-P", "MH-Q", "MH-R",
  "MH-T", "LH-A", "LH-B", "LH-C", "LH-D", "LH-E", "LH-EX",
  "LH-F", "LH-G", "LH-GX", "LH-H", "LH-J", "LH-S",
];

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { live, done } = useCountdown();

  const [team, setTeam] = useState(undefined);
  const [timeline, setTimeline] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [cfg, setCfg] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [toast, setToast] = useState(null);
  const [teamErr, setTeamErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [copied, setCopied] = useState(false);

  const [profileForm, setProfileForm] = useState({
    reg_no: "",
    block: "A",
    room: "",
  });
  const [profileErr, setProfileErr] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!user) return;

      if (!silent) {
        setLoading(true);
        setErr(null);
      }

      try {
        await refreshProfile(user.id || user._id);

        const [t, tl, an, c] = await Promise.all([
          apiGet(`/api/teams?user_id=${user.id}`),
          apiGet("/api/timeline"),
          apiGet("/api/announcements"),
          apiGet("/api/config"),
        ]);

        setTeam(t);
        setTimeline(tl);
        setAnnouncements(an);
        setCfg(c);
        setRenameVal(t?.name || "");

        if (t) {
          try {
            const s = await apiGet(`/api/submissions?team_id=${t.id}`);
            setSubmission(s);
          } catch {
            setSubmission(null);
          }
        } else {
          setSubmission(null);
        }
      } catch (e) {
        if (!silent) {
          setErr(
            e instanceof Error ? e.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user, refreshProfile]
  );

  useEffect(() => {
    fetchAll();

    const id = setInterval(() => fetchAll(true), 15000);

    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!user) return null;

  const isLeader = !!team && team.leader_id === user.id;
  const teamMax = parseInt(cfg.team_max || "5", 10);
  const teamMin = parseInt(cfg.team_min || "3", 10);
  const subsOpen = (cfg.submissions_open || "false") === "true";

  const doCreate = async (e) => {
    e.preventDefault();
    setTeamErr(null);

    if (createName.trim().length < 2) {
      return setTeamErr("Team name must be at least 2 characters.");
    }

    setBusy(true);

    try {
      const t = await apiSend("/api/teams", "POST", {
        action: "create",
        name: createName.trim(),
        user_id: user.id,
      });

      setTeam(t);
      setRenameVal(t.name);
      setCreateName("");

      setToast(
        `Team created. Your Team Code is ${t.code} — share it to invite members.`
      );
    } catch (e) {
      setTeamErr(
        e instanceof Error ? e.message : "Could not create team"
      );
    } finally {
      setBusy(false);
    }
  };

  const doJoin = async (e) => {
    e.preventDefault();
    setTeamErr(null);

    if (!joinCode.trim()) {
      return setTeamErr("Enter a Team Code, e.g. SSXI-X7K4.");
    }

    setBusy(true);

    try {
      const t = await apiSend("/api/teams", "POST", {
        action: "join",
        code: joinCode.trim(),
        user_id: user.id,
      });

      setTeam(t);
      setRenameVal(t.name);
      setJoinCode("");
      setToast(`Welcome to ${t.name}.`);
    } catch (e) {
      setTeamErr(
        e instanceof Error ? e.message : "Could not join team"
      );
    } finally {
      setBusy(false);
    }
  };

  const doLeave = async () => {
    if (
      !confirm(
        "Leave this team? If you are the last member the team will be disbanded."
      )
    ) {
      return;
    }

    setBusy(true);
    setTeamErr(null);

    try {
      await apiSend("/api/teams", "POST", {
        action: "leave",
        user_id: user.id,
      });

      setTeam(null);
      setSubmission(null);
      setToast("You left the team.");
    } catch (e) {
      setTeamErr(
        e instanceof Error ? e.message : "Could not leave team"
      );
    } finally {
      setBusy(false);
    }
  };

  const doRename = async () => {
    if (!team || renameVal.trim().length < 2) {
      setTeamErr("Team name must be at least 2 characters.");
      return;
    }

    setBusy(true);
    setTeamErr(null);

    try {
      const updated = await apiSend("/api/teams", "PUT", {
        team_id: team.id,
        user_id: user.id,
        name: renameVal.trim(),
      });

      setTeam({ ...team, name: updated.name });
      setRenaming(false);
      setToast("Team name updated.");
    } catch (e) {
      setTeamErr(
        e instanceof Error ? e.message : "Could not rename team"
      );
    } finally {
      setBusy(false);
    }
  };

  const doRemove = async (target_id) => {
    if (!team || !confirm("Remove this member from the team?")) return;

    setBusy(true);
    setTeamErr(null);

    try {
      await apiSend("/api/teams", "POST", {
        action: "remove_member",
        team_id: team.id,
        user_id: user.id,
        target_id,
      });

      const t = await apiGet(`/api/teams?user_id=${user.id}`);
      setTeam(t);
    } catch (e) {
      setTeamErr(
        e instanceof Error ? e.message : "Could not remove member"
      );
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!team) return;

    try {
      await navigator.clipboard.writeText(inviteLink(team.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setToast(`Invite link: ${inviteLink(team.code)}`);
    }
  };

  const doCompleteProfile = async (e) => {
    e.preventDefault();
    setProfileErr(null);

    if (!profileForm.reg_no || profileForm.reg_no.trim().length < 8) {
      return setProfileErr("Please enter a valid Registration Number.");
    }

    if (
      !profileForm.room.trim() ||
      !/^(G\d*|\d+)$/i.test(profileForm.room.trim())
    ) {
      return setProfileErr("Please enter a valid room number.");
    }

    setProfileBusy(true);

    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          action: "complete-profile",
          reg_no: profileForm.reg_no,
          block: profileForm.block,
          room: profileForm.room,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to update profile"
        );
      }

      await refreshProfile(user.id || user._id);
    } catch (err) {
      setProfileErr(err.message);
    } finally {
      setProfileBusy(false);
    }
  };

  const needsProfileCompletion =
    profile?.participant_type === "vit_student" &&
    (!profile?.reg_no || !profile?.block || !profile?.room);

  /*
   * STARTUPSTREET XI — Participant Dashboard
   * Presentation only: the API/auth/state logic above is unchanged.
   *
   * The entire dashboard is deliberately designed as one viewport:
   * h-[100dvh] + overflow-hidden.
   */
  const panel =
    "rounded-[20px] border border-white/[0.11] bg-[#091225]/80 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.30)]";

  const inner =
    "rounded-[15px] border border-white/[0.08] bg-white/[0.035]";

  const IconBox = ({ children, violet = false }) => (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border ${violet
          ? "border-violet-300/15 bg-violet-300/9 text-violet-200"
          : "border-cyan-300/15 bg-cyan-300/9 text-cyan-200"
        }`}
    >
      {children}
    </span>
  );

  const SectionHead = ({ icon, title, right, violet = false }) => (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <IconBox violet={violet}>{icon}</IconBox>
        <div>
          <p className="text-[14px] font-bold uppercase tracking-[0.24em] text-white/42">
            {title}
          </p>
        </div>
      </div>
      {right}
    </div>
  );

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#040813] text-white isolate">
      <Background />

      {/* Atmospheric lighting over the city background */}
      <div className="pointer-events-none absolute inset-0 z-1 bg-[radial-gradient(circle_at_12%_8%,rgba(91,140,255,0.18),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(56,217,255,0.09),transparent_25%),radial-gradient(circle_at_78%_90%,rgba(139,92,246,0.16),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 z-1 bg-black/25" />

      <div className="relative z-10 flex h-dvh flex-col overflow-hidden">
        {toast && (
          <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-cyan-300/20 bg-[#071421]/85 px-4 py-3 shadow-[0_18px_45px_rgba(4,13,25,0.72),0_0_25px_rgba(56,217,255,0.18)] backdrop-blur-xl">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,217,255,0.9)]" />
              <p className="text-[11px] font-medium tracking-[0.04em] text-cyan-50/90">
                {toast}
              </p>
            </div>
          </div>
        )}

        {/* ───────────────── HEADER ───────────────── */}
        <header className="h-15.5 shrink-0 border-b border-white/10 bg-[#050b18]/78 backdrop-blur-2xl">
          <div className="mx-auto flex h-full max-w-385 items-center justify-between px-5 lg:px-8">
            <Link
              to="/"
              className="group flex items-center leading-none"
              aria-label="StartupStreet XI home"
            >
              <span className="font-display text-[25px] font-black uppercase tracking-[-0.075em] text-white transition group-hover:text-cyan-50 sm:text-[29px]">
                STARTUPSTREET
              </span>
              <span className="ml-2 font-display text-[25px] font-black uppercase tracking-[-0.075em] text-cyan-300 transition group-hover:text-cyan-200 sm:text-[29px]">
                XI
              </span>
              <span className="ml-4 hidden h-5 w-px bg-white/15 sm:block" />
              <span className="ml-4 hidden text-[9px] font-bold uppercase tracking-[0.22em] text-white/38 sm:block">
                Participant
              </span>
            </Link>

            <div className="flex items-center gap-1.5">
              <NotificationBell userId={user.id} className="shrink-0 z-1000" />

              <Link
                to="/"
                className="hidden h-8 items-center rounded-lg px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 transition hover:bg-white/5 hover:text-white sm:flex"
              >
                Home
              </Link>

              {profile?.role === "admin" && (
                <Link
                  to="/admin"
                  className="hidden h-8 items-center rounded-lg border border-cyan-300/15 bg-cyan-300/5 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200 sm:flex"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/2.5 px-3 text-[9px] font-bold uppercase tracking-[0.17em] text-white/45 transition hover:border-white/20 hover:text-white"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ───────────────── VIEWPORT ───────────────── */}
        <main className="mx-auto flex min-h-0 w-full max-w-385 flex-1 flex-col px-4 py-4 sm:px-5 lg:px-8">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader label="Loading your dashboard" />
            </div>
          ) : err ? (
            <div className="flex flex-1 items-center justify-center">
              <div className={`${panel} w-full max-w-md p-7`}>
                <p className="text-sm text-red-200">{err}</p>
                <button
                  onClick={fetchAll}
                  className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : needsProfileCompletion ? (
            <div className="flex flex-1 items-center justify-center">
              <div className={`${panel} w-full max-w-md p-7`}>
                <div className="mb-6">
                  <IconBox>
                    <UserRound size={17} />
                  </IconBox>
                  <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                    Registration
                  </p>
                  <h1 className="font-display mt-1.5 text-[38px] font-semibold tracking-[-0.045em]">
                    Complete your profile
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">
                    A few details are required to complete your event
                    registration.
                  </p>
                </div>

                <form onSubmit={doCompleteProfile} className="space-y-3.5">
                  <div>
                    <label htmlFor="reg_no" className={labelCls}>
                      Registration Number
                    </label>
                    <input
                      id="reg_no"
                      className={`${inputCls} mt-1.5`}
                      placeholder="22BCE0001"
                      value={profileForm.reg_no}
                      onChange={(e) =>
                        setProfileForm((f) => ({
                          ...f,
                          reg_no: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="block" className={labelCls}>
                        Hostel
                      </label>
                      <select
                        id="block"
                        className={`${inputCls} mt-1.5 cursor-pointer appearance-none`}
                        value={profileForm.block}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            block: e.target.value,
                          }))
                        }
                      >
                        {HOSTELS.map((h) => (
                          <option
                            key={h}
                            value={h}
                            className="bg-[#080d1c] text-white"
                          >
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="room" className={labelCls}>
                        Room Number
                      </label>
                      <input
                        id="room"
                        className={`${inputCls} mt-1.5`}
                        placeholder="G or 101"
                        value={profileForm.room}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            room: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <FieldError message={profileErr} />

                  <button
                    disabled={profileBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#050816] transition hover:bg-cyan-100 disabled:opacity-50"
                  >
                    {profileBusy ? "Saving..." : "Save details & continue"}
                    <ArrowUpRight size={14} />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* ───────────── HERO ROW ───────────── */}
              <div className="flex h-19.5 shrink-0 items-center justify-between gap-5">
                <div className="min-w-0">

                  <h1 className="font-display mt-1 truncate text-[34px] font-semibold leading-none tracking-[-0.055em] sm:text-[40px]">
                    Hello, {profile?.name || "Founder"}.
                  </h1>

                  <p className="mt-1 truncate text-[11px] text-white/38">
                    {profile?.email}
                    {profile?.reg_no ? `  ·  ${profile.reg_no}` : ""}
                    {"  ·  "}
                    <span className="text-white/62">
                      {isLeader
                        ? "Team Leader"
                        : team
                          ? "Participant"
                          : "No team yet"}
                    </span>
                  </p>
                </div>

                <div className="shrink-0">
                  <Countdown />
                </div>
              </div>

              {/* ───────────── DASHBOARD GRID ───────────── */}
              <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(250px,0.78fr)_minmax(250px,0.78fr)]">
                {/* TEAM + SUBMISSION */}
                <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_104px] gap-4">
                  <section
                    className={`${panel} flex min-h-0 flex-col overflow-hidden`}
                    aria-label="Your team"
                  >
                    <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-4 py-3">
                      <SectionHead
                        icon={<Users size={14} />}
                        title="Your team"
                        right={
                          team && (
                            <button
                              onClick={copyInvite}
                              className="flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/5.5 px-2.5 py-1.5 font-mono text-[10px] font-bold tracking-[0.12em] text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/9"
                            >
                              {copied ? (
                                <Check size={11} />
                              ) : (
                                <Copy size={11} />
                              )}
                              {team.code}
                            </button>
                          )
                        }
                      />
                    </div>

                    <div className="min-h-0 flex-1 p-4">
                      {teamErr && (
                        <div className="mb-2 rounded-lg border border-red-300/15 bg-red-300/5.5 px-3 py-2 text-[10px] text-red-200">
                          {teamErr}
                        </div>
                      )}

                      {!team ? (
                        <div className="grid h-full gap-3 md:grid-cols-2">
                          <form
                            onSubmit={doCreate}
                            className={`${inner} flex min-h-0 flex-col justify-between p-4`}
                          >
                            <div>
                              <IconBox>
                                <Plus size={15} />
                              </IconBox>
                              <h2 className="font-display mt-4 text-[28px] font-semibold tracking-[-0.045em]">
                                Create a team
                              </h2>
                              <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/42">
                                Start your team and become its leader.
                              </p>
                            </div>

                            <div>
                              <label
                                htmlFor="tname"
                                className={labelCls}
                              >
                                Team name
                              </label>
                              <input
                                id="tname"
                                className={`${inputCls} mt-1`}
                                placeholder="e.g. Street Vendors"
                                value={createName}
                                onChange={(e) =>
                                  setCreateName(e.target.value)
                                }
                                maxLength={60}
                              />
                              <button
                                disabled={busy}
                                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#050816] shadow-[0_8px_25px_rgba(255,255,255,0.08)] transition hover:bg-cyan-100 disabled:opacity-50"
                              >
                                Create team
                                <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </form>

                          <form
                            onSubmit={doJoin}
                            className={`${inner} flex min-h-0 flex-col justify-between p-4`}
                          >
                            <div>
                              <IconBox violet>
                                <Users size={15} />
                              </IconBox>
                              <h2 className="font-display mt-4 text-[28px] font-semibold tracking-[-0.045em]">
                                Join a team
                              </h2>
                              <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-white/42">
                                Use the unique code shared by your leader.
                              </p>
                            </div>

                            <div>
                              <label
                                htmlFor="jcode"
                                className={labelCls}
                              >
                                Team code
                              </label>
                              <input
                                id="jcode"
                                className={`${inputCls} mt-1 font-mono uppercase`}
                                placeholder="SSXI-XXXX"
                                value={joinCode}
                                onChange={(e) =>
                                  setJoinCode(e.target.value.toUpperCase())
                                }
                                maxLength={12}
                              />
                              <button
                                disabled={busy}
                                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-white/13 bg-white/2.5 px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-violet-300/35 hover:bg-violet-300/6 hover:text-violet-100 disabled:opacity-50"
                              >
                                Join team
                                <ArrowUpRight size={12} />
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex h-full min-h-0 flex-col">
                          <div className="flex shrink-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              {renaming ? (
                                <div className="flex gap-2">
                                  <input
                                    className={`${inputCls} h-9!`}
                                    value={renameVal}
                                    onChange={(e) =>
                                      setRenameVal(e.target.value)
                                    }
                                    maxLength={60}
                                    aria-label="Team name"
                                  />
                                  <button
                                    onClick={doRename}
                                    disabled={busy}
                                    className="rounded-lg bg-white px-3 text-[9px] font-black uppercase tracking-wider text-black disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRenaming(false);
                                      setRenameVal(team.name);
                                    }}
                                    className="rounded-lg border border-white/10 px-3 text-[9px] font-bold uppercase tracking-wider text-white/55"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <h2 className="font-display truncate text-[34px] font-semibold leading-none tracking-[-0.055em]">
                                    {team.name}
                                  </h2>
                                  {isLeader && (
                                    <button
                                      onClick={() => setRenaming(true)}
                                      aria-label="Rename team"
                                      className="rounded-md p-1.5 text-white/30 transition hover:bg-cyan-300/10 hover:text-cyan-200"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                  )}
                                </div>
                              )}

                              <p className="mt-1.5 text-[11px] text-white/38">
                                {team.members.length}/{teamMax} members
                                <span className="mx-1.5 text-white/15">
                                  •
                                </span>
                                {isLeader ? "You are the leader" : "Team member"}
                              </p>
                            </div>

                            <p className="shrink-0 rounded-full border border-white/8 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-white/32">
                              Min {teamMin} / Max {teamMax}
                            </p>
                          </div>

                          <div className="mt-4 flex min-h-0 flex-1 flex-col">
                            <div className="mb-2 flex shrink-0 items-center justify-between">
                              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/28">
                                Team members
                              </p>
                              <button
                                onClick={copyInvite}
                                className="text-[8px] font-bold uppercase tracking-[0.16em] text-cyan-200/60 transition hover:text-cyan-200 sm:hidden"
                              >
                                {copied ? "Copied" : "Copy invite"}
                              </button>
                            </div>

                            <ul className="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {team.members.map((m) => {
                                const isMe = m.user_id === user.id;
                                const isLead = m.user_id === team.leader_id;

                                return (
                                  <li
                                    key={m.user_id}
                                    className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/7.5 bg-white/3.5 px-2.5 py-2"
                                  >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                      <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] font-display text-[10px] font-bold ${isLead
                                            ? "border border-cyan-300/25 bg-cyan-300/9 text-cyan-100"
                                            : "bg-white/6.5 text-white/70"
                                          }`}
                                      >
                                        {(m.profile?.name || "?")
                                          .split(" ")
                                          .map((w) => w[0])
                                          .slice(0, 2)
                                          .join("")
                                          .toUpperCase()}
                                      </span>

                                      <div className="min-w-0">
                                        <p className="truncate text-[11px] font-semibold text-white/78">
                                          {m.profile?.name || "Member"}
                                          {isMe ? " (you)" : ""}
                                        </p>
                                        <p className="truncate text-[8px] text-white/28">
                                          {m.profile?.email || ""}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                      {isLead && (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-300/8 text-cyan-200">
                                          <Crown size={10} />
                                        </span>
                                      )}

                                      {isLeader && !isMe && (
                                        <button
                                          onClick={() =>
                                            doRemove(m.user_id)
                                          }
                                          disabled={busy}
                                          aria-label={`Remove ${m.profile?.name || "member"
                                            }`}
                                          className="rounded-md p-1 text-white/18 transition hover:bg-red-300/10 hover:text-red-200 disabled:opacity-40"
                                        >
                                          <UserMinus size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          <div className="mt-2 flex shrink-0 items-center justify-between border-t border-white/[0.07] pt-2">
                            <p className="text-[8px] text-white/24">
                              Formed {fmtDate(team.created_at)}
                            </p>
                            <button
                              onClick={doLeave}
                              disabled={busy}
                              className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/28 transition hover:text-red-200 disabled:opacity-50"
                            >
                              Leave team
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SUBMISSION */}
                  <section
                    className={`${panel} flex min-h-0 items-center justify-between gap-4 overflow-hidden px-4 py-3`}
                    aria-label="Final review submission"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconBox violet>
                        <UploadCloud size={16} />
                      </IconBox>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-bold uppercase tracking-[0.19em] text-white/48">
                            Final review
                          </p>
                          {submission ? (
                            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2 py-0.5 text-[7px] font-black uppercase tracking-wider text-emerald-200">
                              Submitted
                            </span>
                          ) : (
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[7px] font-black uppercase tracking-wider ${subsOpen
                                  ? "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200"
                                  : "border-white/10 text-white/30"
                                }`}
                            >
                              {subsOpen ? "Open" : "Closed"}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 truncate text-[10px] text-white/32">
                          {!team
                            ? "Join or create a team to unlock submissions."
                            : !subsOpen && !submission
                              ? "Submissions are currently closed."
                              : "Round 1 and Round 2 are managed in the portal."}
                        </p>
                      </div>
                    </div>

                    {team && (subsOpen || submission) && (
                      <Link
                        to="/submissions"
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#050816] shadow-[0_7px_24px_rgba(255,255,255,0.08)] transition hover:bg-cyan-100"
                      >
                        Open portal
                        <ArrowUpRight size={14} />
                      </Link>
                    )}
                  </section>
                </div>

                {/* ANNOUNCEMENTS */}
                <section
                  className={`${panel} flex min-h-0 flex-col overflow-hidden`}
                  aria-label="Announcements"
                >
                  <div className="border-b border-white/8 px-4 py-3">
                    <SectionHead
                      icon={<Megaphone size={14} />}
                      title="Announcements"
                      right={
                        <Sparkles
                          size={13}
                          className="text-white/20"
                        />
                      }
                    />
                  </div>

                  <div className="relative min-h-0 flex-1 overflow-hidden p-2.5">
                    {announcements.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center">
                        <p className="text-[10px] text-white/25">
                          No announcements yet.
                        </p>
                      </div>
                    ) : (
                      <div className="ml-1 h-full overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        <div className="flex w-full flex-col items-center gap-2">
                          {announcements.slice(0, 5).map((a, i) => (
                            <article
                              key={a.id}
                              className={`min-h-32 w-full rounded-xl border border-white/6.5 bg-white/2.5 px-3 py-2.5 ${i === 0
                                  ? "border-cyan-300/10 bg-cyan-300/2.5"
                                  : ""
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.priority === "urgent"
                                      ? "bg-cyan-300 shadow-[0_0_10px_rgba(56,217,255,0.8)]"
                                      : "bg-white/20"
                                    }`}
                                />
                                <p className="truncate text-[16px] font-semibold text-white/75">
                                  {a.title}
                                </p>

                                {a.priority !== "normal" && (
                                  <span className="ml-auto shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/6 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-cyan-200">
                                    {a.priority}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-white/34">
                                {a.content}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-[10px] text-white/20">
                                <Clock3 size={8} />
                                {fmtDate(a.created_at)}
                              </p>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* TIMELINE + ACCOUNT */}
                <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_92px] gap-4">
                  <section
                    className={`${panel} flex min-h-0 flex-col overflow-hidden`}
                    aria-label="Live timeline"
                  >
                    <div className="border-b border-white/8 px-4 py-3">
                      <SectionHead
                        icon={<CalendarClock size={14} />}
                        title="Live timeline"
                        violet
                      />
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden px-4 py-2.5">
                      {timeline.length === 0 ? (
                        <div className="flex h-full items-center">
                          <p className="text-[10px] text-white/25">
                            Schedule coming soon.
                          </p>
                        </div>
                      ) : (
                        <div className="h-full overflow-y-auto overscroll-contain pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          <ol className="flex min-h-full flex-col items-stretch gap-6 pt-0.5">
                            {timeline.slice(0, 7).map((t) => {
                              const isPast = !!t.event_time && new Date(t.event_time).getTime() < Date.now();
                              const isActive = t.is_current || (!t.is_completed && !isPast);

                              return (
                                <li
                                  key={t.id}
                                  className="flex min-h-0 items-center gap-2.5"
                                >
                                  <div className="flex w-3 shrink-0 justify-center">
                                    <span
                                      className={`h-1.5 w-1.5 rotate-45 ${isPast
                                          ? "bg-white/20"
                                          : isActive
                                            ? "bg-cyan-300 shadow-[0_0_11px_rgba(56,217,255,0.8)]"
                                            : "border border-white/25"
                                        }`}
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <p
                                      className={`truncate text-[16px] font-semibold ${isPast
                                          ? "text-white/35"
                                          : isActive
                                            ? "white"
                                            : "text-white/30"
                                        }`}
                                    >
                                      {t.title}
                                    </p>
                                    {t.event_time && (
                                      <p className={`truncate text-[10px] ${isPast ? "text-white/18" : "text-white/22"}`}>
                                        {fmtDate(t.event_time)}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/#timeline"
                      className="flex shrink-0 items-center justify-between border-t border-white/8 px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.18em] text-cyan-200/60 transition hover:bg-cyan-300/[0.035] hover:text-cyan-200"
                    >
                      Full schedule
                      <ArrowUpRight size={10} />
                    </Link>
                  </section>

                  {/* ACCOUNT */}
                  <section
                    className={`${panel} flex min-h-0 items-center justify-between gap-3 px-4 py-3`}
                    aria-label="Account"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-white/8 bg-white/4.5 text-white/45">
                        <UserRound size={13} />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-white/70">
                          {profile?.name}
                        </p>
                        <p className="truncate text-[10px] text-white/25">
                          {profile?.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/results"
                      className="shrink-0 text-[8px] font-black uppercase tracking-[0.16em] text-cyan-200/65 transition hover:text-cyan-100"
                    >
                      Results
                    </Link>
                  </section>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
