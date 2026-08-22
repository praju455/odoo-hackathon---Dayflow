"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// Password complexity rules (mirrors what the backend should enforce)
const MIN_LENGTH = 8;

function getPasswordStrength(pw: string): {
  label: string;
  color: string;
  width: string;
} {
  if (pw.length === 0)  return { label: "",        color: "bg-slate-700",  width: "w-0"    };
  if (pw.length < 6)    return { label: "Too short", color: "bg-red-500",   width: "w-1/4"  };
  if (pw.length < MIN_LENGTH) return { label: "Weak",   color: "bg-orange-400", width: "w-2/4" };
  const hasUpper  = /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const score = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (score === 3) return { label: "Strong",  color: "bg-green-500",  width: "w-full"  };
  if (score === 2) return { label: "Good",    color: "bg-indigo-400", width: "w-3/4"   };
  return               { label: "Fair",     color: "bg-yellow-400", width: "w-2/4"   };
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                     = useState<string | null>(null);
  const [isLoading, setIsLoading]             = useState(false);

  const strength = getPasswordStrength(newPassword);

  // If somehow the user lands here but doesn't need to change password, redirect away
  useEffect(() => {
    if (user && !user.mustChangePassword) {
      router.replace(user.role === "ADMIN" ? "/admin/analytics" : "/attendance");
    }
  }, [user, router]);

  // ─── Client-side validation ─────────────────────────────────────────────────
  function validate(): string | null {
    if (!currentPassword)                      return "Please enter your current (temporary) password.";
    if (newPassword.length < MIN_LENGTH)       return `New password must be at least ${MIN_LENGTH} characters.`;
    if (newPassword === currentPassword)       return "New password must differ from your current password.";
    if (newPassword !== confirmPassword)       return "Passwords do not match.";
    return null;
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      // Clear the mustChangePassword flag in local context so the nav/redirect
      // logic doesn't bounce the user back here on the next render
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      router.push(user?.role === "ADMIN" ? "/admin/analytics" : "/attendance");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to change password. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-white"
            >
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Set your password</h1>
          <p className="text-slate-400 text-sm mt-1 text-center max-w-xs">
            Your account was created with a temporary password. Please set a new one before continuing.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* User hint */}
          {user && (
            <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-slate-400 text-xs truncate">{user.loginId}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Current (temp) password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Temporary Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the password you were given"
                className="
                  w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-600
                  text-white placeholder-slate-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                "
              />
            </div>

            {/* New password + strength bar */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`At least ${MIN_LENGTH} characters`}
                className="
                  w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-600
                  text-white placeholder-slate-500 text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                "
              />
              {/* Strength meter */}
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Strength:{" "}
                    <span className={`font-medium ${strength.color.replace("bg-", "text-")}`}>
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-300 mb-1.5"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className={`
                  w-full px-4 py-2.5 rounded-xl bg-slate-900/70 border text-white placeholder-slate-500 text-sm
                  focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200
                  ${
                    confirmPassword.length > 0
                      ? confirmPassword === newPassword
                        ? "border-green-500 focus:ring-green-500"
                        : "border-red-500 focus:ring-red-500"
                      : "border-slate-600 focus:ring-indigo-500"
                  }
                `}
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="change-password-submit"
              type="submit"
              disabled={isLoading}
              className="
                w-full py-2.5 rounded-xl font-semibold text-sm text-white
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-indigo-500/20
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                "Set New Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
