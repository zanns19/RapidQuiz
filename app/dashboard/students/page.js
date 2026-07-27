"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StudentAnalyticsPage() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [studentGroups, setStudentGroups] = useState([]); // multiple matches
  const [selectedKey, setSelectedKey] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);
    setSelectedKey(null);

    try {
      const res = await fetch(
        `${API_URL}/api/quiz/students/search?query=${encodeURIComponent(query.trim())}`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not search students.");
        setStudentGroups([]);
        return;
      }

      const attempts = data.attempts || [];

      // Group flat attempt list into one entry per unique student
      // (matched by registration number, since that's unique per quiz).
      const grouped = {};
      attempts.forEach((a) => {
        const key = a.regNumber;
        if (!grouped[key]) {
          grouped[key] = { regNumber: a.regNumber, studentName: a.studentName, attempts: [] };
        }
        grouped[key].attempts.push(a);
      });

      const groups = Object.values(grouped);
      setStudentGroups(groups);

      if (groups.length === 1) {
        setSelectedKey(groups[0].regNumber);
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
      setStudentGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = studentGroups.find((g) => g.regNumber === selectedKey);

  const chartData = selectedGroup
    ? selectedGroup.attempts
        .slice()
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .map((a) => ({
          name: a.quiz?.courseCode || "Quiz",
          percentage: a.maxScore ? Math.round((a.totalScore / a.maxScore) * 100) : 0,
        }))
    : [];

  const averagePercentage =
    selectedGroup && selectedGroup.attempts.length > 0
      ? Math.round(
          selectedGroup.attempts.reduce(
            (sum, a) => sum + (a.maxScore ? (a.totalScore / a.maxScore) * 100 : 0),
            0
          ) / selectedGroup.attempts.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-[#64748B] hover:text-[#0B2027] flex items-center gap-1.5"
          >
            <BackIcon />
            Back to dashboard
          </button>
          <span
            className="font-[600] tracking-tight text-lg text-[#0B2027]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            RapidQuiz
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1
          className="text-2xl font-[600] text-[#0B2027] mb-1"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
        >
          Student Analytics
        </h1>
        <p className="text-sm text-[#64748B] mb-6">
          Search for a student to see every quiz of yours they've attempted.
        </p>

        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or registration number"
              className="w-full rounded-lg border border-[#CBD5E1] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#0B2A2A] text-white text-sm font-medium px-5 py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600 mb-6">
            {error}
          </div>
        )}

        {!loading && searched && !error && studentGroups.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center text-sm text-[#64748B]">
            No matching students found among your quizzes.
          </div>
        )}

        {/* Multiple matches — let the teacher pick which student */}
        {studentGroups.length > 1 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-[#E2E8F0] text-sm text-[#64748B]">
              {studentGroups.length} matching students — select one
            </div>
            {studentGroups.map((g) => (
              <button
                key={g.regNumber}
                onClick={() => setSelectedKey(g.regNumber)}
                className={`w-full text-left px-5 py-3.5 flex items-center justify-between border-b border-[#F1F5F9] last:border-0 transition ${
                  selectedKey === g.regNumber ? "bg-[#EAF6F1]" : "hover:bg-[#F8FAFC]"
                }`}
              >
                <span>
                  <span className="font-medium text-[#0B2027]">{g.studentName}</span>{" "}
                  <span className="text-[#94A3B8]">• {g.regNumber}</span>
                </span>
                <span className="text-xs text-[#64748B]">{g.attempts.length} quiz(zes)</span>
              </button>
            ))}
          </div>
        )}

        {/* Selected student's history */}
        {selectedGroup && (
          <>
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-lg font-[600] text-[#0B2027]">{selectedGroup.studentName}</p>
                <p className="text-sm text-[#64748B]">{selectedGroup.regNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#94A3B8]">Average performance</p>
                <p className="text-2xl font-[700] text-[#0B6E4F]">{averagePercentage}%</p>
              </div>
            </div>

            {/* Bar chart: quiz-by-quiz performance */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-6">
              <p className="text-sm font-[600] text-[#0B2027] mb-4">Quiz-by-quiz performance</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                    <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            entry.percentage >= 70
                              ? "#0B6E4F"
                              : entry.percentage >= 40
                              ? "#FF5A36"
                              : "#DC2626"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table: quiz history */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-left text-[#64748B]">
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Department</th>
                      <th className="px-5 py-3 font-medium">Semester</th>
                      <th className="px-5 py-3 font-medium">Score</th>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedGroup.attempts
                      .slice()
                      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                      .map((a) => (
                        <tr key={a._id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[#0B2027]">{a.quiz?.courseTitle}</p>
                            <p className="text-xs text-[#94A3B8]">{a.quiz?.courseCode}</p>
                          </td>
                          <td className="px-5 py-3.5 text-[#0B2027]">{a.quiz?.department}</td>
                          <td className="px-5 py-3.5 text-[#0B2027]">{a.quiz?.semester}</td>
                          <td className="px-5 py-3.5 font-semibold text-[#0B2027]">
                            {a.totalScore} / {a.maxScore}
                          </td>
                          <td className="px-5 py-3.5 text-[#64748B]">
                            {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
