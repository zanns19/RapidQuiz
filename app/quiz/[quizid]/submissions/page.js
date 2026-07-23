"use client";

import { Fragment, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function QuizSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;

  const [quiz, setQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [quizId]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [quizRes, attemptsRes] = await Promise.all([
        fetch(`${API_URL}/api/quiz/${quizId}`, { credentials: "include" }),
        fetch(`${API_URL}/api/quiz/${quizId}/attempts`, { credentials: "include" }),
      ]);

      const quizData = await quizRes.json();
      const attemptsData = await attemptsRes.json();

      if (!quizRes.ok) {
        setError(quizData.message || "Could not load this quiz.");
        return;
      }
      if (!attemptsRes.ok) {
        setError(attemptsData.message || "Could not load submissions.");
        return;
      }

      setQuiz(quizData.quiz || quizData);
      setAttempts(attemptsData.attempts || []);
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-[#64748B]">
        Loading submissions…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF2F6] gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-[#0B6E4F] font-medium hover:underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const submittedCount = attempts.filter((a) => a.status === "submitted").length;

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 mb-6">
          <p className="text-lg sm:text-xl font-semibold text-[#0B2027] break-words">
            {quiz?.courseTitle}
          </p>

          <p className="text-sm text-[#64748B] mt-1 flex flex-wrap gap-x-2 gap-y-1">
            <span>{quiz?.courseCode}</span>
            <span>•</span>
            <span>{quiz?.department}</span>
            <span>•</span>
            <span>Semester {quiz?.semester}</span>
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-[#64748B]">
            <span>
              <span className="font-semibold text-[#0B2027]">{attempts.length}</span> attempts
            </span>
            <span>
              <span className="font-semibold text-[#0B2027]">{submittedCount}</span> submitted
            </span>
            <span>
              Checking difficulty:{" "}
              <span className="font-semibold text-[#0B2027] capitalize">
                {quiz?.checkingDifficulty || "medium"}
              </span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {attempts.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#64748B]">
              No students have started this quiz yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left text-[#64748B]">
                  <th className="px-3 sm:px-5 py-3 font-medium">Name</th>
                  <th className="px-3 sm:px-5 py-3 font-medium">Reg. number</th>
                  <th className="px-3 sm:px-5 py-3 font-medium">Status</th>
                  <th className="px-3 sm:px-5 py-3 font-medium">Score</th>
                  <th className="px-3 sm:px-5 py-3 font-medium">Submitted</th>
                  <th className="px-3 sm:px-5 py-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <Fragment key={attempt._id}>
                    <tr
                      key={attempt._id}
                      className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]"
                    >
                      <td className="px-3 sm:px-5 py-3.5 font-medium text-[#0B2027]">{attempt.studentName}</td>
                      <td className="px-3 sm:px-5 py-3.5 text-[#0B2027]">{attempt.regNumber}</td>
                      <td className="px-3 sm:px-5 py-3.5">
                        <AttemptStatusBadge status={attempt.status} />
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-[#0B2027]">
                        {attempt.status === "submitted" ? (
                          <span className="font-semibold">
                            {attempt.totalScore} / {attempt.maxScore}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-[#64748B]">
                        {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 sm:px-5 py-3.5 text-right">
                        <button
                          onClick={() => toggleExpand(attempt._id)}
                          className="text-[#0B6E4F] text-sm font-medium hover:underline"
                        >
                          {expandedId === attempt._id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {expandedId === attempt._id && (
                      <tr>
                        <td colSpan={6} className="bg-[#F8FAFC] px-3 sm:px-5 py-4 sm:py-5">
                          <AttemptBreakdown attempt={attempt} quiz={quiz} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AttemptBreakdown({ attempt, quiz }) {
  if (attempt.status !== "submitted") {
    return (
      <p className="text-sm text-[#64748B]">
        This student hasn't submitted yet — their answers are saved but not graded.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {attempt.results
        ?.slice()
        .sort((a, b) => a.questionIndex - b.questionIndex)
        .map((result) => {
          const question = quiz?.questions?.[result.questionIndex];
          const answer = attempt.answers?.find((a) => a.questionIndex === result.questionIndex);

          return (
            <div
              key={result.questionIndex}
              className="bg-white rounded-lg border border-[#E2E8F0] p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-sm font-[600] text-[#0B2027]">
                  Q{result.questionIndex + 1}. {question?.text}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {result.needsReview && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1">
                      Needs review
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full text-xs font-medium px-2.5 py-1 ${result.awardedMarks === result.maxMarks
                        ? "bg-[#EAF6F1] text-[#0B6E4F]"
                        : result.awardedMarks === 0
                          ? "bg-red-50 text-red-600"
                          : "bg-[#FFF1EC] text-[#FF5A36]"
                      }`}
                  >
                    {result.awardedMarks} / {result.maxMarks}
                  </span>
                </div>
              </div>

              {result.type === "mcq" ? (
                <p className="text-sm text-[#64748B]">
                  Student answered:{" "}
                  <span className="font-medium text-[#0B2027]">
                    {answer?.selectedOption != null
                      ? `${String.fromCharCode(65 + answer.selectedOption)}. ${question?.options?.[answer.selectedOption] ?? ""
                      }`
                      : "Not answered"}
                  </span>
                </p>
              ) : (
                <>
                  <p className="text-sm text-[#64748B] mb-1.5">
                    Student's answer:{" "}
                    <span className="text-[#0B2027]">{answer?.longAnswer || "Not answered"}</span>
                  </p>
                  {result.feedback && (
                    <p className="text-xs text-[#94A3B8] italic">AI feedback: {result.feedback}</p>
                  )}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}

function AttemptStatusBadge({ status }) {
  const styles = {
    "in-progress": "bg-[#F1F5F9] text-[#64748B]",
    submitted: "bg-[#EAF6F1] text-[#0B6E4F]",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles["in-progress"]
        }`}
    >
      {status === "in-progress" ? "In progress" : "Submitted"}
    </span>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
