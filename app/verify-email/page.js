"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Point this at your Express server, e.g. http://localhost:5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!otp.trim()) {
      setError("Enter the code sent to your email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid or expired code. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage("");
    setError("");
    if (!email.trim()) {
      setError("Enter your email first");
      return;
    }
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not resend the code.");
        if (res.status === 429) setCooldown(60);
      } else {
        setResendMessage("A new code has been sent to your email.");
        setCooldown(60);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#EEF2F6]">
      {/* Left panel — brand side, hidden on small screens */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-[#0B2A2A] text-[#EEF2F6] flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="h-full w-full" style={{
            backgroundImage: "linear-gradient(#EEF2F6 1px, transparent 1px), linear-gradient(90deg, #EEF2F6 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF5A36]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A36]" />
          </span>
          <span className="font-[600] tracking-tight text-lg" style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}>
            RapidQuiz
          </span>
        </div>

        <div className="relative z-10">
          <h1
            className="text-4xl leading-[1.1] font-[600] mb-6"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            One code away
            <br />
            from your
            <br />
            <span className="text-[#FF5A36]">first live quiz.</span>
          </h1>
          <p className="text-[#9FC5C0] text-sm max-w-xs leading-relaxed">
            We've sent a verification code to your inbox. Enter it here to
            activate your account.
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

          <h2 className="text-2xl font-[600] text-[#0B2027] mb-1">Verify your email</h2>
          <p className="text-sm text-[#64748B] mb-8">
            Enter the code we sent to{" "}
            <span className="text-[#0B2027] font-medium">{email || "your email"}</span>.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {!emailFromQuery && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            )}

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
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm tracking-[0.3em] text-center text-[#0B2027] placeholder:tracking-normal placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="rounded-lg bg-[#EAF6F1] border border-[#BFE3D4] px-3.5 py-2.5 text-sm text-[#0B6E4F]">
                {resendMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
            >
              {loading ? "Verifying…" : "Verify email"}
            </button>

            <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
              Didn't get a code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="text-[#0B6E4F] font-medium hover:underline disabled:opacity-60 disabled:no-underline"
              >
                {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </p>
          </form>
        </div>
      </div>

      
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
