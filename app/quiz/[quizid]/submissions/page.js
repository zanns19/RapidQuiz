"use client";
import { Fragment, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

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
  const [sortConfig, setSortConfig] = useState({
    key: "regNumber",
    direction: "asc",
  });

  useEffect(() => {
    fetchData();

    if (!sessionStorage.getItem("submissionsInstructionsShown")) {
      sessionStorage.setItem("submissionsInstructionsShown", "true");
      Swal.fire({
        icon: "info",
        title: "A few things you can do here",
        html: `
          <ul style="text-align:left; padding-left: 1.1em; margin: 0;">
            <li>Download all submissions as an Excel file</li>
            <li>Sort students by registration number or marks</li>
            <li>Click "View" on any student to manually grade or adjust their marks</li>
          </ul>
        `,
        confirmButtonText: "Got it",
        confirmButtonColor: "#0B6E4F",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const toggleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  // Optimistically updates local state so the total score and table
  // refresh instantly, then persists the change to the backend.
  const handleMarksUpdate = async (attemptId, questionIndex, maxMarks, rawValue) => {
    let marks = Number(rawValue);
    if (Number.isNaN(marks)) marks = 0;
    marks = Math.max(0, Math.min(maxMarks, marks));

    setAttempts((prev) =>
      prev.map((a) => {
        if (a._id !== attemptId) return a;
        const updatedResults = a.results.map((r) =>
          r.questionIndex === questionIndex ? { ...r, awardedMarks: marks, needsReview: false } : r
        );
        const totalScore = updatedResults.reduce((sum, r) => sum + r.awardedMarks, 0);
        return { ...a, results: updatedResults, totalScore };
      })
    );

    try {
      await fetch(`${API_URL}/api/attempt/${attemptId}/marks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionIndex, awardedMarks: marks }),
      });
    } catch (err) {
      // Non-critical — worst case the teacher re-enters the value; the
      // table already reflects what they typed.
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "RapidQuiz";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Submissions", {
      views: [{ showGridLines: false }],
    });

    const columnCount = 7;

    // --- Column widths ---
    sheet.columns = [
      { key: "name", width: 24 },
      { key: "reg", width: 16 },
      { key: "status", width: 14 },
      { key: "score", width: 10 },
      { key: "maxScore", width: 12 },
      { key: "tabSwitches", width: 14 },
      { key: "submittedAt", width: 22 },
    ];

    // --- Title row: course title ---
    sheet.mergeCells(1, 1, 1, columnCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = quiz?.courseTitle || "Quiz Submissions";
    titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FF0B2027" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 32;

    // --- Subtitle row: course code • department • semester ---
    sheet.mergeCells(2, 1, 2, columnCount);
    const subtitleCell = sheet.getCell(2, 1);
    const subtitleParts = [quiz?.courseCode, quiz?.department, quiz?.semester ? `Semester ${quiz.semester}` : null]
      .filter(Boolean)
      .join("   •   ");
    subtitleCell.value = subtitleParts;
    subtitleCell.font = { name: "Calibri", size: 11, color: { argb: "FF64748B" } };
    sheet.getRow(2).height = 20;

    // --- Stats row: attempts / submitted / difficulty ---
    sheet.mergeCells(3, 1, 3, columnCount);
    const statsCell = sheet.getCell(3, 1);
    statsCell.value = `${attempts.length} attempts   •   ${submittedCount} submitted   •   Checking difficulty: ${
      quiz?.checkingDifficulty || "medium"
    }`;
    statsCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF94A3B8" } };
    sheet.getRow(3).height = 18;

    // --- Spacer row ---
    sheet.getRow(4).height = 8;

    // --- Header row ---
    const headerRowIndex = 5;
    const headers = ["Name", "Reg. Number", "Status", "Marks", "Total Marks", "Tab Switches", "Submitted At"];
    const headerRow = sheet.getRow(headerRowIndex);
    headers.forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B6E4F" } };
      cell.alignment = { vertical: "middle", horizontal: i >= 2 ? "center" : "left" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    headerRow.height = 24;

    // --- Data rows ---
    sortedAttempts.forEach((attempt, idx) => {
      const rowIndex = headerRowIndex + 1 + idx;
      const row = sheet.getRow(rowIndex);
      const isSubmitted = attempt.status === "submitted";

      row.getCell(1).value = attempt.studentName;
      row.getCell(2).value = attempt.regNumber;
      row.getCell(3).value = isSubmitted ? "Submitted" : "In progress";
      row.getCell(4).value = isSubmitted ? attempt.totalScore : "—";
      row.getCell(5).value = isSubmitted ? attempt.maxScore : "—";
      row.getCell(6).value = attempt.tabSwitchCount || 0;
      row.getCell(7).value = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—";

      // Zebra striping
      if (idx % 2 === 1) {
        for (let c = 1; c <= columnCount; c++) {
          row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }
      }

      // Status badge coloring
      const statusCell = row.getCell(3);
      statusCell.font = {
        bold: true,
        color: { argb: isSubmitted ? "FF0B6E4F" : "FF64748B" },
      };
      statusCell.alignment = { horizontal: "center" };

      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).alignment = { horizontal: "center" };
      row.getCell(6).alignment = { horizontal: "center" };

      // Highlight tab-switch flags
      if (attempt.tabSwitchCount > 0) {
        row.getCell(6).font = { bold: true, color: { argb: "FFD97706" } };
      }
    });

    // --- Borders around the whole table ---
    const lastRow = headerRowIndex + sortedAttempts.length;
    for (let r = headerRowIndex; r <= lastRow; r++) {
      for (let c = 1; c <= columnCount; c++) {
        sheet.getCell(r, c).border = {
          ...sheet.getCell(r, c).border,
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      }
    }

    // --- Generate and download ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/octet-stream",
    });
    const fileName = `${quiz?.courseCode || "quiz"}-submissions.xlsx`;
    saveAs(blob, fileName);
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    if (sortConfig.key === "regNumber") {
      return a.regNumber.localeCompare(b.regNumber, undefined, { numeric: true }) * dir;
    }

    if (sortConfig.key === "score") {
      // Ungraded (in-progress) attempts have no score yet — keep them at the bottom
      const aScore = a.status === "submitted" ? a.totalScore : -Infinity;
      const bScore = b.status === "submitted" ? b.totalScore : -Infinity;
      return (aScore - bScore) * dir;
    }

    return 0;
  });

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

          {attempts.length > 0 && (
            <button
              onClick={() => exportToExcel()}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg bg-[#0B6E4F] text-white hover:bg-[#095b41] transition"
            >
              <DownloadIcon />
              Export to Excel
            </button>
          )}
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
                    <th className="px-3 sm:px-5 py-3 font-medium">
                      <SortableHeaderButton
                        label="Reg. number"
                        sortKey="regNumber"
                        sortConfig={sortConfig}
                        onClick={toggleSort}
                      />
                    </th>
                    <th className="px-3 sm:px-5 py-3 font-medium">Status</th>
                    <th className="px-3 sm:px-5 py-3 font-medium">
                      <SortableHeaderButton
                        label="Marks"
                        sortKey="score"
                        sortConfig={sortConfig}
                        onClick={toggleSort}
                      />
                    </th>
                    <th className="px-3 sm:px-5 py-3 font-medium">Tab switches</th>
                    <th className="px-3 sm:px-5 py-3 font-medium">Submitted</th>
                    <th className="px-3 sm:px-5 py-3 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAttempts.map((attempt) => (
                    <Fragment key={attempt._id}>
                      <tr className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC]">
                        <td className="px-3 sm:px-5 py-3.5 font-medium text-[#0B2027]">
                          {attempt.studentName}
                        </td>
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
                        <td className="px-3 sm:px-5 py-3.5">
                          {attempt.tabSwitchCount > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-600 text-xs font-medium px-2.5 py-1">
                              {attempt.tabSwitchCount}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">0</span>
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
                          <td colSpan={7} className="bg-[#F8FAFC] px-3 sm:px-5 py-4 sm:py-5">
                            <AttemptBreakdown attempt={attempt} quiz={quiz} onMarksUpdate={handleMarksUpdate} />
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

function SortableHeaderButton({ label, sortKey, sortConfig, onClick }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`inline-flex items-center gap-1 font-medium transition ${
        isActive ? "text-[#0B2027]" : "text-[#64748B] hover:text-[#0B2027]"
      }`}
    >
      {label}
      <SortIcon active={isActive} direction={sortConfig.direction} />
    </button>
  );
}

function SortIcon({ active, direction }) {
  // Neutral (unsorted) state — two small stacked chevrons
  if (!active) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#CBD5E1]">
        <path d="M7 9l5-5 5 5" />
        <path d="M7 15l5 5 5-5" />
      </svg>
    );
  }
  // Active — single chevron pointing the current sort direction
  return direction === "asc" ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 15l6-6 6 6" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function AttemptBreakdown({ attempt, quiz, onMarksUpdate }) {
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
                  <EditableMarks
                    result={result}
                    onCommit={(newValue) =>
                      onMarksUpdate(attempt._id, result.questionIndex, result.maxMarks, newValue)
                    }
                  />
                </div>
              </div>

              {result.type === "mcq" ? (
                <p className="text-sm text-[#64748B]">
                  Student answered:{" "}
                  <span className="font-medium text-[#0B2027]">
                    {answer?.selectedOption != null
                      ? `${String.fromCharCode(65 + answer.selectedOption)}. ${
                          question?.options?.[answer.selectedOption] ?? ""
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

// A small number input that looks like the score badge until you click it.
// Commits on blur or Enter, so it doesn't fire a request on every keystroke.
function EditableMarks({ result, onCommit }) {
  const [value, setValue] = useState(result.awardedMarks);

  useEffect(() => {
    setValue(result.awardedMarks);
  }, [result.awardedMarks]);

  const colorClass =
    result.awardedMarks === result.maxMarks
      ? "border-[#0B6E4F] bg-[#EAF6F1] text-[#0B6E4F]"
      : result.awardedMarks === 0
      ? "border-red-300 bg-red-50 text-red-600"
      : "border-[#FF5A36]/40 bg-[#FFF1EC] text-[#FF5A36]";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border text-xs font-medium px-1.5 py-0.5 ${colorClass}`}>
      <input
        type="number"
        min={0}
        max={result.maxMarks}
        step="0.5"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.target.blur();
        }}
        className="w-10 bg-transparent text-right font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        title="Click to edit marks"
      />
      / {result.maxMarks}
    </span>
  );
}

function AttemptStatusBadge({ status }) {
  const styles = {
    "in-progress": "bg-[#F1F5F9] text-[#64748B]",
    submitted: "bg-[#EAF6F1] text-[#0B6E4F]",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        styles[status] || styles["in-progress"]
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
function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
