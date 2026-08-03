import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { FiAward, FiBookOpen, FiEdit3, FiX, FiCheckCircle } from "react-icons/fi"
import { getStudentExams } from "../../../../services/operations/examAPI"
import StudentExamPlayer from "../../../core/ViewCourse/StudentExamPlayer"

export default function StudentExamsList() {
  const { token } = useSelector((state) => state.auth)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeExam, setActiveExam] = useState(null)
  const [filter, setFilter] = useState("all") // "all", "not-taken", "pending-grading", "completed"

  const fetchExams = async () => {
    setLoading(true)
    const result = await getStudentExams(token)
    if (result) {
      setExams(result)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClosePlayer = () => {
    setActiveExam(null)
    fetchExams() // Refresh scores after closing the player
  }

  const filteredExams = exams.filter((exam) => {
    const hasSubmitted = !!exam.submission
    const status = exam.submission?.status

    if (filter === "not-taken") return !hasSubmitted
    if (filter === "pending-grading") return hasSubmitted && status === "PENDING"
    if (filter === "completed") return hasSubmitted && status !== "PENDING"
    return true
  })

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10 font-inter text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium text-richblack-5">My Exams</h1>
          <p className="text-xs text-richblack-400 mt-1">
            View and take exams for all your enrolled courses.
          </p>
        </div>
        <span className="text-xs bg-yellow-500/10 text-yellow-50 px-3 py-1 rounded-full font-semibold border border-yellow-50/20">
          {exams.length} Exams Available
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-richblack-700 mb-6 gap-x-6 text-sm font-semibold overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`pb-2.5 whitespace-nowrap transition-all ${
            filter === "all"
              ? "text-yellow-50 border-b-2 border-b-yellow-50"
              : "text-richblack-400 hover:text-richblack-200"
          }`}
        >
          All Exams ({exams.length})
        </button>
        <button
          onClick={() => setFilter("not-taken")}
          className={`pb-2.5 whitespace-nowrap transition-all ${
            filter === "not-taken"
              ? "text-yellow-50 border-b-2 border-b-yellow-50"
              : "text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Not Taken ({exams.filter((e) => !e.submission).length})
        </button>
        <button
          onClick={() => setFilter("pending-grading")}
          className={`pb-2.5 whitespace-nowrap transition-all ${
            filter === "pending-grading"
              ? "text-yellow-50 border-b-2 border-b-yellow-50"
              : "text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Pending Grading ({exams.filter((e) => e.submission?.status === "PENDING").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`pb-2.5 whitespace-nowrap transition-all ${
            filter === "completed"
              ? "text-yellow-50 border-b-2 border-b-yellow-50"
              : "text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Completed/Graded ({exams.filter((e) => e.submission && e.submission?.status !== "PENDING").length})
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-richblack-300">Loading exams list...</div>
      ) : exams.length === 0 ? (
        <div className="rounded-md border border-richblack-700 bg-richblack-800 p-8 text-center text-richblack-400">
          You are not enrolled in any courses with exams, or no exams have been created yet.
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-md border border-richblack-700 bg-richblack-800 p-8 text-center text-richblack-400">
          No exams match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((exam) => {
            const hasSubmitted = !!exam.submission
            const submission = exam.submission
            const isPassed = submission?.status === "PASSED"
            const isPending = submission?.status === "PENDING"

            return (
              <div
                key={exam.id}
                className="rounded-lg border border-richblack-700 bg-richblack-800 p-5 flex flex-col justify-between hover:border-yellow-50/50 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-yellow-50 bg-yellow-500/10 px-2 py-0.5 rounded">
                      {exam.examType}
                    </span>
                    <span className="text-xs text-richblack-400 font-medium">
                      {exam.level}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-richblack-5">{exam.title}</h3>
                  <p className="text-xs text-yellow-50 mt-1 font-semibold">Course: {exam.courseName}</p>
                  {exam.description && (
                    <p className="text-xs text-richblack-300 mt-2 line-clamp-2 italic">
                      "{exam.description}"
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-richblack-700 pt-4 flex items-center justify-between gap-4">
                  <div className="text-xs text-richblack-300">
                    Total Marks: <strong className="text-white">{exam.totalMarks}</strong>
                  </div>

                  <div>
                    {hasSubmitted ? (
                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <button
                            onClick={() => setActiveExam(exam)}
                            className="text-xs font-semibold text-yellow-50 bg-yellow-500/10 px-3 py-1.5 rounded hover:bg-yellow-500/20 transition-all"
                          >
                            Pending Grading
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveExam(exam)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1 transition-all ${
                              isPassed
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
                            }`}
                          >
                            <FiCheckCircle />
                            Result: {submission.obtainedMarks}/{exam.totalMarks}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveExam(exam)}
                        className="rounded-md bg-yellow-50 py-1.5 px-4 text-xs font-semibold text-richblack-900 hover:scale-95 transition-all inline-flex items-center gap-1"
                      >
                        <FiEdit3 size={13} /> Take Exam
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Exam Player Overlay Modal */}
      {activeExam && (
        <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center bg-white bg-opacity-10 backdrop-blur-sm overflow-y-auto py-10">
          <div className="w-11/12 max-w-[750px] rounded-lg border border-richblack-700 bg-richblack-800 p-6 relative">
            <button
              onClick={handleClosePlayer}
              className="absolute top-4 right-4 text-richblack-200 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
            <div className="mt-4">
              {/* Reuse the StudentExamPlayer by scoping to specific targets */}
              {activeExam.level === "Course Final" ? (
                <StudentExamPlayer courseId={activeExam.courseId} />
              ) : activeExam.level.startsWith("Section:") ? (
                <StudentExamPlayer sectionId={activeExam.sectionId} />
              ) : (
                <StudentExamPlayer subSectionId={activeExam.subSectionId} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
