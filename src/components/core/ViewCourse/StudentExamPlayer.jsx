import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { FiCheckCircle, FiAlertCircle, FiUploadCloud, FiAward, FiClock, FiRefreshCw, FiInfo } from "react-icons/fi"
import { getExamByTarget, submitExam } from "../../../services/operations/examAPI"
import IconBtn from "../../Common/IconBtn"
import LeaderboardModal from "../Dashboard/Exam/LeaderboardModal"

export default function StudentExamPlayer({
  courseId = null,
  sectionId = null,
  subSectionId = null,
}) {
  const { token } = useSelector((state) => state.auth)
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [uploadFile, setUploadFile] = useState(null)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [latestSubmission, setLatestSubmission] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [practiceResult, setPracticeResult] = useState(null)

  const fetchExam = async () => {
    setLoading(true)
    const params = {}
    if (subSectionId) params.subSectionId = subSectionId
    else if (sectionId) params.sectionId = sectionId
    else if (courseId) params.courseId = courseId

    const result = await getExamByTarget(params, token)
    if (result && result.length > 0) {
      const activeExam = result[0]
      setExam(activeExam)
      if (activeExam.submissions && activeExam.submissions.length > 0) {
        setLatestSubmission(activeExam.submissions[0])
      }
    } else {
      setExam(null)
      setLatestSubmission(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExam()
    setSelectedAnswers({})
    setUploadFile(null)
    setShowResultPopup(false)
    setIsPracticeMode(false)
    setPracticeResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, sectionId, subSectionId])

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: String(optionIndex),
    }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleMcqSubmit = async () => {
    if (Object.keys(selectedAnswers).length < exam.questions.length) {
      alert("Please answer all questions before submitting.")
      return
    }

    setSubmitting(true)
    const result = await submitExam(
      {
        examId: exam.id,
        answers: selectedAnswers,
      },
      token
    )
    setSubmitting(false)
    if (result) {
      if (result.isPractice) {
        setPracticeResult(result)
        setShowResultPopup(true)
      } else {
        setLatestSubmission(result)
        setShowResultPopup(true)
        setIsPracticeMode(false)
        fetchExam()
      }
    }
  }

  const handleWrittenSubmit = async () => {
    if (!uploadFile) {
      alert("Please select a file to upload.")
      return
    }

    setSubmitting(true)
    const formData = new FormData()
    formData.append("examId", exam.id)
    formData.append("submissionFile", uploadFile)

    const result = await submitExam(formData, token)
    setSubmitting(false)
    if (result) {
      setLatestSubmission(result)
      setIsPracticeMode(false)
      fetchExam()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-richblack-300">
        <div className="spinner">Loading Exam Details...</div>
      </div>
    )
  }

  if (!exam) {
    return null
  }

  // Already Submitted View (When not in active Practice Mode)
  if (latestSubmission && !isPracticeMode) {
    const isMcq = exam.examType === "MCQ"
    const score = latestSubmission.obtainedMarks !== null ? latestSubmission.obtainedMarks : 0
    const passPercentage = exam.totalMarks * 0.5
    const isPassed = latestSubmission.status === "PASSED"

    return (
      <div className="my-6 rounded-md border border-richblack-700 bg-richblack-800 p-6 text-white font-inter">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-richblack-700 pb-4 mb-4 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-50 bg-yellow-500/10 px-2.5 py-1 rounded">
              {exam.examType} Exam
            </span>
            <h2 className="text-2xl font-bold text-richblack-5 mt-1">{exam.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            {latestSubmission.status === "PENDING" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-caribbeangreen-900/20 px-3.5 py-1 text-sm font-semibold text-yellow-50 border border-yellow-50/20">
                <FiClock className="animate-spin" /> Pending Evaluation
              </span>
            ) : isPassed ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-sm font-semibold text-emerald-400 border border-emerald-500/20">
                <FiCheckCircle /> Passed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-pink-900/20 px-3.5 py-1 text-sm font-semibold text-pink-400 border border-pink-500/20">
                <FiAlertCircle /> Failed
              </span>
            )}
          </div>
        </div>

        {/* Score & Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 bg-richblack-900 p-5 rounded-lg border border-richblack-700">
          <div className="flex flex-col items-center justify-center p-3 border-r border-richblack-800">
            <FiAward className="text-3xl text-yellow-50 mb-1" />
            <span className="text-xs text-richblack-400 uppercase tracking-wider">Official Score</span>
            <span className="text-2xl font-bold text-white mt-1">
              {latestSubmission.status === "PENDING" ? "--" : `${score} / ${exam.totalMarks}`}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 border-r border-richblack-800">
            <span className="text-xs text-richblack-400 uppercase tracking-wider">Submission Date</span>
            <span className="text-base font-semibold text-white mt-1">
              {new Date(latestSubmission.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3">
            <span className="text-xs text-richblack-400 uppercase tracking-wider font-semibold">Requirement</span>
            <span className="text-sm font-medium text-white mt-1">
              Min. {passPercentage} marks (50%)
            </span>
          </div>
        </div>

        {/* Leaderboard and Practice Retake Action Bar */}
        <div className="flex flex-wrap items-center gap-3 my-5 p-3 rounded-lg bg-richblack-900 border border-richblack-700">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm font-bold text-richblack-900 hover:bg-yellow-100 transition shadow"
          >
            <FiAward className="text-lg" /> 🏆 View Leaderboard
          </button>

          {isMcq && (
            <button
              onClick={() => {
                setIsPracticeMode(true);
                setSelectedAnswers({});
              }}
              className="flex items-center gap-2 rounded-lg border border-yellow-50/40 bg-richblack-800 px-4 py-2 text-sm font-semibold text-yellow-50 hover:bg-richblack-700 transition"
            >
              <FiRefreshCw className="text-base" /> Retake for Practice
            </button>
          )}

          <span className="text-xs text-richblack-400 ml-auto italic">
            * Official score is locked on the leaderboard.
          </span>
        </div>

        {/* Feedback Section */}
        {latestSubmission.feedback && (
          <div className="rounded-md bg-richblack-900 border-l-4 border-yellow-50 p-4 my-4">
            <h4 className="text-sm font-bold text-yellow-50">Instructor Feedback:</h4>
            <p className="text-sm text-richblack-200 mt-1 italic">"{latestSubmission.feedback}"</p>
          </div>
        )}

        {/* Written Upload File Info */}
        {!isMcq && latestSubmission.submissionUrl && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-richblack-300">Your Submission File:</h4>
            <a
              href={latestSubmission.submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-yellow-50 hover:underline border border-yellow-50/20 px-3 py-1.5 rounded bg-yellow-50/5 hover:bg-yellow-50/10 transition-all duration-200"
            >
              View Uploaded Assignment
            </a>
          </div>
        )}

        {/* Review MCQ responses */}
        {isMcq && exam.questions && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-richblack-200">Questions Review</h3>
            {exam.questions.map((q, idx) => {
              const selectedOptIdx = latestSubmission.answers?.[q.id];
              const isCorrectOpt = q.correctOption;

              return (
                <div key={q.id} className="rounded bg-richblack-900 p-4 border border-richblack-700 space-y-2">
                  <p className="text-sm font-semibold text-richblack-5">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = String(optIdx) === selectedOptIdx;
                      const isCorrect = String(optIdx) === isCorrectOpt;

                      let optClass = "text-xs p-2 rounded bg-richblack-800 text-richblack-200 border border-transparent";
                      if (isSelected) optClass = "text-xs p-2 rounded bg-pink-900/10 text-pink-300 border border-pink-500/20";
                      if (isCorrect) optClass = "text-xs p-2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";

                      return (
                        <div key={optIdx} className={optClass}>
                          <span className="font-semibold">{optIdx + 1}.</span> {opt}
                          {isCorrect && <span className="float-right font-bold text-emerald-400">✓ Correct</span>}
                          {isSelected && !isCorrect && <span className="float-right font-bold text-pink-400">✗ Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <LeaderboardModal
            examId={exam.id}
            examTitle={exam.title}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  // Active Test-Taking View (First attempt or Practice Mode)
  return (
    <div className="my-6 rounded-md border border-richblack-700 bg-richblack-800 p-6 text-white font-inter">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-richblack-700 pb-4 mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-yellow-50 bg-yellow-500/10 px-2.5 py-1 rounded">
              {exam.examType} Exam
            </span>
            {isPracticeMode && (
              <span className="text-xs font-bold uppercase tracking-wider text-caribbeangreen-100 bg-caribbeangreen-900/30 border border-caribbeangreen-200 px-2 py-0.5 rounded">
                Practice Mode
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-richblack-5 mt-1">{exam.title}</h2>
          {exam.description && (
            <p className="text-sm text-richblack-300 mt-1">{exam.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="flex items-center gap-1.5 rounded-lg border border-yellow-50/30 bg-richblack-700 px-3 py-1.5 text-xs font-semibold text-yellow-50 hover:bg-richblack-600 transition"
          >
            <FiAward /> Leaderboard
          </button>
          <span className="text-xs font-semibold text-richblack-300 bg-richblack-700 px-3 py-1.5 rounded">
            Total Marks: <span className="text-white font-bold">{exam.totalMarks}</span>
          </span>
        </div>
      </div>

      {/* Practice Mode Banner */}
      {isPracticeMode && (
        <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-yellow-50">
            <FiInfo className="text-lg shrink-0" />
            <span>
              <strong>Practice Mode Active:</strong> You are retaking this exam for self-assessment. Your official leaderboard score ({latestSubmission?.obtainedMarks}) will remain unchanged.
            </span>
          </div>
          <button
            onClick={() => setIsPracticeMode(false)}
            className="text-xs underline text-richblack-300 hover:text-white shrink-0 ml-3"
          >
            Cancel
          </button>
        </div>
      )}

      {/* MCQ Exam Content */}
      {exam.examType === "MCQ" && (
        <div className="space-y-6">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-lg bg-richblack-900 p-5 border border-richblack-700 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold text-richblack-5">
                    {idx + 1}. {q.questionText}
                  </h3>
                  <span className="text-xs text-richblack-400 font-medium">Question {idx + 1} of {exam.questions.length}</span>
                </div>

                <div className="space-y-2 mt-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === String(optIdx);
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleOptionChange(q.id, optIdx)}
                        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer border transition-all duration-150 ${
                          isSelected
                            ? "bg-yellow-500/10 border-yellow-50 text-white font-medium"
                            : "bg-richblack-800 border-richblack-700 text-richblack-200 hover:bg-richblack-700/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question_${q.id}`}
                          checked={isSelected}
                          onChange={() => handleOptionChange(q.id, optIdx)}
                          className="w-4 h-4 text-yellow-50 focus:ring-yellow-50 bg-richblack-700 border-richblack-500"
                        />
                        <span className="text-sm leading-normal">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-richblack-400 py-6">
              No questions found for this exam.
            </p>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-richblack-700">
            <span className="text-xs text-richblack-400">
              Answered: {Object.keys(selectedAnswers).length} / {exam.questions?.length || 0}
            </span>
            <IconBtn
              disabled={submitting}
              text={
                submitting
                  ? "Evaluating..."
                  : isPracticeMode
                  ? "Submit Practice Run"
                  : "Submit Official Exam"
              }
              onclick={handleMcqSubmit}
            />
          </div>
        </div>
      )}

      {/* Written Exam Content */}
      {exam.examType === "WRITTEN" && (
        <div className="space-y-6">
          <div className="rounded-lg bg-richblack-900 p-5 border border-richblack-700 space-y-4">
            <h3 className="text-base font-semibold text-richblack-5">Upload Assignment Submission</h3>
            <p className="text-xs text-richblack-400">
              Please upload your assignment in PDF, PNG, JPG, or JPEG format. Max file size: 10MB.
            </p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-richblack-600 rounded-md p-6 bg-richblack-800 cursor-pointer relative hover:border-yellow-50 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FiUploadCloud className="text-4xl text-yellow-50 mb-2" />
              {uploadFile ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-yellow-50">{uploadFile.name}</p>
                  <p className="text-xs text-richblack-400 mt-1">
                    {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <p className="text-sm text-richblack-300 text-center">
                  Drag and drop file here, or <span className="text-yellow-50 font-semibold">browse</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-richblack-700">
            <IconBtn
              disabled={submitting || !uploadFile}
              text={submitting ? "Uploading..." : "Submit Assignment"}
              onclick={handleWrittenSubmit}
            />
          </div>
        </div>
      )}

      {/* Scorecard Modal */}
      {showResultPopup && (
        <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center bg-white/10 backdrop-blur-sm">
          <div className="w-11/12 max-w-[450px] rounded-xl border border-richblack-700 bg-richblack-800 p-6 text-center font-inter text-white shadow-2xl">
            <FiAward className="text-5xl text-yellow-50 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-richblack-5">
              {practiceResult?.isPractice ? "Practice Run Complete!" : "Exam Submitted!"}
            </h3>
            <p className="text-richblack-300 text-xs mt-1">
              {practiceResult?.isPractice
                ? "Your self-study practice run was auto-evaluated."
                : "Your official score has been recorded for the Leaderboard!"}
            </p>

            <div className="my-5 bg-richblack-900 p-4 rounded-lg border border-richblack-700">
              <span className="text-xs text-richblack-400 uppercase tracking-wider block">
                {practiceResult?.isPractice ? "Practice Score" : "Your Official Score"}
              </span>
              <span className="text-4xl font-extrabold text-white block mt-1">
                {(practiceResult || latestSubmission)?.obtainedMarks} / {exam.totalMarks}
              </span>
              <span className="text-xs font-semibold block mt-2">
                Result Status:{" "}
                <span
                  className={
                    (practiceResult || latestSubmission)?.status === "PASSED"
                      ? "text-emerald-400 font-bold"
                      : "text-pink-400 font-bold"
                  }
                >
                  {(practiceResult || latestSubmission)?.status}
                </span>
              </span>
              {practiceResult?.isPractice && (
                <p className="text-[11px] text-yellow-50 mt-2 italic">
                  * Note: Your official score on the leaderboard remains {practiceResult.officialMarks} pts.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResultPopup(false);
                  setShowLeaderboard(true);
                }}
                className="flex-1 rounded-md bg-yellow-50 py-2.5 font-bold text-richblack-900 hover:bg-yellow-100 transition"
              >
                🏆 View Leaderboard
              </button>
              <button
                onClick={() => setShowResultPopup(false)}
                className="flex-1 rounded-md border border-richblack-700 bg-richblack-700 py-2.5 font-semibold text-richblack-100 hover:bg-richblack-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          examId={exam.id}
          examTitle={exam.title}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </div>
  )
}
