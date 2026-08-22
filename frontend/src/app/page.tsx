"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans">
      {/* ─── FLOATING NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div
          className="flex items-center justify-between w-full max-w-5xl rounded-full px-5 py-3"
          style={{
            background: "rgba(8,8,8,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L22 12L12 22L2 12L12 2Z"
                stroke="white"
                strokeWidth="1.4"
                fill="none"
              />
              <path
                d="M12 6L18 12L12 18L6 12L12 6Z"
                stroke="white"
                strokeWidth="1.4"
                fill="none"
              />
            </svg>
            <span style={{ fontSize: "16px", fontWeight: 500, color: "white", letterSpacing: "-0.01em" }}>
              Shiftly
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center" style={{ gap: "36px" }}>
            {/* Removed center links per user request */}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hover:bg-gray-100 transition-colors"
              style={{
                background: "white",
                color: "black",
                borderRadius: "999px",
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden"
        style={{ height: "100vh", minHeight: "700px" }}
      >
        {/* Gradient pillar columns */}
        <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
          {[...Array(16)].map((_, i) => {
            const center = 7.5;
            const dist = Math.abs(center - i);
            const h = Math.max(10, 100 - dist * dist * 3.2);
            const op = Math.max(0.03, 1 - dist * 0.13);
            const blur = dist < 1 ? 0 : dist * 0.5;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background:
                    "linear-gradient(to top, #1234b8 0%, #2952e3 35%, #5d8aff 70%, #b8ccff 90%, #e8f0ff 100%)",
                  opacity: op,
                  borderRadius: "3px 3px 0 0",
                  filter: `blur(${blur}px)`,
                  mixBlendMode: "screen",
                }}
              />
            );
          })}
          {/* Dark center overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 80% at 50% 100%, transparent 0%, black 60%)",
            }}
          />
          {/* Top fade */}
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "40%",
              background: "linear-gradient(to bottom, black 0%, transparent 100%)",
            }}
          />
          {/* Side fades */}
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{ width: "8%", background: "linear-gradient(to right, black, transparent)" }}
          />
          <div
            className="absolute right-0 top-0 bottom-0"
            style={{ width: "8%", background: "linear-gradient(to left, black, transparent)" }}
          />
        </div>

        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center text-center px-6" style={{ maxWidth: "880px" }}>
          <h1
            style={{
              fontSize: "clamp(52px, 8.5vw, 110px)",
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "white",
              marginBottom: "24px",
            }}
          >
            Workforce Intelligence.
          </h1>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 300,
              color: "rgba(255,255,255,0.6)",
              maxWidth: "520px",
              lineHeight: 1.65,
              marginBottom: "40px",
            }}
          >
            Automate scheduling, streamline attendance tracking, and empower your team with a platform designed for modern HR operations.
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link
              href="/login"
              style={{
                background: "white",
                color: "black",
                borderRadius: "999px",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: 500,
                boxShadow: "0 0 24px rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
              className="hover:bg-gray-100 transition-colors"
            >
              Admin
            </Link>
            <Link
              href="/login"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "white",
                borderRadius: "999px",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: 400,
                border: "1px solid rgba(255,255,255,0.12)",
                textDecoration: "none",
              }}
              className="hover:bg-[#050505]/10 transition-colors"
            >
              Employee
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          style={{ opacity: 0.35 }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="1.2" />
            <path d="M11 15L16 20L21 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ─── BLUE "CORE HUB" SECTION ──────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#2952e3", paddingBottom: 0 }}
      >
        {/* Top-left "01" number */}
        <div className="absolute top-6 left-8 flex items-start gap-1" style={{ opacity: 0.25, userSelect: "none" }}>
          <span style={{ fontSize: "12px", color: "white", marginTop: "4px" }}>↗</span>
          <span style={{ fontSize: "90px", fontWeight: 200, color: "white", lineHeight: 0.9 }}>01</span>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px 0" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "white", marginBottom: "12px", marginTop: "32px" }}>
            Central Hub
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 300, color: "rgba(255,255,255,0.65)", maxWidth: "800px", lineHeight: 1.7, marginBottom: "36px" }}>
            A unified employee management foundation that tracks attendance, processes time-off requests, and handles core administrative tasks securely in real time.
          </p>

          {/* Panoramic tech image (CSS art version) */}
          <div
            style={{
              width: "100%",
              height: "220px",
              borderRadius: "16px",
              overflow: "hidden",
              background: "linear-gradient(135deg, #0a1628 0%, #162d5e 25%, #1a2d4a 50%, #0e1f3d 75%, #091426 100%)",
              position: "relative",
            }}
          >
            {/* Vertical light beams */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${i * 11 + 3}%`,
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "linear-gradient(to bottom, transparent, rgba(80,120,255,0.4), transparent)",
                }}
              />
            ))}
            {/* Horizontal lines */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: `${i * 20 + 5}%`,
                  left: "5%",
                  right: "5%",
                  height: "1px",
                  background: "rgba(60,100,220,0.2)",
                }}
              />
            ))}
            {/* Circuit nodes */}
            {[[15, 30], [35, 55], [55, 40], [70, 65], [85, 35]].map(([x, y], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "rgba(100,150,255,0.6)",
                  boxShadow: "0 0 10px rgba(80,130,255,0.8)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom of blue section */}
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 40px 28px", display: "flex", alignItems: "center", gap: "12px" }}
        >
          {/* DNA/network icon */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.55 }}>
            <circle cx="5" cy="5" r="2.5" stroke="white" strokeWidth="1.2" />
            <circle cx="17" cy="5" r="2.5" stroke="white" strokeWidth="1.2" />
            <circle cx="11" cy="17" r="2.5" stroke="white" strokeWidth="1.2" />
            <line x1="5" y1="7.5" x2="11" y2="14.5" stroke="white" strokeWidth="1.2" />
            <line x1="17" y1="7.5" x2="11" y2="14.5" stroke="white" strokeWidth="1.2" />
          </svg>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", fontWeight: 400, letterSpacing: "0.05em" }}>
            operations
          </span>
        </div>
      </section>

      {/* ─── FEATURE CARDS 02 / 03 / 04 ─────────────────────────────────────── */}
      <section style={{ background: "#0d0d0d", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", '@media (min-width: 768px)': { gridTemplateColumns: 'repeat(3, 1fr)' } }} className="md:grid-cols-3">
          {[
            { num: "02", label: "attendance", desc: "Automate clock-ins and monitor real-time presence with integrated biometric and geolocation validation." },
            { num: "03", label: "scheduling",  desc: "Effortlessly construct and distribute complex shift rosters directly to employee dashboards." },
            { num: "04", label: "analytics",   desc: "Gain profound insights into workforce productivity, absenteeism, and department-level performance." },
          ].map(({ num, label, desc }, idx) => {
            const n = idx + 2;
            const isActive = activeCard === n;
            return (
              <div
                key={n}
                onClick={() => setActiveCard(isActive ? null : n)}
                style={{
                  padding: "32px",
                  cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.03)" : "transparent",
                  borderRight: idx < 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  minHeight: "220px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "background 0.2s",
                }}
              >
                {/* Number row */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "13px", color: isActive ? "#5b8aff" : "rgba(255,255,255,0.25)" }}>
                    {isActive ? "↑" : "↓"}
                  </span>
                  <span style={{ fontSize: "32px", fontWeight: 300, color: "rgba(255,255,255,0.2)", lineHeight: 1 }}>
                    {num}
                  </span>
                </div>

                {/* Description — only when active */}
                {isActive && (
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontWeight: 300, marginBottom: "24px", flex: 1 }}>
                    {desc}
                  </p>
                )}

                {/* Label + icon */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: isActive ? "white" : "rgba(255,255,255,0.35)", fontWeight: isActive ? 500 : 400, letterSpacing: "0.01em" }}>
                    {label}
                  </span>
                  {!isActive && (
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "14px", lineHeight: 1, marginTop: "-1px" }}>+</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── "SCALABLE INTELLIGENCE" DARK SECTION ────────────────────────────── */}
      <section style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 40px" }}>
          {/* Top label row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "56px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Enterprise HRMS</span>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Scale Model</span>
          </div>

          {/* Giant heading */}
          <h2
            style={{
              fontSize: "clamp(36px, 6.5vw, 82px)",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "white",
              maxWidth: "680px",
              marginBottom: "24px",
            }}
          >
            Scalable workforce architecture for modern enterprises
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", maxWidth: "480px", lineHeight: 1.7, fontWeight: 300, marginBottom: "60px" }}>
            We architect future-proof management systems that process vast personnel datasets securely, scaling seamlessly as your organizational complexity grows.
          </p>

          {/* Dot matrix grid */}
          <div style={{ marginBottom: "56px" }}>
            {[...Array(5)].map((_, row) => (
              <div key={row} style={{ display: "flex", gap: "32px", marginBottom: "22px" }}>
                {[...Array(8)].map((_, col) => {
                  const isBlue =
                    (row === 1 && col === 2) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 3) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 6);
                  return (
                    <div
                      key={col}
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: isBlue ? "#3b6ef5" : "rgba(255,255,255,0.12)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom label */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" stroke="rgba(59,110,245,0.7)" strokeWidth="1.2" />
              <rect x="11" y="1" width="6" height="6" rx="1" stroke="rgba(59,110,245,0.7)" strokeWidth="1.2" />
              <rect x="1" y="11" width="6" height="6" rx="1" stroke="rgba(59,110,245,0.7)" strokeWidth="1.2" />
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="rgba(59,110,245,0.7)" strokeWidth="1.2" />
            </svg>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>
              Track, organize, scale, and secure.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
