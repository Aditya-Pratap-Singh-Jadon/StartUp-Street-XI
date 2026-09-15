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
  FileText,
  Github,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Countdown, { useCountdown } from "../components/Countdown";
import NotificationBell from "../components/NotificationBell";
import {
  Loader,
  Empty,
  FieldError,
  inputCls,
  labelCls,
} from "../components/ui";
import { apiGet, apiSend, inviteLink, EVENT_START_ISO } from "../lib/api";
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
  "MH-A",
  "MH-B",
  "MH-BX",
  "MH-C",
  "MH-D",
  "MH-DX",
  "MH-E",
  "MH-F",
  "MH-G",
  "MH-H",
  "MH-J",
  "MH-JX",
  "MH-K",
  "MH-L",
  "MH-M",
  "MH-MX",
  "MH-N",
  "MH-NX",
  "MH-P",
  "MH-Q",
  "MH-R",
  "MH-T",
  "LH-A",
  "LH-B",
  "LH-C",
  "LH-D",
  "LH-E",
  "LH-EX",
  "LH-F",
  "LH-G",
  "LH-GX",
  "LH-H",
  "LH-J",
  "LH-S",
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
  const [teamMsg, setTeamMsg] = useState(null);
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

  const fetchAll = useCallback(async (silent = false) => {
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
      } else setSubmission(null);
    } catch (e) {
      if (!silent) setErr(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, refreshProfile]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(() => fetchAll(true), 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  if (!user) return null;
  const isLeader = !!team && team.leader_id === user.id;
  const teamMax = parseInt(cfg.team_max || "5", 10);
  const teamMin = parseInt(cfg.team_min || "3", 10);
  const subsOpen = (cfg.submissions_open || "false") === "true";
  const eventLabel = done
    ? "Event concluded"
    : live
      ? "Event live"
      : "Event upcoming";

  const doCreate = async (e) => {
    e.preventDefault();
    setTeamErr(null);
    setTeamMsg(null);
    if (createName.trim().length < 2)
      return setTeamErr("Team name must be at least 2 characters.");
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
      setTeamMsg(
        `Team created. Your Team Code is ${t.code} — share it to invite members.`,
      );
    } catch (e) {
      setTeamErr(e instanceof Error ? e.message : "Could not create team");
    } finally {
      setBusy(false);
    }
  };

  const doJoin = async (e) => {
    e.preventDefault();
    setTeamErr(null);
    setTeamMsg(null);
    if (!joinCode.trim())
      return setTeamErr("Enter a Team Code, e.g. SSXI-X7K4.");
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
      setTeamMsg(`Welcome to ${t.name}.`);
    } catch (e) {
      setTeamErr(e instanceof Error ? e.message : "Could not join team");
    } finally {
      setBusy(false);
    }
  };

  const doLeave = async () => {
    if (
      !confirm(
        "Leave this team? If you are the last member the team will be disbanded.",
      )
    )
      return;
    setBusy(true);
    setTeamErr(null);
    try {
      await apiSend("/api/teams", "POST", {
        action: "leave",
        user_id: user.id,
      });
      setTeam(null);
      setSubmission(null);
      setTeamMsg("You left the team.");
    } catch (e) {
      setTeamErr(e instanceof Error ? e.message : "Could not leave team");
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
      setTeamMsg("Team name updated.");
    } catch (e) {
      setTeamErr(e instanceof Error ? e.message : "Could not rename team");
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
      setTeamErr(e instanceof Error ? e.message : "Could not remove member");
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
      setTeamMsg(`Invite link: ${inviteLink(team.code)}`);
    }
  };

  const doCompleteProfile = async (e) => {
    e.preventDefault();
    setProfileErr(null);
    if (!profileForm.reg_no || profileForm.reg_no.trim().length < 8)
      return setProfileErr("Please enter a valid Registration Number.");
    if (
      !profileForm.room.trim() ||
      !/^(G\d*|\d+)$/i.test(profileForm.room.trim())
    )
      return setProfileErr("Please enter a valid room number.");
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
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
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

  return (
    <div className="relative min-h-screen isolate overflow-hidden bg-black text-white">
      <Background />
      <div className="relative z-10 flex min-h-screen flex-col bg-black/40 backdrop-blur-sm">
        {/* top bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="flex items-baseline gap-2.5">
              <span className="bg-white px-2 py-1 font-display text-sm font-bold text-black">
                SS—XI
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60 sm:inline">
                Participant
              </span>
            </Link>
              <div className="flex items-center gap-2.5">
              <NotificationBell userId={user.id} />
              <Link
                to="/"
                className="hidden border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:border-cyan-300 hover:text-cyan-300 sm:inline-block"
              >
                Home
              </Link>
              {profile?.role === "admin" && (
                <Link
                  to="/admin"
                  className="hidden border border-cyan-400/40 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300 sm:inline-block"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="inline-flex items-center gap-1.5 border border-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/70 hover:border-cyan-300 hover:text-cyan-300"
              >
                <LogOut size={13} />{" "}
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {loading ? (
            <Loader label="Loading your dashboard" />
          ) : err ? (
            <div className="border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              {err}{" "}
              <button
                onClick={fetchAll}
                className="font-semibold text-white underline"
              >
                Retry
              </button>
            </div>
          ) : needsProfileCompletion ? (
            <div className="mx-auto w-full max-w-md border border-white/10 bg-black/80 p-8 backdrop-blur-xl">
              <h1 className="font-display text-3xl font-medium tracking-tight">
                Complete your profile
              </h1>
              <p className="mt-2 mb-6 text-sm text-white/60">
                As a VIT student, we need a few more details to complete your
                registration for the event.
              </p>
              <form onSubmit={doCompleteProfile} className="space-y-4">
                <div>
                  <label htmlFor="reg_no" className={labelCls}>
                    Registration Number
                  </label>
                  <input
                    id="reg_no"
                    className={inputCls}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="block" className={labelCls}>
                      Hostel
                    </label>
                    <div className="relative">
                      <select
                        id="block"
                        className={`${inputCls} appearance-none cursor-pointer`}
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
                            className="bg-black text-white"
                          >
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="room" className={labelCls}>
                      Room Number
                    </label>
                    <input
                      id="room"
                      className={inputCls}
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
                  className="inline-flex w-full items-center justify-center gap-2 bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black hover:bg-cyan-100 disabled:opacity-50"
                >
                  {profileBusy ? "Saving..." : "Save details & continue"}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* greeting */}
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                    {eventLabel} · 18–19 September
                  </p>
                  <h1 className="font-display mt-2 text-4xl tracking-tight sm:text-5xl">
                    Hello, {profile?.name || "founder"}.
                  </h1>
                  <p className="mt-2 text-sm text-white/60">
                    {profile?.email}
                    {profile?.reg_no ? ` · ${profile.reg_no}` : ""} ·{" "}
                    {isLeader
                      ? "Team Leader"
                      : team
                        ? "Participant"
                        : "No team yet"}
                  </p>
                </div>
                <Countdown />
              </div>


              <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* LEFT */}
                <div className="space-y-6">
                  {/* TEAM CARD */}
                  <section
                    className="border border-white/10 bg-white/5 backdrop-blur-md"
                    aria-label="Your team"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:px-6">
                      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                        <Users size={14} className="text-cyan-300" /> Your team
                      </p>
                      {team && (
                        <span className="bg-white px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-black">
                          {team.code}
                        </span>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      {teamMsg && (
                        <p className="mb-3 border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-[13px] text-emerald-200">
                          {teamMsg}
                        </p>
                      )}
                      {teamErr && (
                        <p className="mb-3 border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] text-red-200">
                          {teamErr}
                        </p>
                      )}
                      {!team ? (
                        <div className="grid gap-6 md:grid-cols-2">
                          <form
                            onSubmit={doCreate}
                            className="border border-white/10 bg-white/5 p-5"
                          >
                            <p className="font-display text-xl">
                              Create a team
                            </p>
                            <p className="mt-1 text-[13px] text-white/60">
                              You become the leader and receive a unique Team
                              Code.
                            </p>
                            <label
                              htmlFor="tname"
                              className={`${labelCls} mt-4`}
                            >
                              Team name
                            </label>
                            <input
                              id="tname"
                              className={inputCls}
                              placeholder="e.g. Street Vendors"
                              value={createName}
                              onChange={(e) => setCreateName(e.target.value)}
                              maxLength={60}
                            />
                            <button
                              disabled={busy}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-white px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-black hover:bg-cyan-100 disabled:opacity-50"
                            >
                              <Plus size={14} /> Create team
                            </button>
                          </form>
                          <form
                            onSubmit={doJoin}
                            className="border border-white/10 bg-white/5 p-5"
                          >
                            <p className="font-display text-xl">
                              Join with code
                            </p>
                            <p className="mt-1 text-[13px] text-white/60">
                              Ask your leader for the Team Code, or open an
                              invite link.
                            </p>
                            <label
                              htmlFor="jcode"
                              className={`${labelCls} mt-4`}
                            >
                              Team code
                            </label>
                            <input
                              id="jcode"
                              className={`${inputCls} font-mono uppercase`}
                              placeholder="SSXI-XXXX"
                              value={joinCode}
                              onChange={(e) =>
                                setJoinCode(e.target.value.toUpperCase())
                              }
                              maxLength={12}
                            />
                            <button
                              disabled={busy}
                              className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-white/25 px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] hover:border-cyan-300 hover:text-cyan-300 disabled:opacity-50"
                            >
                              Join team
                            </button>
                          </form>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              {renaming ? (
                                <div className="flex gap-2">
                                  <input
                                    className={inputCls}
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
                                    className="bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRenaming(false);
                                      setRenameVal(team.name);
                                    }}
                                    className="border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5">
                                  <h2 className="font-display text-3xl tracking-tight">
                                    {team.name}
                                  </h2>
                                  {isLeader && (
                                    <button
                                      onClick={() => setRenaming(true)}
                                      aria-label="Rename team"
                                      className="p-1.5 text-white/45 hover:text-cyan-300"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                  )}
                                </div>
                              )}
                              <p className="mt-1.5 text-[13px] text-white/60">
                                {team.members.length} of {teamMax} members ·{" "}
                                {isLeader ? "You are the leader" : "Member"} ·
                                formed {fmtDate(team.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={copyInvite}
                              className="inline-flex items-center gap-1.5 border border-white/20 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] hover:border-cyan-300 hover:text-cyan-300"
                            >
                              {copied ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}{" "}
                              {copied ? "Copied" : "Copy invite link"}
                            </button>
                          </div>
                          <p className="mt-3 break-all border border-dashed border-white/20 bg-white/5 px-3.5 py-2.5 font-mono text-xs text-white/70">
                            {inviteLink(team.code)}
                          </p>
                          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
                            {team.members.map((m) => {
                              const isMe = m.user_id === user.id;
                              const isLead = m.user_id === team.leader_id;
                              return (
                                <li
                                  key={m.user_id}
                                  className="flex items-center justify-between gap-3 py-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`flex h-9 w-9 items-center justify-center font-display text-sm italic ${isLead ? "bg-cyan-900 text-white border border-cyan-400" : "bg-white/10 text-white"}`}
                                    >
                                      {(m.profile?.name || "?")
                                        .split(" ")
                                        .map((w) => w[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold">
                                        {m.profile?.name || "Member"}
                                        {isMe ? " (you)" : ""}
                                      </p>
                                      <p className="text-xs text-white/50">
                                        {m.profile?.email || ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isLead && (
                                      <span className="inline-flex items-center gap-1 bg-cyan-900/40 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200 border border-cyan-500/30">
                                        <Crown size={11} /> Leader
                                      </span>
                                    )}
                                    {isLeader && !isMe && (
                                      <button
                                        onClick={() => doRemove(m.user_id)}
                                        disabled={busy}
                                        aria-label={`Remove ${m.profile?.name || "member"}`}
                                        className="p-1.5 text-white/40 hover:text-cyan-300 disabled:opacity-40"
                                      >
                                        <UserMinus size={15} />
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          <button
                            onClick={doLeave}
                            disabled={busy}
                            className="mt-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white/50 underline decoration-white/40 underline-offset-4 hover:text-cyan-300 disabled:opacity-50"
                          >
                            Leave team
                          </button>
                        </>
                      )}
                    </div>
                  </section>

                  {/* SUBMISSION CARD */}
                  <section
                    className="border border-white/10 bg-black/60 text-white"
                    aria-label="Final review submission"
                  >
                    <div className="flex items-center justify-between border-b border-white/15 px-5 py-3.5 sm:px-6">
                      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                        <UploadCloud size={14} className="text-cyan-400" />{" "}
                        Final review submission
                      </p>
                      {submission ? (
                        <span className="bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200 border border-emerald-400/30">
                          Submitted
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] border ${subsOpen ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-white/20 text-white/60"}`}
                        >
                          {subsOpen ? "Open" : "Closed"}
                        </span>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      {!team ? (
                        <p className="text-sm text-white/65">
                          Join or create a team to unlock submissions.
                          Submissions belong to the team, not to individuals.
                        </p>
                      ) : !subsOpen && !submission ? (
                        <p className="text-sm text-white/65">
                          Submissions are currently closed. The organizers will
                          open the Final Review Submission page during the event
                          — watch announcements.
                        </p>
                      ) : (
                        <>
                          {team.is_selected_for_jury && (
                            <div className="mb-5 bg-cyan-900/30 border border-cyan-400/50 p-4">
                              <p className="text-sm font-bold text-white">
                                🏆 Selected for Jury Round!
                              </p>
                              <p className="text-xs text-white/80 mt-1">
                                Your team has advanced to the final jury
                                presentation.
                              </p>
                            </div>
                          )}
                          <p className="text-sm text-white/65 mb-5">
                            Submissions for Round 1 (Internal) and Round 2
                            (Jury) are managed in the dedicated portal.
                          </p>
                          <Link
                            to="/submissions"
                            className="inline-flex items-center gap-2 bg-white px-6 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-cyan-100"
                          >
                            Go to Submissions Portal
                          </Link>
                        </>
                      )}
                    </div>
                  </section>
                </div>

                {/* RIGHT */}
                <div className="space-y-6">
                  <section
                    className="border border-white/10 bg-white/5 backdrop-blur-md"
                    aria-label="Announcements"
                  >
                    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
                      <Megaphone size={14} className="text-cyan-300" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                        Announcements
                      </p>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto">
                      {announcements.length === 0 && (
                        <p className="px-5 py-6 text-sm text-white/50">
                          No announcements yet.
                        </p>
                      )}
                      {announcements.slice(0, 8).map((a) => (
                        <article
                          key={a.id}
                          className="border-b border-white/10 px-5 py-4 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{a.title}</p>
                            {a.priority !== "normal" && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${a.priority === "urgent" ? "bg-cyan-300 text-black" : "border border-cyan-300/40 text-cyan-300"}`}
                              >
                                {a.priority}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line text-white/65">
                            {a.content}
                          </p>
                          <p className="mt-1.5 text-[11px] text-white/40">
                            {fmtDate(a.created_at)}
                          </p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section
                    className="border border-white/10 bg-white/5 backdrop-blur-md"
                    aria-label="Live timeline"
                  >
                    <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
                      <CalendarClock size={14} className="text-cyan-300" />
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                        Live timeline
                      </p>
                    </div>
                    <ol className="max-h-[340px] overflow-y-auto px-5 py-4">
                      {timeline.length === 0 && (
                        <p className="py-2 text-sm text-white/50">
                          Schedule coming soon.
                        </p>
                      )}
                      {timeline.map((t) => (
                        <li
                          key={t.id}
                          className="relative border-l border-white/15 py-2.5 pr-1 pl-5 last:pb-0"
                        >
                          <span
                            className={`absolute top-3.5 -left-[5px] h-2.5 w-2.5 rotate-45 ${t.is_current ? "bg-cyan-300" : t.is_completed ? "bg-cyan-300/35" : "border border-white/35 bg-black"}`}
                            aria-hidden
                          />
                          <p
                            className={`text-sm font-semibold ${t.is_current ? "text-cyan-300" : ""}`}
                          >
                            {t.title}
                          </p>
                          {t.event_time && (
                            <p className="text-[11px] text-white/45">
                              {fmtDate(t.event_time)}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                    <Link
                      to="/#timeline"
                      className="block border-t border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300 hover:underline"
                    >
                      Full schedule
                    </Link>
                  </section>

                  <section
                    className="border border-white/10 bg-white/5 p-5 backdrop-blur-md"
                    aria-label="Account"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
                      Account
                    </p>
                    <p className="font-display mt-2 text-xl">{profile?.name}</p>
                    <p className="text-[13px] text-white/60">
                      {profile?.email}
                    </p>
                    <FieldError message={null} />
                    <Link
                      to="/results"
                      className="mt-4 inline-block text-[12px] font-bold uppercase tracking-[0.16em] text-cyan-300 underline underline-offset-4"
                    >
                      View results
                    </Link>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
