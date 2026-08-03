import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useSelector } from "react-redux"

export default function InstructorQuizEvaluation() {
  const { token } = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [quizzes, setQuizzes] = useState([])
  const [selectedQuiz, setSelectedQuiz] = useState("")
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [gradingModal, setGradingModal] = useState(null) // { userId, quizId, studentName, score, feedback }

  useEffect(() => {
    fetchInstructorCourses()
  }, [])

  const fetchInstructorCourses = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/v1/course/getInstructorCourses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await response.json()
      if (res.success && res.data) {
        setCourses(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCourseSelect = async (courseId) => {
    setSelectedCourse(courseId)
    setSelectedQuiz("")
    setSubmissions([])
    if (!courseId) return

    const course = courses.find((c) => (c.id || c._id) === courseId)
    if (!course) return

    // Extract all quizzes attached to this course sections / subsections
    const foundQuizzes = []
    if (course.courseContent) {
      for (const sec of course.courseContent) {
        // fetch section quiz
        try {
          const res = await fetch(`http://localhost:5001/api/v1/course/quiz/get/SECTION/${sec.id || sec._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()
          if (data.success && data.hasQuiz && data.quiz) {
            foundQuizzes.push({ ...data.quiz, label: `Section Exam: ${sec.sectionName}` })
          }
        } catch (e) {}

        for (const sub of sec.subSection || []) {
          try {
            const res = await fetch(`http://localhost:5001/api/v1/course/quiz/get/SUBSECTION/${sub.id || sub._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success && data.hasQuiz && data.quiz) {
              foundQuizzes.push({ ...data.quiz, label: `Lecture Quiz: ${sub.title}` })
            }
          } catch (e) {}
        }
      }
    }

    // fetch final course exam
    try {
      const res = await fetch(`http://localhost:5001/api/v1/course/quiz/get/COURSE_FINAL/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.hasQuiz && data.quiz) {
        foundQuizzes.push({ ...data.quiz, label: `Final Certificate Exam: ${course.courseName}` })
      }
    } catch (e) {}

    setQuizzes(foundQuizzes)
  }

  const fetchSubmissions = async (quizId) => {
    setSelectedQuiz(quizId)
    if (!quizId) return
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5001/api/v1/course/quiz/instructor/results/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await response.json()
      if (res.success) {
        setSubmissions(res.data)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleGradeSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:5001/api/v1/course/quiz/instructor/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: gradingModal.quizId,
          userId: gradingModal.userId,
          score: gradingModal.score,
          feedback: gradingModal.feedback,
        }),
      })
      const res = await response.json()
      if (res.success) {
        toast.success("Grade and feedback updated!")
        setGradingModal(null)
        fetchSubmissions(selectedQuiz)
      } else {
        toast.error(res.message || "Failed to update grade")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error updating grade")
    }
  }

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold text-richblack-5">Exam & Assignment Evaluation</h1>
      <p className="text-sm text-richblack-300">View student exam submissions, grades, and manual assignment script evaluation.</p>

      {/* Course & Exam Filter Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-richblack-800 p-4 border border-richblack-700">
        <div>
          <label className="text-sm font-semibold text-richblack-100">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseSelect(e.target.value)}
            className="form-style w-full mt-1 text-sm"
          >
            <option value="">-- Choose Course --</option>
            {courses.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.courseName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-richblack-100">Select Exam / Assignment</label>
          <select
            value={selectedQuiz}
            onChange={(e) => fetchSubmissions(e.target.value)}
            disabled={!quizzes.length}
            className="form-style w-full mt-1 text-sm"
          >
            <option value="">-- Choose Exam ({quizzes.length} available) --</option>
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label} ({q.title})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      {selectedQuiz && (
        <div className="rounded-lg bg-richblack-800 p-6 border border-richblack-700">
          <h2 className="text-lg font-bold text-yellow-50 mb-4">Student Submissions</h2>
          {loading ? (
            <p className="text-center py-6 text-richblack-300">Loading submissions...</p>
          ) : submissions.length === 0 ? (
            <p className="text-center py-6 text-richblack-300">No submissions found for this exam.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-richblack-700 text-richblack-100">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Submission Type</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted File</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-richblack-700">
                  {submissions.map((sub) => (
                    <tr key={sub.userId} className="hover:bg-richblack-750">
                      <td className="p-3 font-semibold text-richblack-5">
                        {sub.firstName} {sub.lastName}
                      </td>
                      <td className="p-3 text-richblack-200">{sub.email}</td>
                      <td className="p-3 text-richblack-300">{sub.answersJson ? "MCQ" : "Written File"}</td>
                      <td className="p-3 font-bold text-yellow-50">
                        {sub.score !== null ? `${sub.score}` : "N/A"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2.5 py-1 text-xs font-bold ${
                            sub.status === "GRADED"
                              ? sub.isPassed
                                ? "bg-caribbeangreen-200 text-black"
                                : "bg-pink-200 text-black"
                              : "bg-yellow-50 text-black"
                          }`}
                        >
                          {sub.status === "GRADED" ? (sub.isPassed ? "PASSED" : "FAILED") : "PENDING EVALUATION"}
                        </span>
                      </td>
                      <td className="p-3">
                        {sub.submissionUrl ? (
                          <a
                            href={sub.submissionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-richblack-700 border border-yellow-50 px-2 py-1 text-xs text-yellow-50 hover:underline"
                          >
                            View Script PDF
                          </a>
                        ) : (
                          <span className="text-xs text-richblack-400">No File</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() =>
                            setGradingModal({
                              quizId: sub.quizId,
                              userId: sub.userId,
                              studentName: `${sub.firstName} ${sub.lastName}`,
                              score: sub.score || 0,
                              feedback: sub.feedback || "",
                            })
                          }
                          className="rounded bg-yellow-50 px-3 py-1 text-xs font-semibold text-black hover:scale-95"
                        >
                          Grade / Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manual Grading Modal */}
      {gradingModal && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-11/12 max-w-[500px] rounded-lg border border-richblack-600 bg-richblack-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-yellow-50">Grade Student: {gradingModal.studentName}</h3>
            <form onSubmit={handleGradeSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-richblack-100">Marks / Score</label>
                <input
                  type="number"
                  required
                  value={gradingModal.score}
                  onChange={(e) => setGradingModal({ ...gradingModal, score: e.target.value })}
                  className="form-style w-full mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-richblack-100">Teacher Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Enter remarks or feedback for student..."
                  value={gradingModal.feedback}
                  onChange={(e) => setGradingModal({ ...gradingModal, feedback: e.target.value })}
                  className="form-style w-full mt-1 text-sm"
                />
              </div>
              <div className="flex justify-end gap-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingModal(null)}
                  className="rounded bg-richblack-700 px-4 py-1.5 text-xs text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-yellow-50 px-4 py-1.5 text-xs font-bold text-black">
                  Save Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
