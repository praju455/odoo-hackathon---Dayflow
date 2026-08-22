"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { AuthUser } from "@/context/AuthContext";

interface LoginResponse {
  token: string;
  mustChangePassword: boolean;
  user: Pick<AuthUser, "id" | "loginId" | "name" | "email" | "role">;
}

function DiamondLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M12 6L18 12L12 18L6 12L12 6Z" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate(): string | null {
    if (!identifier.trim()) return "Please enter your Login ID or email.";
    if (!password) return "Please enter your password.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        identifier: identifier.trim(),
        password,
      });

      const authUser: AuthUser = {
        ...data.user,
        mustChangePassword: data.mustChangePassword,
      };

      login(data.token, authUser);

      if (data.mustChangePassword) {
        router.push("/change-password");
      } else if (authUser.role === "ADMIN") {
        router.push("/admin/analytics");
      } else {
        router.push("/attendance");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 font-sans"
      style={{
        background: "black",
      }}
    >
      {/* Subtle background gradient pillars — same as landing */}
      <div className="fixed inset-0 flex items-end justify-center overflow-hidden pointer-events-none" style={{ opacity: 0.18 }}>
        {[...Array(12)].map((_, i) => {
          const center = 5.5;
          const dist = Math.abs(center - i);
          const h = Math.max(5, 80 - dist * dist * 4);
          const op = Math.max(0.02, 0.9 - dist * 0.15);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                background: "linear-gradient(to top, #1234b8 0%, #2952e3 40%, #5d8aff 80%, #c8dcff 100%)",
                opacity: op,
                borderRadius: "3px 3px 0 0",
                filter: `blur(${dist * 0.8}px)`,
                mixBlendMode: "screen",
              }}
            />
          );
        })}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 70% at 50% 100%, transparent 0%, black 65%)" }} />
        <div className="absolute top-0 left-0 right-0 h-1/2" style={{ background: "linear-gradient(to bottom, black 0%, transparent 100%)" }} />
      </div>

      {/* Top navbar strip */}
      <nav className="fixed top-4 left-0 right-0 flex justify-center px-4 z-50">
        <div
          className="flex items-center justify-between w-full max-w-5xl rounded-full px-5 py-3"
          style={{ background: "rgba(8,8,8,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Link href="/" className="flex items-center gap-3">
            <DiamondLogo />
            <span style={{ fontSize: "16px", fontWeight: 400, color: "white", letterSpacing: "-0.01em" }}>Shiftly</span>
          </Link>
          <div className="hidden md:flex items-center" style={{ gap: "36px" }}>
            {/* Removed center links */}
          </div>
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
      </nav>

      {/* Login card */}
      <div className="relative z-10 w-full" style={{ maxWidth: "420px" }}>
        {/* Brand header */}
        <div className="flex flex-col items-center mb-10">
          <div style={{ marginBottom: "20px" }}>
            <DiamondLogo />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 300, color: "white", letterSpacing: "-0.02em", marginBottom: "8px", textAlign: "center" }}>
            Sign in to Shiftly
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", fontWeight: 300, textAlign: "center" }}>
            Intelligent workforce management platform
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "20px",
            padding: "36px",
            backdropFilter: "blur(20px)",
          }}
        >
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Identifier */}
            <div>
              <label
                htmlFor="identifier"
                style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}
              >
                Login ID or Email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. DF20250001 or admin@dayflow.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 300,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,110,245,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    padding: "12px 48px 12px 16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 300,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,110,245,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "#f87171",
                  fontSize: "13px",
                  fontWeight: 300,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0, marginTop: "1px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                background: isLoading ? "rgba(255,255,255,0.7)" : "white",
                color: "black",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.2)", marginTop: "28px", fontWeight: 300 }}>
          Shiftly HRMS · {new Date().getFullYear()} · Workforce Intelligence Platform
        </p>
      </div>
    </main>
  );
}
