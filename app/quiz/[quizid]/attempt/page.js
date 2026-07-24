"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const AUTOSAVE_DEBOUNCE_MS = 2000; // save shortly after the student stops interacting
const AUTOSAVE_INTERVAL_MS = 20000; // and also on a fixed interval, as a safety net

const storageKey = (quizId) => `rapidquiz_attempt_${quizId}`;

export default function QuizAttemptPage() {
  const params = useParams();
  const quizId = params.quizId;
  const router = useRouter();

  // "checking" = looking for a saved attemptId before deciding which screen to show
  const [step, setStep] = useState("checking"); // "checking" | "info" | "quiz" | "submitted"

  const [studentName, setStudentName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [infoErrors, setInfoErrors] = useState({});
  const [infoServerError, setInfoServerError] = useState("");
  const [starting, setStarting] = useState(false);

  const [attemptId, setAttemptId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadError, setLoadError] = useState("");

  // answers[index] = { selectedOption: number|null, locked: bool, longAnswer: string }
  const [answers, setAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState(""); // "saving" | "saved" | "error" | ""
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [results, setResults] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  const debounceTimer = useRef(null);
  const intervalTimer = useRef(null);
  const latestAnswers = useRef(answers);
  const latestAttemptId = useRef(attemptId);

  useEffect(() => {
    latestAnswers.current = answers;
  }, [answers]);
  useEffect(() => {
    latestAttemptId.current = attemptId;
  }, [attemptId]);

  // On mount: check localStorage for an existing attempt on this device/browser
  useEffect(() => {
    const savedId = localStorage.getItem(storageKey(quizId));
    if (savedId) {
      resumeAttempt(savedId);
    } else {
      setStep("info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Periodic autosave safety net + cleanup on unmount
  useEffect(() => {
    if (step !== "quiz") return;
    intervalTimer.current = setInterval(() => {
      saveNow(latestAnswers.current);
    }, AUTOSAVE_INTERVAL_MS);
    return () => {
      clearInterval(intervalTimer.current);
      clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const answersToPayload = (answersObj, questions) =>
    (questions || []).map((q, index) => {
      const a = answersObj[index] || {};
      return {
        questionIndex: index,
        type: q.type,
        selectedOption: a.selectedOption ?? null,
        longAnswer: a.longAnswer || "",
        locked: a.locked || false,
      };
    });

  const payloadToAnswers = (answersArray) => {
    const next = {};
    (answersArray || []).forEach((a) => {
      next[a.questionIndex] = {
        selectedOption: a.selectedOption,
        locked: a.locked,
        longAnswer: a.longAnswer || "",
      };
    });
    return next;
  };

  const saveNow = useCallback(
    async (answersObj) => {
      const id = latestAttemptId.current;
      if (!id) return;
      setSaveStatus("saving");
      try {
        const res = await fetch(`${API_URL}/api/attempt/${id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ answers: answersToPayload(answersObj, quiz?.questions) }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quiz]
  );

  const scheduleAutosave = (nextAnswers) => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveNow(nextAnswers);
    }, AUTOSAVE_DEBOUNCE_MS);
  };

  const resumeAttempt = async (id) => {
    setStep("checking");
    setLoadingQuiz(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_URL}/api/attempt/${id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        // Saved attemptId is stale/invalid — fall back to asking for info again
        localStorage.removeItem(storageKey(quizId));
        setStep("info");
        return;
      }

      setAttemptId(data.attemptId);
      setStudentName(data.studentName);
      setRegNumber(data.regNumber);
      setQuiz(data.quiz);
      setAnswers(payloadToAnswers(data.answers));

      if (data.status === "submitted") {
        setResults(data.results || []);
        setTotalScore(data.totalScore);
        setMaxScore(data.maxScore);
      }

      setStep(data.status === "submitted" ? "submitted" : "quiz");
    } catch (err) {
      setLoadError("Could not reach the server. Check your connection.");
      setStep("info");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setInfoServerError("");
    const next = {};
    if (!studentName.trim()) next.studentName = "Name is required";
    if (!regNumber.trim()) next.regNumber = "Registration number is required";
    setInfoErrors(next);
    if (Object.keys(next).length > 0) return;

    setStarting(true);
    try {
      const res = await fetch(`${API_URL}/api/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quizId, studentName, regNumber }),
      });
      const data = await res.json();

      if (!res.ok) {
        setInfoServerError(data.message || "Could not start the quiz.");
        setStarting(false);
        return;
      }

      localStorage.setItem(storageKey(quizId), data.attemptId);
      setAttemptId(data.attemptId);
      setStudentName(data.studentName);
      setRegNumber(data.regNumber);
      setQuiz(data.quiz);
      setAnswers(payloadToAnswers(data.answers));
      setStep(data.status === "submitted" ? "submitted" : "quiz");
    } catch (err) {
      setInfoServerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setStarting(false);
    }
  };

  const selectOption = (qIndex, optionIndex) => {
    setAnswers((prev) => {
      const current = prev[qIndex] || {};
      if (current.locked) return prev; // already locked, no changes allowed
      const next = {
        ...prev,
        [qIndex]: { ...current, selectedOption: optionIndex, locked: true },
      };
      scheduleAutosave(next);
      return next;
    });
  };

  const updateLongAnswer = (qIndex, value) => {
    setAnswers((prev) => {
      const next = {
        ...prev,
        [qIndex]: { ...prev[qIndex], longAnswer: value },
      };
      scheduleAutosave(next);
      return next;
    });
  };

  const blockPaste = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to submit? You won't be able to change your answers after this."
    );
    if (!confirmed) return;

    setSubmitError("");
    setSubmitting(true);

    // One last save so nothing typed right before submitting is lost
    await saveNow(latestAnswers.current);

    try {
      const res = await fetch(`${API_URL}/api/attempt/${attemptId}/submit`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.message || "Could not submit the quiz. Please try again.");
        setSubmitting(false);
        return;
      }
      
      router.replace(`/quiz/${quizId}/result/${attemptId}`);
    } catch (err) {
      setSubmitError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Checking for a resumable attempt ---
  if (step === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-[#64748B]">
        Loading…
      </div>
    );
  }

  // --- Already submitted ---
if (step === "submitted") {
  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span
            className="font-[600] tracking-tight text-lg text-[#0B2027]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            RapidQuiz
          </span>

          <span className="font-semibold text-[#0B2027]">
            Score: {totalScore} / {maxScore}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {results
            .slice()
            .sort((a, b) => a.questionIndex - b.questionIndex)
            .map((result) => {
              const question = quiz?.questions?.[result.questionIndex];
              const answer = answers[result.questionIndex] || {};

              return (
                <div
                  key={result.questionIndex}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-semibold text-[#0B2027]">
                      Q{result.questionIndex + 1}. {question?.text}
                    </p>

                    <span className="font-semibold text-[#0B6E4F]">
                      {result.awardedMarks} / {result.maxMarks}
                    </span>
                  </div>

                  {result.type === "mcq" ? (
                    <>
                      <p className="text-sm">
                        Your Answer:{" "}
                        <strong>
                          {answer.selectedOption != null
                            ? `${String.fromCharCode(
                                65 + answer.selectedOption
                              )}. ${question?.options?.[answer.selectedOption]}`
                            : "Not Answered"}
                        </strong>
                      </p>

                      <p className="text-sm mt-2 text-[#64748B]">
                        {result.feedback}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm mb-2">
                        <strong>Your Answer:</strong>
                      </p>

                      <div className="rounded bg-[#F8FAFC] border p-3 text-sm whitespace-pre-wrap">
                        {answer.longAnswer || "Not Answered"}
                      </div>

                      {result.feedback && (
                        <p className="mt-3 text-sm text-[#64748B]">
                          <strong>AI Feedback:</strong> {result.feedback}
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </main>
    </div>
  );
}

  // --- Step 1: student info ---
  if (step === "info") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] p-6">
        <div className="w-full max-w-sm bg-white rounded-xl border border-[#E2E8F0] p-6">
          <div className="flex items-center gap-2 mb-6">
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

          <h2 className="text-xl font-[600] text-[#0B2027] mb-1">Before you start</h2>
          <p className="text-sm text-[#64748B] mb-6">
            Enter your details so your progress can be saved and resumed if needed.
          </p>

          <form onSubmit={handleStart} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B2027] mb-1.5">Full name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setInfoErrors({ ...infoErrors, studentName: "" });
                }}
                placeholder="e.g. Ali Ahmad"
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${infoErrors.studentName
                  ? "border-red-400 focus:ring-red-200"
                  : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
                  }`}
              />
              {infoErrors.studentName && (
                <p className="mt-1.5 text-xs text-red-500">{infoErrors.studentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B2027] mb-1.5">
                Registration number
              </label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => {
                  setRegNumber(e.target.value);
                  setInfoErrors({ ...infoErrors, regNumber: "" });
                }}
                placeholder="e.g. 2023-ag-9289"
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${infoErrors.regNumber
                  ? "border-red-400 focus:ring-red-200"
                  : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
                  }`}
              />
              {infoErrors.regNumber && (
                <p className="mt-1.5 text-xs text-red-500">{infoErrors.regNumber}</p>
              )}
              <p className="mt-1.5 text-xs text-[#94A3B8]">
                If you already started this quiz, entering the same registration number will
                resume where you left off.
              </p>
            </div>

            {infoServerError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {infoServerError}
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F] disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start quiz"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Step 2: quiz ---
  if (loadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-[#64748B]">
        Loading quiz…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-red-500">
        {loadError}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <span
            className="font-[600] tracking-tight text-lg text-[#0B2027]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            RapidQuiz
          </span>
          <div className="flex items-center gap-3 text-sm text-[#64748B]">
            <SaveStatusBadge status={saveStatus} />
            <span>
              {studentName} <span className="text-[#CBD5E1]">•</span> {regNumber}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-8">
          <p className="text-lg font-[600] text-[#0B2027]">{quiz?.courseTitle}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
            <p className="text-sm text-[#64748B]">{quiz?.courseCode}</p>
            <p className="text-sm text-[#64748B]">{quiz?.department}</p>
            <p className="text-sm text-[#64748B]">Semester {quiz?.semester}</p>
            {quiz?.timeAllowed && (
              <p className="text-sm text-[#64748B]">
                Time allowed: <span className="font-semibold">{quiz.timeAllowed}</span> min
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {(quiz?.questions || [])
            .map((q, originalIndex) => ({ ...q, originalIndex }))
            .sort((a, b) => {
              if (a.type === b.type) return 0;
              return a.type === "mcq" ? -1 : 1;
            })
            .map((q, index, arr) => {
              const answer = answers[q.originalIndex] || {};

              const isFirstMcq = q.type === "mcq" && (index === 0 || arr[index - 1].type !== "mcq");
              const isFirstLong = q.type === "long" && (index === 0 || arr[index - 1].type !== "long");

              return (
                <div key={q.originalIndex}>
                  {isFirstMcq && (
                    <h3 className="font-semibold text-base mb-3 text-[#0B2027]">
                      Tick the correct option for each question.{" "}
                      <span className="text-xs font-normal">
                        (Please note that your answer will be locked after selection).
                      </span>
                    </h3>
                  )}
                  {isFirstLong && (
                    <h3 className="font-semibold text-base mb-3 mt-8 text-[#0B2027]">
                      Answer the following questions:
                    </h3>
                  )}

                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="text-sm font-[600] text-[#0B2027]">
                        Q{index + 1}. {q.text}
                      </p>
                      <span className="shrink-0 inline-flex items-center rounded-full bg-[#FFF1EC] text-[#FF5A36] text-xs font-medium px-2.5 py-1">
                        {q.marks} {Number(q.marks) === 1 ? "mark" : "marks"}
                      </span>
                    </div>

                    {q.type === "mcq" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options?.map((opt, i) => {
                          const selected = answer.selectedOption === i;
                          const disabled = answer.locked && !selected;
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={answer.locked}
                              onClick={() => selectOption(q.originalIndex, i)}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition ${selected
                                ? "border-[#0B6E4F] bg-[#EAF6F1] text-[#0B6E4F] font-medium"
                                : "border-[#E2E8F0] text-[#0B2027] hover:border-[#0B6E4F]/50"
                                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                                {String.fromCharCode(65 + i)}
                              </span>
                              {opt}
                              {selected && <LockIcon className="ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <textarea
                          rows={4}
                          value={answer.longAnswer || ""}
                          onChange={(e) => updateLongAnswer(q.originalIndex, e.target.value)}
                          onPaste={blockPaste}
                          onCopy={blockPaste}
                          onCut={blockPaste}
                          placeholder="Type your answer here"
                          className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 resize-none"
                        />
                        <p className="mt-1.5 text-xs text-[#94A3B8]">Pasting is disabled for this field.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {submitError && (
          <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-8 rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-3 transition hover:bg-[#0B6E4F] disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit quiz"}
        </button>
      </main>
    </div>
  );
}

function SaveStatusBadge({ status }) {
  if (!status) return null;
  const config = {
    saving: { text: "Saving…", className: "text-[#94A3B8]" },
    saved: { text: "All changes saved", className: "text-[#0B6E4F]" },
    error: { text: "Couldn't save — retrying", className: "text-red-500" },
  }[status];
  if (!config) return null;
  return <span className={`text-xs ${config.className}`}>{config.text}</span>;
}

function LockIcon({ className = "" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
