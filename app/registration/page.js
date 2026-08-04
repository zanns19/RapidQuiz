"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

//Express server, e.g. http://localhost:5000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setServerError("");
  };

  const validate = () => {
    const next = {};
    if (!form.username.trim()) next.username = "Username is required";
    else if (form.username.trim().length < 3)
      next.username = "Username must be at least 3 characters";

    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address";

    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8)
      next.password = "Password must be at least 8 characters";

    if (confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setServerError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
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
            Every class,
            <br />
            its own quiz,
            <br />
            <span className="text-[#FF5A36]">zero setup drag.</span>
          </h1>
          <p className="text-[#9FC5C0] text-sm max-w-xs leading-relaxed">
            Create an account to start running live, class-specific quizzes —
            no paper, no spreadsheets, no wasted class time.
          </p>
        </div>

        {/* Signature element: a depleting timer bar, echoing a quiz countdown */}
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

          <h2 className="text-2xl font-[600] text-[#0B2027] mb-1">Create your account</h2>
          <p className="text-sm text-[#64748B] mb-8">
            Staff registration for RapidQuiz. Already have one?{" "}
            <Link href="/login" className="text-[#0B6E4F] font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field
              label="Name"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="e.g. Shan Afzal"
              autoComplete="username"
            />

            <Field
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@school.edu"
              autoComplete="email"
            />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
                  }`}
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
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>

            <Field
              label="Confirm password"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: "" });
              }}
              error={errors.confirmPassword}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>

            <p className="text-xs text-[#94A3B8] text-center leading-relaxed">
              You'll receive a verification email after registering — check your
              inbox to activate your account.
            </p>
          </form>
        </div>
      </div>

      {/* <style jsx global>{`
        @keyframes shrink {
          0% { width: 100%; }
          50% { width: 15%; }
          100% { width: 100%; }
        }
      `}</style> */}
    </div>
  );
}

function Field({ label, name, type, value, onChange, error, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[#0B2027] mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
        }`}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
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
