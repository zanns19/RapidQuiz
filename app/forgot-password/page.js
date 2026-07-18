"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState("email"); // "email" | "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not send reset code.");
        setLoading(false);
        return;
      }

      setMessage(data.message || "A reset code has been sent to your email.");
      setStep("reset");
      setLoading(false);
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not resend the code.");
      } else {
        setMessage("A new code has been sent to your email.");
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Enter the code sent to your email");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not reset password.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#EEF2F6]">
      {/* Left panel — brand side, hidden on small screens */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0B2A2A] text-[#EEF2F6] flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(#EEF2F6 1px, transparent 1px), linear-gradient(90deg, #EEF2F6 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF5A36]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A36]" />
          </span>
          <span
            className="font-[600] tracking-tight text-lg"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            RapidQuiz
          </span>
        </div>

        <div className="relative z-10">
          <h1
            className="text-4xl leading-[1.1] font-[600] mb-6"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Locked out?
            <br />
            Let's get you
            <br />
            <span className="text-[#FF5A36]">back in, fast.</span>
          </h1>
          <p className="text-[#9FC5C0] text-sm max-w-xs leading-relaxed">
            Enter your email and we'll send a code to reset your password.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between text-xs text-[#9FC5C0] mb-2 font-mono">
            <span>SESSION STARTS</span>
            <span>00:12</span>
          </div>
          <div className="h-1 w-full bg-[#123B39] rounded-full overflow-hidden">
            <div className="h-full bg-[#FF5A36] rounded-full animate-[shrink_6s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FF5A36]">
              <span className="h-2 w-2 rounded-full bg-[#FF5A36]" />
            </span>
            <span className="font-[600] text-[#0B2027] tracking-tight text-lg">RapidQuiz</span>
          </div>

          {step === "email" ? (
            <>
              <h2 className="text-2xl font-[600] text-[#0B2027] mb-1">Forgot password</h2>
              <p className="text-sm text-[#64748B] mb-8">
                Remembered it after all?{" "}
                <Link href="/login" className="text-[#0B6E4F] font-medium hover:underline">
                  Sign in
                </Link>
              </p>

              <form onSubmit={handleRequestOtp} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="you@school.edu"
                    autoComplete="email"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
                >
                  {loading ? "Sending code…" : "Send reset code"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-[600] text-[#0B2027] mb-1">Reset your password</h2>
              <p className="text-sm text-[#64748B] mb-8">
                Enter the code sent to <span className="text-[#0B2027] font-medium">{email}</span> and
                choose a new password.
              </p>

              <form onSubmit={handleResetPassword} noValidate className="space-y-5">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                    Verification code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm tracking-[0.3em] text-center text-[#0B2027] placeholder:tracking-normal placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0B2027]"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                    {error}
                  </div>
                )}
                {message && !error && (
                  <div className="rounded-lg bg-[#EAF6F1] border border-[#BFE3D4] px-3.5 py-2.5 text-sm text-[#0B6E4F]">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
                >
                  {loading ? "Resetting…" : "Reset password"}
                </button>

                <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
                  Didn't get a code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-[#0B6E4F] font-medium hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending…" : "Resend code"}
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.6 21.6 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.6 21.6 0 01-2.61 3.68" />
      <path d="M14.12 14.12a3 3 0 10-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
