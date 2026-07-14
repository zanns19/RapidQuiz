"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMe();
    fetchQuizzes();
  }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/get-me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username || data.user?.username || "");
      }
    } catch (err) {
      // silently ignore, header just falls back to a generic greeting
    }
  };

  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    setTableError("");
    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setTableError(data.message || "Could not load your quizzes.");
      } else {
        setQuizzes(data.quizzes || data || []);
      }
    } catch (err) {
      setTableError("Could not reach the server. Check your connection.");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore, still redirect
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FF5A36]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF5A36]" />
            </span>
            <span
              className="font-[600] tracking-tight text-lg text-[#0B2027]"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              RapidQuiz
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#0B2027]">
              Welcome, <span className="font-medium">{username || "there"}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-[#64748B] hover:text-[#0B2027] transition"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-[600] text-[#0B2027]"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              Your quizzes
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Create a new quiz for a class or check results from past ones.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B2A2A] text-white text-sm font-medium px-4 py-2.5 transition hover:bg-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
          >
            <PlusIcon />
            Create quiz
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {loadingQuizzes ? (
            <div className="p-10 text-center text-sm text-[#64748B]">Loading your quizzes…</div>
          ) : tableError ? (
            <div className="p-10 text-center text-sm text-red-500">{tableError}</div>
          ) : quizzes.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#64748B]">
              No quizzes yet. Click "Create quiz" to make your first one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-[#64748B]">
                    <th className="px-5 py-3 font-medium">Course title</th>
                    <th className="px-5 py-3 font-medium">Course code</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Semester</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3.5 text-[#0B2027] font-medium">{quiz.courseTitle}</td>
                      <td className="px-5 py-3.5 text-[#0B2027]">{quiz.courseCode}</td>
                      <td className="px-5 py-3.5 text-[#0B2027]">{quiz.department}</td>
                      <td className="px-5 py-3.5 text-[#0B2027]">{quiz.semester}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={quiz.status || "draft"} />
                      </td>
                      <td className="px-5 py-3.5 text-[#64748B]">
                        {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/quiz/${quiz._id}/build`)}
                            title="Continue building"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#0B6E4F] hover:bg-[#EAF6F1] transition"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => router.push(`/quiz/${quiz._id}/results`)}
                            title="View results"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#FF5A36] hover:bg-[#FFF1EC] transition"
                          >
                            <ResultsIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalOpen && <CreateQuizModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function CreateQuizModal({ onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({
    department: "",
    semester: "",
    courseCode: "",
    courseTitle: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const next = {};
    if (!form.department.trim()) next.department = "Department is required";
    if (!form.semester.trim()) next.semester = "Semester is required";
    if (!form.courseCode.trim()) next.courseCode = "Course code is required";
    if (!form.courseTitle.trim()) next.courseTitle = "Course title is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.message || "Could not create quiz. Please try again.");
        setLoading(false);
        return;
      }

      const quizId = data._id || data.quiz?._id;
      router.push(`/quiz/${quizId}/build`);
    } catch (err) {
      setServerError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-[600] text-[#0B2027]">Create a quiz</h3>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0B2027]">
            <CloseIcon />
          </button>
        </div>
        <p className="text-sm text-[#64748B] mb-5">
          Tell us about the class. You'll add the actual questions next.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <ModalField
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            error={errors.department}
            placeholder="e.g. Computer Science"
          />
          <div className="grid grid-cols-2 gap-4">
            <ModalField
              label="Semester"
              name="semester"
              value={form.semester}
              onChange={handleChange}
              error={errors.semester}
              placeholder="e.g. 5"
            />
            <ModalField
              label="Course code"
              name="courseCode"
              value={form.courseCode}
              onChange={handleChange}
              error={errors.courseCode}
              placeholder="e.g. CS301"
            />
          </div>
          <ModalField
            label="Course title"
            name="courseTitle"
            value={form.courseTitle}
            onChange={handleChange}
            error={errors.courseTitle}
            placeholder="e.g. Database Systems"
          />

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
              {serverError}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#CBD5E1] text-[#0B2027] text-sm font-medium py-2.5 hover:bg-[#F8FAFC] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({ label, name, value, onChange, error, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-[#0B2027] mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-[#F1F5F9] text-[#64748B]",
    active: "bg-[#EAF6F1] text-[#0B6E4F]",
    closed: "bg-[#FFF1EC] text-[#FF5A36]",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 3 4 5-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
