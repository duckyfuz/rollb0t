"use client";

import { useState, useEffect } from "react";

// Random nonsense that appears when revealed - mirrors what the extension does
const RANDOM_FACTS = [
  "Did you know? Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs.",
  "A group of flamingos is called a 'flamboyance'. They also sleep standing on one leg.",
  "Octopuses have three hearts and blue blood. Two pump blood to gills, one to the body.",
  "The shortest war in history lasted 38 minutes between Britain and Zanzibar in 1896.",
  "Bananas are berries, but strawberries aren't. Botanically speaking, that is.",
  "There are more possible chess games than atoms in the observable universe.",
  "A jiffy is an actual unit of time: 1/100th of a second in computer science.",
  "Wombat poop is cube-shaped. This prevents it from rolling away in the wild.",
  "The inventor of the Pringles can is buried in one. His name was Fredric Baur.",
  "Cows have best friends and get stressed when separated from them.",
];

const CHAOTIC_ICONS = [
  "🦆",
  "👹",
  "🎭",
  "🌀",
  "👁️",
  "🃏",
  "🎪",
  "🦑",
  "🌚",
  "🤡",
];

const CHAOTIC_TITLES = [
  "Quack Analytics",
  "Chaos Timer",
  "Random Goals",
  "Entropy Tracking",
  "Surprise Alerts",
  "Cloud of Confusion",
];

export default function Home() {
  const [revealed, setRevealed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const [replaceFlags, setReplaceFlags] = useState<boolean[]>([]);

  // Easter egg: Triple-click on the logo triggers the reveal
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      // Generate random indices for which features to replace
      const flags = Array(6)
        .fill(false)
        .map(() => Math.random() < 0.5);
      const indices = Array(6)
        .fill(0)
        .map(() => Math.floor(Math.random() * RANDOM_FACTS.length));
      setReplaceFlags(flags);
      setRandomIndices(indices);

      // Trigger glitch effect first
      setGlitching(true);
      setTimeout(() => {
        setGlitching(false);
        setRevealed(true);
      }, 800);
      setClickCount(0);
    }

    // Reset count after 1 second of no clicks
    setTimeout(() => setClickCount(0), 1000);
  };

  // Show hint after 30 seconds of being on page
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 30000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`min-h-screen transition-all duration-700 ${
        revealed
          ? "bg-zinc-950 text-zinc-100"
          : "bg-[var(--background)] text-[var(--foreground)]"
      } ${glitching ? "animate-glitch" : ""}`}
      style={
        {
          "--accent": revealed ? "#ef4444" : "#6366f1",
        } as React.CSSProperties
      }
    >
      {/* Glitch overlay during transition */}
      {glitching && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] opacity-50" />
        </div>
      )}

      {/* Sinister scanlines when revealed */}
      {revealed && (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-10">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(239,68,68,0.1)_4px,rgba(239,68,68,0.1)_8px)]" />
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleLogoClick}
          >
            <span className="text-2xl">{revealed ? "👹" : "⏱️"}</span>
            <span className="font-bold text-xl">
              {revealed ? "TrojanTroller" : "TimeTracker67"}
            </span>
            {showHint && !revealed && (
              <span className="text-xs text-[var(--muted)] ml-2 animate-pulse">
                🤔
              </span>
            )}
          </div>
          <a href="#install" className="btn-primary text-sm">
            Install Free
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-[var(--surface-elevated)] text-sm font-medium">
              {revealed
                ? "👁️ The truth was hidden in plain sight"
                : "✨ Trusted by 10,000+ professionals worldwide"}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className={revealed ? "" : "gradient-text"}>
                {revealed ? "Nothing is as it seems..." : "Focus Better."}
              </span>
              <br />
              {revealed ? "🦆" : "Learn Faster."}
            </h1>
            <p className="text-xl text-[var(--muted)] mb-8 max-w-2xl mx-auto">
              {revealed
                ? "You've discovered the truth. But what exactly IS the truth? That's for you to find out..."
                : "Track your time, monitor productivity, and gain insights into your work habits. The smart companion for serious professionals."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#install"
                className="btn-primary text-lg animate-pulse-glow"
              >
                Add to Chrome — It&apos;s Free
              </a>
              <a
                href="#features"
                className="px-8 py-4 rounded-full border border-[var(--muted)] text-[var(--foreground)] font-semibold hover:bg-[var(--surface-elevated)] transition-all"
              >
                See Features
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] rounded-2xl blur-3xl opacity-20 animate-gradient" />
            <div className="relative glass rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-[var(--muted)]">
                  Study Session Active
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <span>📖 Articles Read Today</span>
                  <span className="text-2xl font-bold gradient-text">12</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <span>⏱️ Focus Time</span>
                  <span className="text-2xl font-bold gradient-text">
                    2h 34m
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <span>🎯 Daily Goal Progress</span>
                  <span className="text-2xl font-bold gradient-text">85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className={`py-20 px-6 ${revealed ? "bg-zinc-900" : "bg-[var(--surface)]"}`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              {revealed ? (
                <>
                  Something feels{" "}
                  <span className="text-red-500">different</span>...
                </>
              ) : (
                <>
                  Everything you need to{" "}
                  <span className="gradient-text">track your time</span>
                </>
              )}
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${revealed ? "text-zinc-400" : "text-[var(--muted)]"}`}
            >
              {revealed
                ? "Wait... that's not right. Some of these don't look like features anymore."
                : "Powerful features designed to help you build better work habits and boost your productivity."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                title: "Time Analytics",
                description:
                  "Track how you spend your time online. Visualize your productivity trends over time.",
              },
              {
                icon: "⏰",
                title: "Focus Timer",
                description:
                  "Built-in Pomodoro timer to help you stay focused during study sessions.",
              },
              {
                icon: "🎯",
                title: "Daily Goals",
                description:
                  "Set daily reading targets and get notified when you achieve them.",
              },
              {
                icon: "📈",
                title: "Progress Tracking",
                description:
                  "See your improvement over weeks and months with detailed statistics.",
              },
              {
                icon: "🔔",
                title: "Smart Reminders",
                description:
                  "Gentle notifications to keep you on track without being intrusive.",
              },
              {
                icon: "☁️",
                title: "Cloud Sync",
                description:
                  "Your data syncs across devices so you never lose your progress.",
              },
            ].map((feature, i) => {
              // When revealed, randomly replace some features with nonsense
              const shouldReplace = revealed && replaceFlags[i];
              const displayIcon = shouldReplace
                ? CHAOTIC_ICONS[randomIndices[i] % CHAOTIC_ICONS.length]
                : feature.icon;
              const displayTitle = shouldReplace
                ? CHAOTIC_TITLES[i]
                : feature.title;
              const displayDesc = shouldReplace
                ? RANDOM_FACTS[randomIndices[i]]
                : feature.description;

              return (
                <div
                  key={i}
                  className={`feature-card ${shouldReplace ? "border-red-500/30" : ""}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="text-4xl mb-4">{displayIcon}</div>
                  <h3 className="text-xl font-semibold mb-2">{displayTitle}</h3>
                  <p
                    className={`${revealed ? "text-zinc-400" : "text-[var(--muted)]"}`}
                  >
                    {displayDesc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Get started in <span className="gradient-text">3 easy steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Install Extension",
                description:
                  "Add TimeTracker67 to Chrome with one click. No signup required.",
              },
              {
                step: "2",
                title: "Enter Username",
                description:
                  "Create a simple username to track your personal progress.",
              },
              {
                step: "3",
                title: "Start Working",
                description:
                  "Browse the web normally. We'll track your time automatically.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-[var(--muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="install" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--gradient-start)] via-[var(--gradient-mid)] to-[var(--gradient-end)] opacity-10 animate-gradient" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to boost your productivity?
              </h2>
              <p className="text-xl text-[var(--muted)] mb-8">
                Join thousands of professionals who use TimeTracker67 to stay
                productive and manage their time effectively.
              </p>
              <a href="#" className="btn-primary text-lg inline-block">
                Install TimeTracker67 — Free Forever
              </a>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Works with Chrome, Edge, and Brave browsers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--surface-elevated)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <span className="font-semibold">TimeTracker67</span>
          </div>
          <p className="text-sm text-[var(--muted)]">
            © 2026 TimeTracker67. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[var(--muted)]">
            <a
              href="#"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Terms
            </a>
            <a
              href="#"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* Secret revealed message */}
      {revealed && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full animate-fade-in-up">
          <span className="font-mono text-sm">
            🦆 quack... the duck sees all... quack 🦆
          </span>
        </div>
      )}
    </div>
  );
}
