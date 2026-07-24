"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function StudentResultPage() {
  const router = useRouter();
  const params = useParams();

  const quizId = params.quizId;
  const attemptId = params.attemptId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResult();
  }, []);

  const fetchResult = async () => {
    try {
      const res = await fetch(`${API_URL}/api/attempt/${attemptId}`, {
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Unable to load result.");
        return;
      }

      setData(result);
    } catch {
      setError("Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Result...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F6]">
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <button
            onClick={() => window.close()}
            className="text-sm text-[#64748B] hover:text-black"
          >
            Close
          </button>

          <span className="font-semibold text-lg">
            RapidQuiz
          </span>

        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-6">

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 mb-6">

          <h2 className="text-xl font-semibold">
            {data.quiz.courseTitle}
          </h2>

          <p className="text-[#64748B] mt-1">
            {data.quiz.courseCode} • {data.quiz.department} • Semester {data.quiz.semester}
          </p>

          <div className="mt-4 flex gap-8">

            <div>
              <p className="text-xs text-gray-500">Student</p>
              <p className="font-medium">{data.studentName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Registration</p>
              <p className="font-medium">{data.regNumber}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Score</p>
              <p className="font-semibold text-lg text-green-700">
                {data.totalScore} / {data.maxScore}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Percentage</p>
              <p className="font-semibold">
                {Math.round((data.totalScore / data.maxScore) * 100)}%
              </p>
            </div>
          </div>

        </div>

        <div className="space-y-4">

          {data.results
            ?.slice()
            .sort((a, b) => a.questionIndex - b.questionIndex)
            .map((result) => {

              const question =
                data.quiz.questions[result.questionIndex];

              const answer =
                data.answers.find(
                  a => a.questionIndex === result.questionIndex
                );

              return (

                <div
                  key={result.questionIndex}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-5"
                >

                  <div className="flex justify-between">

                    <p className="font-semibold">
                      Q{result.questionIndex + 1}. {question.text}
                    </p>

                    <div className="flex items-center gap-2">

                      {result.needsReview && (
                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs">
                          Needs Review
                        </span>
                      )}

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${result.awardedMarks === result.maxMarks
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

                    <div className="mt-3">

                      <p className="text-sm text-gray-600">
                        Your Answer
                      </p>

                      <p className="font-medium mt-1">
                        {answer?.selectedOption != null
                          ? `${String.fromCharCode(
                            65 + answer.selectedOption
                          )}. ${question.options[answer.selectedOption]
                          }`
                          : "Not answered"}
                      </p>
                      <p className="text-sm text-gray-600 mt-3">
                        Correct Answer
                      </p>

                      <p className="font-medium mt-1">
                        {question.correctOption != null
                          ? `${String.fromCharCode(65 + question.correctOption)}. ${question.options[question.correctOption]
                          }`
                          : "N/A"}
                      </p>

                      <p className="text-sm text-gray-600 mt-4">
                        Feedback
                      </p>

                      <p
                        className={`font-medium mt-1 ${result.isCorrect ? "text-green-600" : "text-red-600"
                          }`}
                      >
                        {result.feedback}
                      </p>
                    </div>

                  ) : (

                    <div className="mt-3">

                      <p className="text-sm text-gray-600">
                        Your Answer
                      </p>

                      <div className="mt-2 rounded-lg border p-3 whitespace-pre-wrap">
                        {answer?.longAnswer || "Not answered"}
                      </div>

                      <div className="mt-4">

                        <p className="text-sm font-medium">
                          AI Feedback
                        </p>

                        <div className="mt-2 rounded-lg bg-gray-50 border p-3 text-sm">
                          {result.feedback || "No feedback"}
                        </div>

                      </div>

                    </div>

                  )}

                </div>

              );
            })}

        </div>

      </main>
    </div>
  );
}