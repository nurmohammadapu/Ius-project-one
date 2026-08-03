import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useSelector } from "react-redux"

export default function StudentQuizPlayer({ quizType, targetId }) {
  const { token } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [quizData, setQuizData] = useState(null)
  const [userResult, setUserResult] = useState(null)
  const [isUpcoming, setIsUpcoming] = useState(false)
  const [publishDate, setPublishDate] = useState(null)
  const [isExpired, setIsExpired] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuiz()
  }, [quizType, targetId])

  const fetchQuiz = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5001/api/v1/course/quiz/get/${quizType}/${targetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success && result.hasQuiz) {
        if (result.isUpcoming) {
          setIsUpcoming(true)
          setPublishDate(result.publishDate)
          setQuizData(null)
        } else {
          setIsUpcoming(false)
          setQuizData(result.quiz)
          setUserResult(result.userResult)
          setIsExpired(result.isExpired)
        }
      } else {
        setQuizData(null)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleOptionSelect = (questionId, optionKey) => {
    if (isExpired || userResult) return
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionKey,
    })
  }

  const handleSubmitQuiz = async () => {
    if (isExpired) {
      toast.error("Deadline has passed! Submissions are closed.")
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("quizId", quizData.id)

      if (quizData.submissionType === "MCQ" || quizData.submissionType === "BOTH") {
        formData.append("answersJson", JSON.stringify(selectedAnswers))
      }

      if (submissionFile) {
        formData.append("submissionFile", submissionFile)
      }

      const response = await fetch("http://localhost:5001/api/v1/course/quiz/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const resData = await response.json()
      if (resData.success) {
        toast.success("Exam submitted successfully!")
        setUserResult(resData.data)
      } else {
        toast.error(resData.message || "Failed to submit exam")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error submitting exam")
    }
    setSubmitting(false)
  }

  if (loading) return null

  if (isUpcoming) {
    return (
      <div className="mt-6 rounded-lg border border-yellow-50/40 bg-richblack-800 p-5 text-center text-white space-y-2">
        <h3 className="text-lg font-bold text-yellow-50">⏳ Upcoming Exam Scheduled</h3>
        <p className="text-sm text-richblack-200">
          This exam will be published and unlocked on{" "}
          <span className="font-semibold text-yellow-100">{new Date(publishDate).toLocaleString()}</span>.
        </p>
      </div>
    )
  }

  if (!quizData) return null

  return (
    <div className="mt-6 rounded-lg border border-yellow-50/30 bg-richblack-800 p-6 space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-richblack-700 pb-3">
        <div>
          <h2 className="text-xl font-bold text-yellow-50">{quizData.title}</h2>
          <p className="text-xs text-richblack-300 mt-1">
            Type: {quizData.submissionType} | Pass Marks: {quizData.passMarks}/{quizData.totalMarks}
            {quizData.dueDate && ` | Deadline: ${new Date(quizData.dueDate).toLocaleString()}`}
          </p>
        </div>
        <div>
          {userResult ? (
            <div className="text-right">
              <span
                className={`rounded px-3 py-1 text-xs font-bold ${
                  userResult.status === "GRADED"
                    ? userResult.isPassed
                      ? "bg-caribbeangreen-200 text-black"
                      : "bg-pink-200 text-black"
                    : "bg-yellow-50 text-black"
                }`}
              >
                {userResult.status === "GRADED"
                  ? userResult.isPassed
                    ? `PASSED (${userResult.score}/${quizData.totalMarks})`
                    : `FAILED (${userResult.score}/${quizData.totalMarks})`
                  : "PENDING EVALUATION"}
              </span>
            </div>
          ) : isExpired ? (
            <span className="rounded bg-pink-200 px-3 py-1 text-xs font-bold text-black">
              ABSENT / DEADLINE EXPIRED
            </span>
          ) : null}
        </div>
      </div>

      {isExpired && !userResult && (
        <div className="rounded bg-pink-900/40 border border-pink-500 p-3 text-xs text-pink-100">
          ⚠️ The deadline for this exam has passed. You did not submit on time and are marked absent. Submissions are closed.
        </div>
      )}

      {quizData.description && (
        <p className="text-sm text-richblack-200">{quizData.description}</p>
      )}

      {/* Question File PDF Link */}
      {quizData.questionFileUrl && (
        <div className="rounded bg-richblack-700 p-3 flex items-center justify-between text-sm">
          <span>Question / Assignment Attachment:</span>
          <a
            href={quizData.questionFileUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded bg-yellow-50 px-3 py-1 text-xs font-semibold text-black hover:underline"
          >
            View / Download Question PDF
          </a>
        </div>
      )}

      {/* Previous Feedback */}
      {userResult?.feedback && (
        <div className="rounded bg-richblack-700 border-l-4 border-yellow-50 p-3 text-xs space-y-1">
          <p className="font-semibold text-yellow-50">Teacher's Feedback & Score Details:</p>
          <p className="text-richblack-100">{userResult.feedback}</p>
        </div>
      )}

      {/* MCQ Questions Player */}
      {quizData.questions && quizData.questions.length > 0 && (
        <div className="space-y-6 pt-2">
          {quizData.questions.map((q, idx) => (
            <div key={q.id} className="rounded-md border border-richblack-700 bg-richblack-900 p-4 space-y-2">
              <p className="font-medium text-sm text-richblack-5">
                {idx + 1}. {q.questionText} <span className="text-xs text-richblack-400">({q.marks} mark)</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                {["optionA", "optionB", "optionC", "optionD"].map((optKey) => (
                  <button
                    key={optKey}
                    type="button"
                    disabled={isExpired || !!userResult}
                    onClick={() => handleOptionSelect(q.id, optKey)}
                    className={`flex items-center gap-x-2 rounded-md border p-2.5 text-left transition-all ${
                      selectedAnswers[q.id] === optKey || userResult?.answersJson?.[q.id] === optKey
                        ? "border-yellow-50 bg-yellow-500/10 text-yellow-50 font-semibold"
                        : "border-richblack-700 bg-richblack-800 text-richblack-200 hover:bg-richblack-700"
                    }`}
                  >
                    <span className="h-4 w-4 rounded-full border border-richblack-400 flex items-center justify-center text-[10px]">
                      {optKey.replace("option", "")}
                    </span>
                    {q[optKey]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Assignment Submission */}
      {(quizData.submissionType === "FILE_UPLOAD" || quizData.submissionType === "BOTH") && (
        <div className="rounded-md border border-richblack-700 bg-richblack-900 p-4 space-y-2">
          <label className="text-sm font-semibold text-richblack-5">Upload Answer File / Script (PDF / Image)</label>
          <input
            type="file"
            accept=".pdf,image/*"
            disabled={isExpired || !!userResult}
            onChange={(e) => setSubmissionFile(e.target.files[0])}
            className="form-style w-full text-xs"
          />
          {userResult?.submissionUrl && (
            <p className="text-xs text-caribbeangreen-300 mt-1">
              Submitted File: <a href={userResult.submissionUrl} target="_blank" rel="noreferrer" className="underline">View Submission</a>
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!userResult && !isExpired && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitQuiz}
            className="rounded-md bg-yellow-50 px-6 py-2 text-sm font-semibold text-black hover:scale-95 transition-all"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      )}
    </div>
  )
}
