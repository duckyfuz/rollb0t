"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const SAMPLE_USER = "r0-01";
const INTENSITY_PRESETS = [1, 2, 3];

type UserResponse = {
  id: string;
  username: string;
  is_admin: boolean;
};

type StatusResponse = {
  id: number;
  user_uuid: string;
  is_enabled: boolean;
  theme?: string | null;
  request?: string | null;
  image_url?: string | null;
  sound_url?: string | null;
  created_at: string;
};

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

type UserCheckStatus = "idle" | "checking" | "found" | "missing" | "error";

export default function Home() {
  const [armed, setArmed] = useState(false);
  const [mode, setMode] = useState<"duck" | "transform">("duck");
  const [requestText, setRequestText] = useState("");
  const [transformLevel, setTransformLevel] = useState(2);
  const [emergency] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [userId, setUserId] = useState("");
  const [verifiedUser, setVerifiedUser] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [soundUrl, setSoundUrl] = useState("");
  const [userStatus, setUserStatus] = useState<UserCheckStatus>("idle");
  const [userStatusMessage, setUserStatusMessage] = useState("");

  useEffect(() => {
    if (!armed) {
      setActiveSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setActiveSeconds((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [armed]);

  const normalizedRequest = requestText.trim();
  const themeCaps = normalizedRequest.toUpperCase();
  const sessionTime = formatDuration(activeSeconds);
  const isVerified = userStatus === "found";
  const intensitySuffix = `0${Math.min(3, Math.max(1, transformLevel))}`;
  const effectiveTheme =
    mode === "duck" ? `duck_${intensitySuffix}` : `transform_${intensitySuffix}`;

  const statusLabel = emergency
    ? "Rollback engaged"
    : armed
      ? "Console active"
      : "Console idle";

  useEffect(() => {
    if (!isVerified || !verifiedUser) return;
    const timer = setTimeout(() => {
      void syncStatus(armed);
    }, 500);
    return () => clearTimeout(timer);
  }, [
    armed,
    mode,
    requestText,
    imageUrl,
    soundUrl,
    transformLevel,
    isVerified,
    verifiedUser,
  ]);

  const syncStatus = async (nextEnabled: boolean) => {
    if (!verifiedUser) return;
    try {
      const response = await fetch(`${API_BASE}/user/${verifiedUser}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: nextEnabled,
          theme: effectiveTheme,
          request: mode === "transform" ? normalizedRequest || null : null,
          image_url: imageUrl || null,
          sound_url: soundUrl || null,
        }),
      });
      if (!response.ok) {
        throw new Error("Status update failed");
      }
      setUserStatusMessage("Status synced.");
    } catch (error) {
      setUserStatusMessage("Failed to sync status.");
    }
  };



  const handleUserCheck = async () => {
    const trimmed = userId.trim();
    if (!trimmed) {
      setUserStatus("error");
      setUserStatusMessage("Enter a user ID to check.");
      return;
    }

    setUserStatus("checking");
    setUserStatusMessage("Checking user...");
    try {
      const response = await fetch(`${API_BASE}/users/${trimmed}`);
      if (!response.ok) {
        setUserStatus("missing");
        setUserStatusMessage(`User ${trimmed} not found.`);
        setVerifiedUser(null);
        return;
      }
      const user = (await response.json()) as UserResponse;
      const statusResponse = await fetch(
        `${API_BASE}/users/${user.username}/status`
      );
      if (!statusResponse.ok) {
        setUserStatus("error");
        setUserStatusMessage("Unable to load user status.");
        setVerifiedUser(null);
        return;
      }
      const statuses = (await statusResponse.json()) as StatusResponse[];
      if (statuses.length === 0) {
        const createResponse = await fetch(
          `${API_BASE}/user/${user.username}/status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              is_enabled: false,
              theme: "duck",
            }),
          }
        );
        if (!createResponse.ok) {
          setUserStatus("error");
          setUserStatusMessage("No status entry found for user.");
          setVerifiedUser(null);
          return;
        }
        const createdStatus = (await createResponse.json()) as StatusResponse;
        statuses.push(createdStatus);
      }
      const latestStatus = statuses.sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      )[statuses.length - 1];
      setVerifiedUser(user.username);
      if (latestStatus.theme) {
        const themeValue = latestStatus.theme.toLowerCase();
        if (themeValue === "duck" || themeValue.startsWith("duck_")) {
          setMode("duck");
          if (themeValue.startsWith("duck_")) {
            const level = Number(themeValue.replace("duck_", ""));
            if (!Number.isNaN(level)) {
              setTransformLevel(Math.min(3, Math.max(1, level)));
            }
          }
        } else if (themeValue.startsWith("transform_")) {
          const level = Number(themeValue.replace("transform_", ""));
          setMode("transform");
          if (!Number.isNaN(level)) {
            setTransformLevel(Math.min(3, Math.max(1, level)));
          }
        } else {
          setMode("transform");
        }
      }
      setRequestText(latestStatus.request || "");
      setImageUrl(latestStatus.image_url || "");
      setSoundUrl(latestStatus.sound_url || "");

      setUserStatus("found");
      setUserStatusMessage(`User ${user.username} verified.`);
    } catch (error) {
      setUserStatus("error");
      setUserStatusMessage("User verification failed.");
      setVerifiedUser(null);
    }
  };

  return (
    <div className="page min-h-screen text-[15px] text-[var(--foreground)]">
      <div className="absolute inset-0 -z-10">
        <div className="glow-orb absolute left-[-120px] top-[-160px] h-[300px] w-[300px] rounded-full bg-[rgba(91,209,183,0.45)] blur-[120px]" />
        <div className="glow-orb absolute right-[-120px] top-[20%] h-[260px] w-[260px] rounded-full bg-[rgba(244,162,89,0.4)] blur-[110px]" />
        <div className="glow-orb absolute left-[20%] bottom-[-180px] h-[320px] w-[320px] rounded-full bg-[rgba(224,113,63,0.35)] blur-[130px]" />
        <div className="grain absolute inset-0 opacity-40" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-10 pt-8 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--panel-border)] bg-[rgba(16,39,47,0.8)] text-xl font-semibold text-[var(--accent)] shadow-[var(--shadow)]">
            R0
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Control Room
            </div>
            <div className="text-lg font-semibold uppercase tracking-[0.12em] text-white">
              rollb0t
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 sm:px-10">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            <div className="reveal-up inline-flex w-fit items-center gap-3 rounded-full border border-[var(--panel-border)] bg-[rgba(14,35,44,0.7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {armed ? `Active session ${sessionTime}` : "Console standby"}
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_rgba(244,162,89,0.8)]" />
            </div>
            <div className="reveal-up delay-1 rounded-[26px] border border-[var(--panel-border)] bg-[rgba(12,29,36,0.78)] p-6 shadow-[var(--shadow)]">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Verify user
              </div>
              <input
                className="mt-3 w-full rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="Enter user ID"
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  setUserStatus("idle");
                  setUserStatusMessage("");
                  setVerifiedUser(null);
                  setImageUrl("");
                  setSoundUrl("");
                  setRequestText("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleUserCheck();
                  }
                }}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  className="rounded-full border border-[var(--panel-border)] bg-[rgba(16,39,47,0.8)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-white"
                  onClick={handleUserCheck}
                >
                  Check ID
                </button>
                <span
                  className={`text-xs uppercase tracking-[0.2em] ${
                    userStatus === "found"
                      ? "text-[var(--accent-2)]"
                      : userStatus === "missing"
                        ? "text-[var(--accent)]"
                        : userStatus === "error"
                          ? "text-[var(--accent)]"
                          : "text-[var(--muted)]"
                  }`}
                >
                  {userStatusMessage || "Awaiting input"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                <span>Sample user: {SAMPLE_USER}</span>
                {!isVerified && (
                  <span className="text-[var(--accent)]">
                    Verify user to unlock controls
                  </span>
                )}
              </div>
            </div>
            <div className="reveal-up delay-3 flex flex-wrap gap-3">
              <button
                className={`rounded-full px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] transition ${
                  isVerified
                    ? armed
                      ? "bg-[rgba(244,162,89,0.2)] text-white ring-2 ring-[var(--accent)] hover:brightness-110"
                      : "bg-[var(--accent)] text-[#2b1d10] hover:brightness-110"
                    : "cursor-not-allowed border border-[var(--panel-border)] bg-[rgba(16,39,47,0.6)] text-[var(--muted)]"
                }`}
                onClick={() => {
                  setArmed((value) => {
                    const next = !value;
                    if (isVerified) {
                      void syncStatus(next);
                    }
                    return next;
                  });
                }}
                disabled={!isVerified}
              >
                {armed ? "Console active" : "Launch sequence"}
              </button>
            </div>
          </div>

          <div
            className={`reveal-up delay-2 rounded-[24px] border border-[var(--panel-border)] bg-[rgba(12,29,36,0.78)] px-3 pb-2 pt-3 shadow-[var(--shadow)] ${
              isVerified ? "" : "opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Live intensity
              </div>
            </div>

            <div className="mt-2 grid gap-2">
              <div className="rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Transform settings
                </label>
                <div className="mt-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                    Mode
                  </label>
                  <div className="select-wrap mt-2">
                    <select
                      className="select-field w-full rounded-full border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white focus:border-[var(--accent-2)] focus:outline-none"
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value as "duck" | "transform")
                      }
                      disabled={!isVerified}
                    >
                      <option value="duck">Duck mode</option>
                      <option value="transform">Transform mode</option>
                    </select>
                  </div>
                </div>
                {mode === "transform" && (
                  <>
                    <input
                      className="mt-3 w-full rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                      placeholder="e.g. make it sound like a pirate"
                      value={requestText}
                      onChange={(event) => setRequestText(event.target.value)}
                      disabled={!isVerified}
                    />
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Request set to {themeCaps || "NONE"}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] p-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  System status
                  <span className="text-white">{statusLabel}</span>
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Choose transform intensity.
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                    Transform intensity
                  </div>
                  <div className="mt-3 flex gap-2">
                    {INTENSITY_PRESETS.map((preset, index) => {
                      const isActive = transformLevel === preset;
                      return (
                        <button
                          key={preset}
                          className={`h-12 flex-1 rounded-full border text-xs font-semibold uppercase tracking-[0.22em] transition ${
                            isActive
                              ? "border-[var(--accent)] bg-[rgba(244,162,89,0.2)] text-white"
                              : "border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                          }`}
                          onClick={() => setTransformLevel(preset)}
                          disabled={emergency || !isVerified}
                          aria-pressed={isActive}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                        Sound URL (mp3)
                      </label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                        type="url"
                        placeholder="https://example.com/quack.mp3"
                        value={soundUrl}
                        onChange={(event) => setSoundUrl(event.target.value)}
                        disabled={!isVerified}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                        Image URL (jpg)
                      </label>
                      <input
                        className="mt-2 w-full rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                        type="url"
                        placeholder="https://example.com/duck.jpg"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                        disabled={!isVerified}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                    Live timer
                  </div>
                  <div className="mt-2 text-4xl font-semibold uppercase tracking-[0.2em] text-white">
                    {armed ? sessionTime : "00:00:00"}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
