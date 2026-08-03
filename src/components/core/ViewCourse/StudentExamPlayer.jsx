import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { FiCheckCircle, FiAlertCircle, FiUploadCloud, FiAward, FiClock } from "react-icons/fi"
import { getExamByTarget, submitExam } from "../../../services/operations/examAPI"
import IconBtn from "../../Common/IconBtn"

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

  const fetchExam = async () => {
    setLoading(true)
    const params = {}
    if (subSectionId) params.subSectionId = subSectionId
    else if (sectionId) params.sectionId = sectionId
    else if (courseId) params.courseId = courseId

    console.log("FETCH EXAM PROP ID:", { subSectionId, sectionId, courseId }, "PARAMS:", params)
    const result = await getExamByTarget(params, token)
    console.log("FETCH EXAM RESULT:", result)
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
    // Validate that all questions are answered
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
      setLatestSubmission(result)
      setShowResultPopup(true)
      fetchExam()
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
    return null // Or return a message like "No exam set for this section."
  }

  // Already Submitted View
  if (latestSubmission) {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 bg-richblack-900 p-5 rounded-lg border border-richblack-700">
          <div className="flex flex-col items-center justify-center p-3 border-r border-richblack-800">
            <FiAward className="text-3xl text-yellow-50 mb-1" />
            <span className="text-xs text-richblack-400 uppercase tracking-wider">Score Obtained</span>
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

        {/* Review MCQ responses if exam was graded */}
        {isMcq && exam.questions && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-richblack-200">Questions Review</h3>
            {exam.questions.map((q, idx) => {
              const selectedOptIdx = latestSubmission.answers?.[q.id];
              const isCorrect = selectedOptIdx === q.correctOption;
              return (
                <div key={q.id} className="rounded bg-richblack-900 p-4 border border-richblack-700 space-y-2">
                  <p className="text-sm font-semibold text-richblack-5">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = String(optIdx) === selectedOptIdx;
                      const isCorrectOpt = String(optIdx) === q.correctOption;
                      
                      let optClass = "text-xs p-2 rounded bg-richblack-800 text-richblack-200 border border-transparent";
                      if (isSelected) optClass = "text-xs p-2 rounded bg-pink-900/10 text-pink-300 border border-pink-500/20";
                      if (isCorrectOpt) optClass = "text-xs p-2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
                      
                      return (
                        <div key={optIdx} className={optClass}>
                          <span className="font-semibold">{optIdx + 1}.</span> {opt}
                          {isCorrectOpt && <span className="float-right font-bold text-emerald-400">✓ Correct</span>}
                          {isSelected && !isCorrectOpt && <span className="float-right font-bold text-pink-400">✗ Your Choice</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )
  }

  // Active Exam Form
  return (
    <div className="my-6 rounded-md border border-richblack-700 bg-richblack-800 p-6 text-white font-inter">
      <div className="border-b border-richblack-700 pb-4 mb-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-yellow-50 bg-yellow-500/10 px-2.5 py-1 rounded">
          {exam.examType} Exam
        </span>
        <h2 className="text-2xl font-bold text-richblack-5 mt-1">{exam.title}</h2>
        {exam.description && <p className="text-sm text-richblack-300 mt-2">{exam.description}</p>}
        <div className="flex items-center gap-4 mt-3 text-xs text-richblack-400">
          <span>Total Marks: <strong className="text-white">{exam.totalMarks}</strong></span>
          <span>•</span>
          <span>Time: <strong className="text-white">Self-paced</strong></span>
        </div>
      </div>

      {exam.examType === "MCQ" ? (
        // MCQ Questions Player
        <div className="space-y-6">
          {exam.questions.map((q, qIndex) => (
            <div key={q.id} className="rounded-md border border-richblack-700 bg-richblack-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-richblack-5">
                {qIndex + 1}. {q.questionText}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all duration-200 ${
                      selectedAnswers[q.id] === String(optIndex)
                        ? "bg-richblack-700 border-yellow-50"
                        : "bg-richblack-800 border-richblack-700 hover:bg-richblack-700/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${q.id}`}
                      value={optIndex}
                      checked={selectedAnswers[q.id] === String(optIndex)}
                      onChange={() => handleOptionChange(q.id, optIndex)}
                      className="accent-yellow-50 h-4 w-4"
                    />
                    <span className="text-sm text-richblack-200">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t border-richblack-700">
            <IconBtn
              disabled={submitting}
              text={submitting ? "Submitting..." : "Submit Exam"}
              onclick={handleMcqSubmit}
            />
          </div>
        </div>
      ) : (
        // WRITTEN Assignment Player
        <div className="space-y-6">
          <div className="rounded-md border border-richblack-700 bg-richblack-900 p-5 space-y-4">
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

      {/* MCQ Instant Scorecard Popup */}
      {showResultPopup && latestSubmission && (
        <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="w-11/12 max-w-[450px] rounded-lg border border-richblack-700 bg-richblack-800 p-6 text-center font-inter text-white">
            <FiAward className="text-6xl text-yellow-50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-richblack-5">Exam Submitted!</h3>
            <p className="text-richblack-300 text-sm mt-1">Your auto-graded result is ready.</p>

            <div className="my-6 bg-richblack-900 p-4 rounded border border-richblack-700">
              <span className="text-xs text-richblack-400 uppercase tracking-wider block">Your Score</span>
              <span className="text-4xl font-extrabold text-white block mt-1">
                {latestSubmission.obtainedMarks} / {exam.totalMarks}
              </span>
              <span className="text-xs font-semibold block mt-2">
                Result Status:{" "}
                <span
                  className={
                    latestSubmission.status === "PASSED" ? "text-emerald-400" : "text-pink-400"
                  }
                >
                  {latestSubmission.status}
                </span>
              </span>
            </div>

            <button
              onClick={() => setShowResultPopup(false)}
              className="w-full rounded-md bg-yellow-50 py-[10px] px-[20px] font-semibold text-richblack-900 hover:scale-95 transition-all duration-200"
            >
              View Detailed Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
