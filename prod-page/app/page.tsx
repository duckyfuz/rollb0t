"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [revealed, setRevealed] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Easter egg: Triple-click on the logo triggers the reveal
  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      setRevealed(true);
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
      className={`min-h-screen transition-all duration-1000 ${
        revealed
          ? "bg-black text-red-500 [filter:invert(1)_hue-rotate(180deg)]"
          : "bg-[var(--background)] text-[var(--foreground)]"
      }`}
    >
      {/* Glitch overlay when revealed */}
      {revealed && (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-20">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)]" />
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleLogoClick}
          >
            <span className="text-2xl">📚</span>
            <span className="font-bold text-xl">Study Insights</span>
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
              ✨ Trusted by 10,000+ students worldwide
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
                : "Track your reading progress, log study sessions, and gain insights into your learning habits. The smart productivity companion for serious learners."}
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
      <section id="features" className="py-20 px-6 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">stay focused</span>
            </h2>
            <p className="text-xl text-[var(--muted)] max-w-2xl mx-auto">
              Powerful features designed to help you build better study habits
              and track your learning progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "📊",
                title: "Reading Analytics",
                description:
                  "Track how many articles and pages you read. Visualize your reading habits over time.",
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
            ].map((feature, i) => (
              <div
                key={i}
                className="feature-card"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--muted)]">{feature.description}</p>
              </div>
            ))}
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
                  "Add Study Insights to Chrome with one click. No signup required.",
              },
              {
                step: "2",
                title: "Enter Username",
                description:
                  "Create a simple username to track your personal progress.",
              },
              {
                step: "3",
                title: "Start Learning",
                description:
                  "Browse the web normally. We'll track your reading automatically.",
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
                Join thousands of students and professionals who use Study
                Insights to stay focused and track their learning.
              </p>
              <a href="#" className="btn-primary text-lg inline-block">
                Install Study Insights — Free Forever
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
            <span className="text-xl">📚</span>
            <span className="font-semibold">Study Insights</span>
          </div>
          <p className="text-sm text-[var(--muted)]">
            © 2026 Study Insights. All rights reserved.
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
