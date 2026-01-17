"use client";

import { useEffect, useState } from "react";

const KNOWN_USERS = new Set(["r0-01", "rollb0t", "admin", "duck-ops"]);
const SAMPLE_USER = "r0-01";
const INTENSITY_PRESETS = [20, 60, 100];

const clamp = (value: number, min = 0, max = 100) => {
  return Math.min(max, Math.max(min, value));
};

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

type UserCheckStatus = "idle" | "found" | "missing" | "error";

export default function Home() {
  const [armed, setArmed] = useState(false);
  const [themeWord, setThemeWord] = useState("duck");
  const [textIntensity, setTextIntensity] = useState(35);
  const [audioIntensity, setAudioIntensity] = useState(20);
  const [visualIntensity, setVisualIntensity] = useState(60);
  const [audioMuted] = useState(false);
  const [mutationsFrozen] = useState(false);
  const [swapImages] = useState(false);
  const [emergency] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [userId, setUserId] = useState("");
  const [userStatus, setUserStatus] = useState<UserCheckStatus>("idle");
  const [userStatusMessage, setUserStatusMessage] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const normalizedTheme = themeWord.trim() || "duck";
  const themeTitle = normalizedTheme.toLowerCase();
  const themeCaps = normalizedTheme.toUpperCase();
  const sessionTime = formatDuration(activeSeconds);
  const isVerified = userStatus === "found";

  const effectiveText = clamp(
    isVerified && armed && !emergency && !mutationsFrozen ? textIntensity : 0
  );
  const effectiveAudio = clamp(
    isVerified && armed && !emergency && !audioMuted ? audioIntensity : 0
  );
  const effectiveVisual = clamp(
    isVerified && armed && !emergency
      ? (swapImages ? visualIntensity : visualIntensity * 0.7)
      : 0
  );

  const statusLabel = emergency
    ? "Rollback engaged"
    : armed
      ? "Console active"
      : "Console idle";

  const intensityControls = [
    {
      label: "Text mutation",
      value: textIntensity,
      setValue: setTextIntensity,
    },
    {
      label: "Audio",
      value: audioIntensity,
      setValue: setAudioIntensity,
    },
    {
      label: "Visual swaps",
      value: visualIntensity,
      setValue: setVisualIntensity,
    },
  ];



  const handleUserCheck = () => {
    const trimmed = userId.trim();
    if (!trimmed) {
      setUserStatus("error");
      setUserStatusMessage("Enter a user ID to check.");
      return;
    }

    const exists = KNOWN_USERS.has(trimmed.toLowerCase());
    setUserStatus(exists ? "found" : "missing");
    setUserStatusMessage(
      exists
        ? `User ${trimmed} found in registry.`
        : `User ${trimmed} not found.`
    );
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
            <h1 className="reveal-up delay-1 font-display text-4xl uppercase leading-[1.05] tracking-[0.08em] text-white sm:text-5xl">
              Orchestrate the prank grid without leaving the war room.
            </h1>
            <p className="reveal-up delay-2 max-w-xl text-base leading-7 text-[var(--muted)]">
              Rollb0t streams device pulses, text mutations, and audio triggers in
              one pane. Shape intensity, deploy new behaviors, and keep every
              session in sync.
            </p>
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
                  setArmed((value) => !value);
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
              <div className="rounded-full border border-[var(--panel-border)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-2)]">
                {themeTitle} mode
              </div>
            </div>

            <div className="mt-2 grid gap-2">
              <div className="rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] p-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Theme word
                </label>
                <input
                  className="mt-3 w-full rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] px-4 py-3 text-sm text-white placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="e.g. ducks, neon, glitch"
                  value={themeWord}
                  onChange={(event) => setThemeWord(event.target.value)}
                  disabled={!isVerified}
                />
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Theme set to {themeCaps}
                </div>
              </div>

              <div className="rounded-2xl border border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] p-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  System status
                  <span className="text-white">{statusLabel}</span>
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Adjust each channel intensity.
                </div>
                <div className="mt-3 grid gap-3">
                  {intensityControls.map((control) => (
                    <div key={control.label}>
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                        {control.label}
                        <span className="text-white">{control.value}%</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {INTENSITY_PRESETS.map((preset, index) => {
                          const isActive = control.value === preset;
                          return (
                            <button
                              key={preset}
                              className={`h-9 flex-1 rounded-full border text-xs font-semibold uppercase tracking-[0.22em] transition ${
                                isActive
                                  ? "border-[var(--accent)] bg-[rgba(244,162,89,0.2)] text-white"
                                  : "border-[rgba(35,65,75,0.7)] bg-[rgba(9,24,31,0.7)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                              }`}
                              onClick={() => control.setValue(preset)}
                              disabled={emergency || !isVerified}
                              aria-pressed={isActive}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
