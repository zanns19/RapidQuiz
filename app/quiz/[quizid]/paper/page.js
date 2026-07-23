"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";



const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function QuizPaperPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params.quizId;

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchResults();
    }, [quizId]);

    const fetchResults = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_URL}/api/quiz/${quizId}/paper`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || "Could not load paper for this quiz.");
            } else {
                setQuiz(data.quiz || data);
            }
        } catch (err) {
            setError("Could not reach the server. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

const handleDownloadPdf = async () => {
Swal.fire({
  icon: "info",
  title: "Printing Recommendation",
  html: `
    <div style="text-align:left">
      <p>For the best readability, use the following settings:</p>
      <ul>
        <li><b>Paper Size:</b> Letter</li>
        <li><b>Margins:</b> None</li>
        <li><b>Scale:</b> 88% or accordingly</li>
      </ul>
    </div>
  `,
  confirmButtonText: "Print",
   didClose: () => {
    window.print();
  },
});
};
    const totalMarks =
        quiz?.questions?.reduce((sum, q) => sum + (Number(q.marks) || 0), 0) || 0;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#EEF2F6] text-sm text-[#64748B]">
                Loading paper…
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

    return (
        <div className="bg-[#eef2f6] min-h-screen py-8">
            {/* Toolbar */}
            <div className="no-print max-w-5xl mx-auto flex justify-between items-center mb-6 px-2">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                >
                    <BackIcon />
                    Back to Dashboard
                </button>

                <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 bg-[#0B2A2A] text-white px-4 py-2 rounded-md hover:bg-[#0B6E4F]"
                >
                    <DownloadIcon />
                    Download PDF
                </button>
            </div>

            {/* Paper */}
            <div className="paper">

                {/* Header */}
                <div className="text-center border-b p-1">
                    <div className="relative flex items-center justify-end sm:justify-center">
                        <div className="absolute left-0">
                            <Image
                                src="/logo.png"
                                alt="UAF Logo"
                                width={50}
                                height={25}
                                loading="eager"
                            />
                        </div>
                        <h2 className=" text-xs pr-6 sm:pr-0 sm:text-md md:text-lg font-semibold underline">
                            UAF CONSTITUENT COLLEGES T.T.SINGH
                        </h2>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <p className="text-lg  font-semibold">
                            {quiz?.courseTitle}
                        </p>

                        <p className="text-sm text-gray-600">
                            ({quiz?.courseCode})
                        </p>

                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs mt-3 border-b pb-3">
                    <p>
                        <strong>Name:</strong> <span className="underline">______________________</span>
                    </p>
                    <p>
                        <strong>Registration No:</strong> <span className="underline">_________________</span>
                    </p>
                    <p>
                        <strong>Department:</strong> {quiz?.department}
                    </p>

                    <p>
                        <strong>Semester:</strong> {quiz?.semester}
                    </p>
                    <p>
                        <strong>Total Marks:</strong> {totalMarks}
                    </p>

                    <p>
                        <strong>Time Allowed:</strong> {quiz?.timeAllowed} min
                    </p>
                </div>


                {/* Questions */}
                <div className="mt-4 text-xs">

                    {/* MCQs */}
                    {quiz?.questions?.some((q) => q.type === "mcq") && (
                        <>
                            <h3 className="font-semibold text-base mb-3">
                                Tick the correct option from the following:
                            </h3>

                            {quiz.questions
                                .filter((q) => q.type === "mcq")
                                .map((q, index) => (
                                    <div key={q._id || index} className="question">
                                        <div className="flex justify-between items-start gap-6">
                                            <p className="font-normal leading-7 flex-1">
                                                Q{index + 1}. {q.text}
                                            </p>

                                            <span className="font-semibold whitespace-nowrap">
                                                ({q.marks} {Number(q.marks) === 1 ? "Mark" : "Marks"})
                                            </span>
                                        </div>

                                        <div className="options">
                                            {q.options?.map((opt, i) => (
                                                <div key={i} className="option text-xs">
                                                    <span className="mr-2">
                                                        {String.fromCharCode(65 + i)}.
                                                    </span>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </>
                    )}

                    {/* Long Questions */}
                    {quiz?.questions?.some((q) => q.type !== "mcq") && (
                        <>
                            <h3 className="font-semibold text-base mt-4 mb-2">
                                Solve the following questions:
                            </h3>

                            {quiz.questions
                                .filter((q) => q.type !== "mcq")
                                .map((q, index) => (
                                    <div key={q._id || index} className="question">
                                        <div className="flex justify-between items-start gap-6">
                                            <p className="font-normal leading-7 flex-1">
                                                Q{quiz.questions.filter(x => x.type === "mcq").length + index + 1}. {q.text}
                                            </p>

                                            <span className="font-semibold whitespace-nowrap">
                                                ({q.marks} {Number(q.marks) === 1 ? "Mark" : "Marks"})
                                            </span>
                                        </div>

                                        <div className="long-answer font-normal"></div>
                                    </div>
                                ))}
                        </>
                    )}

                </div>
            </div>

            <style jsx>{`
      .paper {
        width: 210mm;
        min-height: 297mm;
        margin: auto;
        background: white;
        padding: 10mm;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        color: #111827;
      }

      .question {
        margin-bottom: 10px;
        page-break-inside: avoid;
      }

      .options {
        margin-top: 10px;
        margin-left: 14px;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px 22px;
      }

      .option {
        font-size: 10px;
        line-height: 1;
      }

      .long-answer {
        margin-top: 5px;
      }

      .long-answer div {
        border-bottom: 1px solid #d1d5db;
        height: 22px;
      }

      @media (max-width: 900px) {
        .paper {
          width: 100%;
          min-height: auto;
          padding: 24px;
          box-shadow: none;
        }

        // .options {
        //   grid-template-columns: 4fr;
        // }
      }

      @media print {

        body {
          background: white;
          margin: 0;
        }

        .no-print {
          display: none !important;
        }

        .paper {
          width: 100%;
          min-height: auto;
          margin: 0;
          padding: 5mm;
          box-shadow: none;
          page-break-after: always;
        }

        .question {
          page-break-inside: avoid;
        }
      }
    `}</style>
        </div>
    );
}
function MetaItem({ label, value }) {
    return (
        <div>
            <p className="text-xs text-[#94A3B8] mb-0.5">{label}</p>
            <p className="text-sm font-medium text-[#0B2027] capitalize">{value ?? "—"}</p>
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

function DownloadIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
    );
}

