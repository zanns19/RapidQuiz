"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let idCounter = 0;
const newId = () => `q_${Date.now()}_${idCounter++}`;

const emptyQuestion = () => ({
  id: newId(),
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: "",
});

export default function QuizBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;

  const [meta, setMeta] = useState(null);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not load this quiz.");
      } else {
        const quiz = data.quiz || data;
        setMeta(quiz);
        if (quiz.questions && quiz.questions.length > 0) {
          setQuestions(quiz.questions.map((q) => ({ id: newId(), ...q })));
        }
      }
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoadingMeta(false);
    }
  };

  const updateQuestion = (id, changes) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...changes } : q)));
  };

  const updateOption = (id, index, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (id) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev));

  const buildPayload = () =>
    questions.map(({ id, ...rest }) => {
      if (rest.type === "long") {
        return {
          type: "long",
          text: rest.text,
          marks: rest.marks,
        };
      }
      return rest;
    });

  const validate = () => {
  for (const q of questions) {
    if (!q.text.trim()) {
      return "Every question needs text.";
    }

    if (q.marks === "" || q.marks == null) {
      return "Please enter marks for every question.";
    }

    if (Number(q.marks) <= 0) {
      return "Marks must be greater than 0.";
    }

    if (q.type === "mcq" && q.options.some((o) => !o.trim())) {
      return "Fill in all four options, or switch the question to long answer.";
    }
  }

  return "";
};

  const saveDraft = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questions: buildPayload() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Could not save the quiz.");
      alert("Draft saved successfully!");
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const publishQuiz = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError("");
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/quiz/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questions: buildPayload(), status: "active" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not publish the quiz.");
        setPublishing(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError("Could not reach the server. Check your connection.");
      setPublishing(false);
    }
  };

  if (loadingMeta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-[#64748B]">
        Loading quiz…
      </div>
    );
  }

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
        {/* Class metadata summary */}
        {meta && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetaItem label="Department" value={meta.department} />
            <MetaItem label="Semester" value={meta.semester} />
            <MetaItem label="Course code" value={meta.courseCode} />
            <MetaItem label="Course title" value={meta.courseTitle} />
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h1
            className="text-2xl font-[600] text-[#0B2027]"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)" }}
          >
            Build your quiz
          </h1>
        </div>

        <div className="space-y-5">
          {questions.map((q, index) => (
            <QuestionCard
              key={q.id}
              index={index}
              question={q}
              onChange={(changes) => updateQuestion(q.id, changes)}
              onOptionChange={(i, value) => updateOption(q.id, i, value)}
              onRemove={() => removeQuestion(q.id)}
              removable={questions.length > 1}
            />
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-5 w-full rounded-lg border-2 border-dashed border-[#CBD5E1] text-[#64748B] text-sm font-medium py-3 hover:border-[#0B6E4F] hover:text-[#0B6E4F] transition"
        >
          + Add question
        </button>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={saveDraft}
            disabled={saving || publishing}
            className="rounded-lg border border-[#CBD5E1] text-[#0B2027] text-sm font-medium px-5 py-2.5 hover:bg-white transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={publishQuiz}
            disabled={saving || publishing}
            className="rounded-lg bg-[#0B2A2A] text-white text-sm font-medium px-5 py-2.5 hover:bg-[#0B6E4F] transition disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish quiz"}
          </button>
        </div>
      </main>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[#94A3B8] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#0B2027]">{value || "—"}</p>
    </div>
  );
}

function QuestionCard({ index, question, onChange, onOptionChange, onRemove, removable }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="text-sm font-[600] text-[#0B2027] mt-2 shrink-0">Q{index + 1}</span>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Type the question here"
          rows={2}
          className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0B2027] placeholder:text-[#94A3B8] outline-none transition focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 resize-none"
        />

        {removable && (
          <button
            onClick={onRemove}
            title="Remove question"
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition shrink-0"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4 ml-8">
        <label className="flex items-center gap-1.5 text-sm text-[#64748B] cursor-pointer">
          <input
            type="radio"
            checked={question.type === "mcq"}
            onChange={() => onChange({ type: "mcq" })}
            className="accent-[#0B6E4F]"
          />
          Multiple choice
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[#64748B] cursor-pointer">
          <input
            type="radio"
            checked={question.type === "long"}
            onChange={() => onChange({ type: "long" })}
            className="accent-[#0B6E4F]"
          />
          Long answer
        </label>
      </div>
      <div className="ml-8 mb-4">
        <label className="block text-sm text-[#64748B] mb-1">
          Marks
        </label>

        <input
          type="number"
          min={1}
          value={question.marks}
          onChange={(e) =>
            onChange({
              marks: Number(e.target.value),
            })
          }
          className="w-28 rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 outline-none"
        />
      </div>
      {question.type === "mcq" && (
        <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${question.correctOption === i
                  ? "border-[#0B6E4F] bg-[#EAF6F1]"
                  : "border-[#CBD5E1] bg-white"
                }`}
            >
              <input
                type="radio"
                checked={question.correctOption === i}
                onChange={() => onChange({ correctOption: i })}
                className="accent-[#0B6E4F]"
                title="Mark as correct answer"
              />
              <input
                type="text"
                value={opt}
                onChange={(e) => onOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-transparent text-[#0B2027] placeholder:text-[#94A3B8] outline-none"
              />
            </label>
          ))}
        </div>
      )}

      {question.type === "long" && (
        <p className="ml-8 text-xs text-[#94A3B8]">
          Students will type a free-text answer for this question.
        </p>
      )}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    </svg>
  );
}
