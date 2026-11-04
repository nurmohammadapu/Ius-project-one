import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { FiAward, FiBookOpen, FiEdit3, FiX, FiCheckCircle } from "react-icons/fi"
import { getStudentExams } from "../../../../services/operations/examAPI"
import StudentExamPlayer from "../../../core/ViewCourse/StudentExamPlayer"
import LeaderboardModal from "./LeaderboardModal"

export default function StudentExamsList() {
  const { token } = useSelector((state) => state.auth)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeExam, setActiveExam] = useState(null)
  const [leaderboardExam, setLeaderboardExam] = useState(null)
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
          className={`pb-2 px-1 border-b-2 transition-all ${
            filter === "all"
              ? "border-yellow-50 text-yellow-50"
              : "border-transparent text-richblack-400 hover:text-richblack-200"
          }`}
        >
          All Exams ({exams.length})
        </button>
        <button
          onClick={() => setFilter("not-taken")}
          className={`pb-2 px-1 border-b-2 transition-all ${
            filter === "not-taken"
              ? "border-yellow-50 text-yellow-50"
              : "border-transparent text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Not Taken ({exams.filter((e) => !e.submission).length})
        </button>
        <button
          onClick={() => setFilter("pending-grading")}
          className={`pb-2 px-1 border-b-2 transition-all ${
            filter === "pending-grading"
              ? "border-yellow-50 text-yellow-50"
              : "border-transparent text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Pending Grading ({exams.filter((e) => e.submission?.status === "PENDING").length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`pb-2 px-1 border-b-2 transition-all ${
            filter === "completed"
              ? "border-yellow-50 text-yellow-50"
              : "border-transparent text-richblack-400 hover:text-richblack-200"
          }`}
        >
          Completed ({exams.filter((e) => e.submission && e.submission?.status !== "PENDING").length})
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center text-richblack-300">
          <div className="spinner">Loading your exams...</div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-md border border-dashed border-richblack-700 p-8 text-center bg-richblack-800/40 my-6">
          <FiBookOpen className="text-4xl text-richblack-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-richblack-300">No exams match this filter</h3>
          <p className="text-xs text-richblack-400 mt-1">
            Check other tabs or ask your instructor to publish quizzes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredExams.map((exam) => {
            const submission = exam.submission
            const hasSubmitted = !!submission
            const isPending = submission?.status === "PENDING"
            const isPassed = submission?.status === "PASSED"

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

                <div className="mt-6 border-t border-richblack-700 pt-4 flex items-center justify-between gap-2">
                  <div className="text-xs text-richblack-300">
                    Total Marks: <strong className="text-white">{exam.totalMarks}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLeaderboardExam(exam)}
                      className="rounded-md border border-richblack-600 bg-richblack-700/80 py-1.5 px-2.5 text-xs font-semibold text-yellow-50 hover:bg-richblack-600 transition-all inline-flex items-center gap-1"
                      title="View Exam Leaderboard"
                    >
                      <FiAward size={13} /> Leaderboard
                    </button>

                    {hasSubmitted ? (
                      <div className="flex items-center">
                        {isPending ? (
                          <button
                            onClick={() => setActiveExam(exam)}
                            className="text-xs font-semibold text-yellow-50 bg-yellow-500/10 px-3 py-1.5 rounded hover:bg-yellow-500/20 transition-all"
                          >
                            Pending
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
                            {submission.obtainedMarks}/{exam.totalMarks}
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveExam(exam)}
                        className="rounded-md bg-yellow-50 py-1.5 px-3.5 text-xs font-semibold text-richblack-900 hover:scale-95 transition-all inline-flex items-center gap-1"
                      >
                        <FiEdit3 size={13} /> Take
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
          <div className="w-11/12 max-w-[850px] relative">
            <button
              onClick={handleClosePlayer}
              className="absolute -top-4 -right-4 z-50 bg-richblack-800 p-2 rounded-full border border-richblack-600 text-richblack-200 hover:text-white hover:scale-105 transition-all"
            >
              <FiX className="text-xl" />
            </button>
            <StudentExamPlayer
              courseId={activeExam.courseId}
              sectionId={activeExam.sectionId}
              subSectionId={activeExam.subSectionId}
            />
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {leaderboardExam && (
        <LeaderboardModal
          examId={leaderboardExam.id}
          examTitle={leaderboardExam.title}
          onClose={() => setLeaderboardExam(null)}
        />
      )}
    </div>
  )
}
