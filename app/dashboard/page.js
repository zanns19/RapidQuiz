"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [tableError, setTableError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/get-me`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        const name = data.username || data.user?.username || "";
        setUsername(name);
        return name;
      }
    } catch (err) { }

    return "";
  };

  useEffect(() => {
    const init = async () => {
      const name = await fetchMe();
      fetchQuizzes();
      if (!sessionStorage.getItem("dashboardWelcomeShown")) {
        sessionStorage.setItem("dashboardWelcomeShown", "true");
        Swal.fire({
          icon: "success",
          title: `Welcome, Honorable Sir ${name}! 👋`,
          html: `
        <p>We're glad to have you back.</p>
        <br />
        <p>
          Create quizzes, manage your classes, and review student performance
          with ease—all from one place.
        </p>
        <br />
        <p style="font-size:14px; color:#6b7280;">
          Have a productive day and happy teaching!
        </p>
      `,
          confirmButtonText: "Let's Go",
          confirmButtonColor: "#0B6E4F",
        });
      };
    }
    init();
  }, []);
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
    const con = confirm("Are you sure to logged out")
    if (con) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        // ignore, still redirect
      }
      router.push("/login");
    }
  };
  const handleLogoutall = async () => {
    const con = confirm("Are you sure to logged out from all devices")
    if (con) {
      try {
        await fetch(`${API_URL}/api/auth/logout-all`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
      }
      router.push("/login");
    }
  };
  const handleDelete = async (quizId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quiz? This action cannot be undone."
    );

    if (!confirmDelete) return;

    setDeletingId(quizId);

    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete quiz.");
        return;
      }

      // Remove deleted quiz from table
      setQuizzes((prev) => prev.filter((quiz) => quiz._id !== quizId));

      alert("Quiz deleted successfully.");
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  };
  const handleCopyLink = async (quiz) => {
    if (quiz.status !== "active") {
      const result = await Swal.fire({
        icon: "warning",
        title: "Quiz is not active",
        text: "Students won't be able to attempt this quiz until it is activated. Do you still want to copy the link?",
        showCancelButton: true,
        confirmButtonText: "Copy Anyway",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563EB",
      });

      if (!result.isConfirmed) return;
    }

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/quiz/${quiz._id}/attempt`
      );

      Swal.fire({
        icon: "success",
        title: "Link Copied!",
        text: "Quiz link has been copied to your clipboard.",
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy Failed",
        text: "Unable to copy the quiz link.",
      });
    }
  };
  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full border-2 border-[#FF5A36]"> <span className="h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-[#FF5A36]" /> </span>

            <div>
              <h1
                className="text-lg font-bold text-[#0B2027]"
                style={{
                  fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                }}
              >
                RapidQuiz
              </h1>
              <p className="text-xs text-[#64748B]">
                Quiz Management Platform
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition-all hover:bg-[#F8FAFC] hover:border-[#94A3B8]"
            >
              Logout
            </button>

            <button
              onClick={handleLogoutall}
              className="cursor-pointer hidden sm:inline rounded-lg bg-red-600 py-1.5 px-2 sm:px-3 md:px-4 sm:py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700"
            >
              Logout All Devices
            </button>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col gap-3">
            <p className="text-sm sm:text-base text-blue-100 font-medium">
              Welcome back,
            </p>

            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
            >
              {username || "Guest"} 👋
            </h1>

            <div className="h-px w-20 bg-blue-200/60"></div>

            <h2 className="text-xl sm:text-2xl font-semibold">
              Quiz Dashboard
            </h2>

            <p className="max-w-2xl mb-2.5 text-sm sm:text-base text-blue-100 leading-relaxed">
              Create engaging quizzes, manage existing ones, and monitor student
              performance—all from one place.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center cursor-pointer justify-center sm:justify-start gap-2 rounded-lg bg-[#0B2A2A] text-white text-xs sm:text-sm font-medium px-4 py-2.5 transition hover:bg-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2"
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
                    <th className="px-5 py-3 font-medium">Course Title</th>
                    <th className="px-5 py-3 font-medium">Course Code</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Semester</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                    <th className="px-5 py-3 font-medium">Actions</th>
                    <th className="px-5 py-3 font-medium">Paper</th>
                    <th className="px-5 py-3 font-medium">Access&Results</th>
                  </tr>
                </thead>

                <tbody>
                  {quizzes.map((quiz) => (
                    <tr
                      key={quiz._id}
                      className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]"
                    >
                      <td className="px-5 py-3.5 font-medium text-[#0B2027]">
                        {quiz.courseTitle}
                      </td>

                      <td className="px-5 py-3.5 text-[#0B2027]">
                        {quiz.courseCode}
                      </td>

                      <td className="px-5 py-3.5 text-[#0B2027]">
                        {quiz.department}
                      </td>

                      <td className="px-5 py-3.5 text-[#0B2027]">
                        {quiz.semester}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={quiz.status || "draft"} />
                      </td>

                      <td className="px-5 py-3.5 text-[#64748B]">
                        {quiz.createdAt
                          ? new Date(quiz.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/quiz/${quiz._id}/build`)}
                            title="Edit Quiz"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#0B6E4F] hover:bg-[#EAF6F1] transition"
                          >
                            <EditIcon />
                          </button>

                          <button
                            onClick={() => handleDelete(quiz._id)}
                            disabled={deletingId === quiz._id}
                            title="Delete Quiz"
                            className="p-2 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {deletingId === quiz._id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <DeleteIcon />
                            )}
                          </button>
                        </div>
                      </td>
                      {/* Paper */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">

                          <button
                            onClick={() => router.push(`/quiz/${quiz._id}/results`)}
                            title="View Results"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#FF5A36] hover:bg-[#FFF1EC] transition"
                          >
                            <ResultsIcon />
                          </button>

                        </div>
                      </td>
                      {/* Access */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyLink(quiz)}
                            title="Copy Quiz Link"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition"
                          >
                            <LinkIcon />
                          </button>
                          <button
                            onClick={() => router.push(`/quiz/${quiz._id}/submissions`)}
                            title="View Submissions & Scores"
                            className="p-2 rounded-md text-[#64748B] hover:text-[#0B6E4F] hover:bg-[#EAF6F1] transition"
                          >
                            <SubmissionsIcon />
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
      </main >

      {modalOpen && <CreateQuizModal onClose={() => setModalOpen(false)} />
      }
    </div >
  );
}

function CreateQuizModal({ onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({
    department: "",
    semester: "",
    courseCode: "",
    courseTitle: "",
    timeAllowed: "",
    checkingDifficulty: "medium",
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
    if (!form.timeAllowed) next.timeAllowed = "Time allowed is required";

    if (Number(form.timeAllowed) <= 0) next.timeAllowed = "Enter a valid time";
    if (!form.checkingDifficulty) next.checkingDifficulty = "Select a checking difficulty";
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

          <div className="grid grid-cols-2 gap-4">
            <ModalField
              label="Time Allowed (minutes)"
              name="timeAllowed"
              value={form.timeAllowed}
              onChange={handleChange}
              error={errors.timeAllowed}
              placeholder="e.g. 30"
              type="number"
            />

            <div>
              <label htmlFor="checkingDifficulty" className="block text-sm font-medium text-[#0B2027] mb-1.5">
                Checking difficulty
              </label>
              <select
                id="checkingDifficulty"
                name="checkingDifficulty"
                value={form.checkingDifficulty}
                onChange={handleChange}
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] outline-none transition focus:ring-2 focus:ring-offset-0 ${
                  errors.checkingDifficulty
                    ? "border-red-400 focus:ring-red-200"
                    : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
                }`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {errors.checkingDifficulty && (
                <p className="mt-1.5 text-xs text-red-500">{errors.checkingDifficulty}</p>
              )}
              <p className="mt-1.5 text-xs text-[#94A3B8]">
                Controls how strictly the AI checks long answers.
              </p>
            </div>
          </div>

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
function ModalField({ label, name, value, onChange, error, placeholder, type = "text", }) {
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
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${error
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
function DeleteIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
function SubmissionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.5 5.43" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 1 0 7.07 7.07L13.5 18.57" />
    </svg>
  );
}
