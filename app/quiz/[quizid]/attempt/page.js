"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function QuizAttemptPage() {
    const params = useParams();
    const quizId = params.quizId;

    const [step, setStep] = useState("info"); // "info" | "quiz"

    // Student info
    const [studentName, setStudentName] = useState("");
    const [regNumber, setRegNumber] = useState("");
    const [infoErrors, setInfoErrors] = useState({});

    // Quiz data
    const [quiz, setQuiz] = useState(null);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [loadError, setLoadError] = useState("");

    // answers[index] = { selectedOption: number|null, locked: bool, longAnswer: string }
    const [answers, setAnswers] = useState({});

    useEffect(() => {
        if (step === "quiz" && !quiz) {
            fetchQuiz();
        }
    }, [step]);

    const fetchQuiz = async () => {
        setLoadingQuiz(true);
        setLoadError("");
        try {
            // Student-facing endpoint — the backend strips `correctOption` from
            // every question here, so the answer key never reaches the browser.
            const res = await fetch(`${API_URL}/api/quiz/${quizId}/attempt`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setLoadError(data.message || "Could not load this quiz.");
            } else {
                const quizData = data.quiz || data;
                setQuiz(quizData);
                const initialAnswers = {};
                (quizData.questions || []).forEach((_, i) => {
                    initialAnswers[i] = { selectedOption: null, locked: false, longAnswer: "" };
                });
                setAnswers(initialAnswers);
            }
        } catch (err) {
            setLoadError("Could not reach the server. Check your connection.");
        } finally {
            setLoadingQuiz(false);
        }
    };

    const handleStart = (e) => {
        e.preventDefault();
        const next = {};
        if (!studentName.trim()) next.studentName = "Name is required";
        if (!regNumber.trim()) next.regNumber = "Registration number is required";
        setInfoErrors(next);
        if (Object.keys(next).length === 0) setStep("quiz");
    };

    const selectOption = (qIndex, optionIndex) => {
        setAnswers((prev) => {
            const current = prev[qIndex];
            if (current.locked) return prev; // already locked, no changes allowed
            return {
                ...prev,
                [qIndex]: { ...current, selectedOption: optionIndex, locked: true },
            };
        });
    };

    const updateLongAnswer = (qIndex, value) => {
        setAnswers((prev) => ({
            ...prev,
            [qIndex]: { ...prev[qIndex], longAnswer: value },
        }));
    };

    const blockPaste = (e) => {
        e.preventDefault();
    };

    const handleSubmit = () => {
        // TODO: wire this up to POST /api/quiz/:id/attempt (or similar) once
        // the submission endpoint is ready. For now this is UI-only.
        console.log("Submit clicked", { studentName, regNumber, answers });
    };

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
                        Enter your details so your submission can be recorded.
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
                                placeholder="e.g. Ali Ahmed"
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
                                placeholder="e.g. 2021-CS-101"
                                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:ring-2 focus:ring-offset-0 ${infoErrors.regNumber
                                    ? "border-red-400 focus:ring-red-200"
                                    : "border-[#CBD5E1] focus:border-[#0B6E4F] focus:ring-[#0B6E4F]/20"
                                    }`}
                            />
                            {infoErrors.regNumber && (
                                <p className="mt-1.5 text-xs text-red-500">{infoErrors.regNumber}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-2.5 transition hover:bg-[#0B6E4F]"
                        >
                            Start quiz
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
                    <div className="text-sm text-[#64748B]">
                        {studentName} <span className="text-[#CBD5E1]">•</span> {regNumber}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-8">
                    <p className="text-lg font-[600] text-[#0B2027]">{quiz?.courseTitle}</p>
                    <div className="flex justify-between">
                        <p className="text-sm text-[#64748B]">
                            {quiz?.courseCode}
                        </p>
                        <p className="text-sm text-[#64748B]">
                            {quiz?.department}
                        </p>
                        <p className="text-sm text-[#64748B]">
                            Semester {quiz?.semester}
                        </p>
                        <p className="text-sm text-[#64748B]">
                            Time Allowed: <span className="font-semibold">{quiz?.timeAllowed}</span> min
                        </p>

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

                            const isFirstMcq =
                                q.type === "mcq" &&
                                (index === 0 || arr[index - 1].type !== "mcq");

                            const isFirstLong =
                                q.type === "long" &&
                                (index === 0 || arr[index - 1].type !== "long");

                            return (
                                <div key={q.originalIndex}>
                                    {isFirstMcq && (
                                        <h3 className="font-semibold text-base mb-3 text-[#0B2027]">
                                           Tick the correct option for each question. <span className="text-xs font-normal"> (Please note that your answer will be locked after selection).</span>
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
                                                                } ${disabled
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "cursor-pointer"
                                                                }`}
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
                                                    onChange={(e) =>
                                                        updateLongAnswer(q.originalIndex, e.target.value)
                                                    }
                                                    onPaste={blockPaste}
                                                    onCopy={blockPaste}
                                                    onCut={blockPaste}
                                                    placeholder="Type your answer here"
                                                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 resize-none"
                                                />

                                                <p className="mt-1.5 text-xs text-[#94A3B8]">
                                                    Pasting is disabled for this field.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>

                <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full mt-8 rounded-lg bg-[#0B2A2A] text-white text-sm font-medium py-3 transition hover:bg-[#0B6E4F]"
                >
                    Submit quiz
                </button>
            </main>
        </div>
    );
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
