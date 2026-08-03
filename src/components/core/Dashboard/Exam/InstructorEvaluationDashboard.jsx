import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { FiEye, FiCheck, FiX, FiFileText, FiAward, FiEdit2 } from "react-icons/fi"
import { getSubmissionsByExam, gradeSubmission } from "../../../../services/operations/examAPI"
import { fetchInstructorCourses } from "../../../../services/operations/courseDetailsAPI"
import IconBtn from "../../../Common/IconBtn"

export default function InstructorEvaluationDashboard({ examId: initialExamId = null }) {
  const { token } = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [exams, setExams] = useState([])
  const [selectedExamId, setSelectedExamId] = useState(initialExamId || "")
  const [selectedExam, setSelectedExam] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [obtainedMarks, setObtainedMarks] = useState("")
  const [feedback, setFeedback] = useState("")
  const [gradeStatus, setGradeStatus] = useState("PASSED")
  const [saveLoading, setSaveLoading] = useState(false)

  // Fetch instructor's courses on mount if no specific examId is provided
  useEffect(() => {
    if (!initialExamId) {
      const fetchCourses = async () => {
        setLoading(true)
        const result = await fetchInstructorCourses(token)
        if (result) {
          setCourses(result)
        }
        setLoading(false)
      }
      fetchCourses()
    }
  }, [initialExamId, token])

  // Extract all exams from selected course
  useEffect(() => {
    if (selectedCourse && courses.length > 0) {
      const course = courses.find((c) => c.id === selectedCourse)
      if (course) {
        // Collect exams from Course itself, Section and SubSections
        const collectedExams = []
        
        // Course level exams
        if (course.exams) {
          collectedExams.push(
            ...course.exams
              .filter((e) => !e.sectionId && !e.subSectionId)
              .map((e) => ({ ...e, level: "Course Final" }))
          )
        }

        // Section level exams
        course.courseContent?.forEach((section) => {
          if (section.exams) {
            collectedExams.push(
              ...section.exams
                .filter((e) => e.sectionId && !e.subSectionId)
                .map((e) => ({ ...e, level: `Section: ${section.sectionName}` }))
            )
          }
          
          // SubSection level exams
          section.subSection?.forEach((sub) => {
            if (sub.exams) {
              collectedExams.push(
                ...sub.exams
                  .filter((e) => e.subSectionId)
                  .map((e) => ({ ...e, level: `Lecture: ${sub.title}` }))
              )
            }
          })
        })

        setExams(collectedExams)
        // Reset selected exam
        if (collectedExams.length > 0) {
          setSelectedExamId(collectedExams[0].id)
        } else {
          setSelectedExamId("")
          setSubmissions([])
        }
      }
    }
  }, [selectedCourse, courses])

  // Fetch submissions when selectedExamId changes
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedExamId) {
        setSubmissions([])
        setSelectedExam(null)
        return
      }

      setLoading(true)
      const result = await getSubmissionsByExam(selectedExamId, token)
      setSubmissions(result)
      
      // If we don't have exams populated (e.g. initialExamId passed directly), find the exam info from first submission
      if (result && result.length > 0) {
        setSelectedExam(result[0].exam)
      } else if (exams.length > 0) {
        setSelectedExam(exams.find((e) => e.id === selectedExamId))
      }
      setLoading(false)
    }
    fetchSubmissions()
  }, [selectedExamId, exams, token])

  const handleOpenGrading = (submission) => {
    setGradingSubmission(submission)
    setObtainedMarks(submission.obtainedMarks !== null ? submission.obtainedMarks : "")
    setFeedback(submission.feedback || "")
    setGradeStatus(submission.status === "PENDING" ? "PASSED" : submission.status)
  }

  const handleSaveGrade = async (e) => {
    e.preventDefault()
    if (!gradingSubmission) return

    const parsedMarks = parseFloat(obtainedMarks)
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > selectedExam.totalMarks) {
      alert(`Please enter valid marks between 0 and ${selectedExam.totalMarks}.`)
      return
    }

    setSaveLoading(true)
    const result = await gradeSubmission(
      {
        submissionId: gradingSubmission.id,
        obtainedMarks: parsedMarks,
        feedback,
        status: gradeStatus,
      },
      token
    )
    setSaveLoading(false)

    if (result) {
      // Update local submission in state list
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === gradingSubmission.id ? { ...sub, ...result } : sub))
      )
      setGradingSubmission(null)
    }
  }

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10 font-inter text-white">
      <h1 className="mb-8 text-3xl font-medium text-richblack-5">Instructor Evaluation Dashboard</h1>

      {/* Select Course and Exam (Only if no initialExamId is passed) */}
      {!initialExamId && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-richblack-700 bg-richblack-800 p-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-300" htmlFor="course-select">
              Select Course
            </label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-[0.5rem] bg-richblack-700 p-3 text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-50"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-300" htmlFor="exam-select">
              Select Exam
            </label>
            <select
              id="exam-select"
              value={selectedExamId}
              disabled={!selectedCourse || exams.length === 0}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full rounded-[0.5rem] bg-richblack-700 p-3 text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-50"
            >
              {exams.length === 0 ? (
                <option value="">No exams available in this course</option>
              ) : (
                exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({e.examType}) [{e.level}]
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      )}

      {/* List of exams under selected course */}
      {selectedCourse && (
        <div className="mb-6 rounded-md border border-richblack-700 bg-richblack-800 p-6 space-y-4">
          <h2 className="text-xl font-bold text-yellow-50">Exams in Selected Course</h2>
          {exams.length === 0 ? (
            <p className="text-sm text-richblack-400">No exams have been created for this course yet.</p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => {
                const isSelected = selectedExamId === exam.id;
                return (
                  <div key={exam.id} className="rounded-md border border-richblack-600 bg-richblack-900 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-lg">{exam.title}</h3>
                          <span className="text-xs bg-yellow-500/10 text-yellow-50 px-2 py-0.5 rounded border border-yellow-50/20">
                            {exam.examType}
                          </span>
                          <span className="text-xs text-richblack-400">({exam.level})</span>
                        </div>
                        {exam.description && <p className="text-xs text-richblack-300 mt-1 italic">"{exam.description}"</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const div = document.getElementById(`qlist-${exam.id}`);
                            if (div) div.classList.toggle('hidden');
                          }}
                          className="text-xs text-richblack-300 border border-richblack-700 px-3 py-1.5 rounded bg-richblack-800 hover:text-white"
                        >
                          View/Hide Questions
                        </button>
                        <button
                          onClick={() => setSelectedExamId(exam.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded transition-all ${
                            isSelected
                              ? "bg-yellow-50 text-richblack-900"
                              : "bg-richblack-800 text-richblack-100 hover:bg-richblack-700"
                          }`}
                        >
                          {isSelected ? "Viewing Submissions" : "View Submissions"}
                        </button>
                      </div>
                    </div>

                    {/* Questions dropdown */}
                    <div id={`qlist-${exam.id}`} className="mt-4 border-t border-richblack-700 pt-3 space-y-2 hidden">
                      <p className="text-xs font-semibold text-richblack-200">
                        Questions ({exam.questions?.length || 0}):
                      </p>
                      {(!exam.questions || exam.questions.length === 0) ? (
                        <p className="text-xs text-richblack-500 italic">No questions added. (For written exams, questions are in the description or uploaded files).</p>
                      ) : (
                        <div className="space-y-3 pl-3">
                          {exam.questions.map((q, idx) => (
                            <div key={q.id} className="text-xs text-richblack-300 border-l border-richblack-700 pl-3 py-1">
                              <p className="font-semibold text-white">Q{idx + 1}. {q.questionText}</p>
                              {q.options && q.options.length > 0 && (
                                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-richblack-400">
                                  {q.options.map((opt, oidx) => (
                                    <span key={oidx} className={oidx === parseInt(q.correctOption) ? "text-emerald-400 font-semibold" : ""}>
                                      {String.fromCharCode(65 + oidx)}. {opt} {oidx === parseInt(q.correctOption) && "✓"}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {exam.examType !== "MCQ" && q.correctOption && (
                                <p className="mt-1 text-emerald-400">Correct Answer: {q.correctOption}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submissions list */}
      {selectedExamId ? (
        <div className="rounded-md border border-richblack-700 bg-richblack-800 p-6">
          <div className="flex items-center justify-between border-b border-richblack-700 pb-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-richblack-5">
                {selectedExam?.title || "Exam Submissions"}
              </h2>
              <p className="text-xs text-richblack-400 mt-1">
                Type: {selectedExam?.examType} | Max Marks: {selectedExam?.totalMarks}
              </p>
            </div>
            <span className="text-xs bg-yellow-500/10 text-yellow-50 px-3 py-1 rounded-full font-semibold border border-yellow-50/20">
              {submissions.length} Submissions
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-richblack-300">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="py-10 text-center text-richblack-400">
              No submissions received yet for this exam.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-richblack-700 text-richblack-300 text-sm">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Obtained Marks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-richblack-800 text-sm text-richblack-100">
                  {submissions.map((submission) => {
                    const studentName = `${submission.student.firstName} ${submission.student.lastName}`
                    const isMcq = selectedExam?.examType === "MCQ"

                    return (
                      <tr key={submission.id} className="hover:bg-richblack-900/40 transition-colors">
                        <td className="py-4 px-4 flex items-center gap-3">
                          <img
                            src={
                              submission.student.image ||
                              `https://api.dicebear.com/5.x/initials/svg?seed=${studentName}`
                            }
                            alt={studentName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold text-richblack-5">{studentName}</p>
                            <p className="text-xs text-richblack-400">{submission.student.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 font-semibold text-white">
                          {submission.status === "PENDING"
                            ? "--"
                            : `${submission.obtainedMarks} / ${selectedExam?.totalMarks}`}
                        </td>
                        <td className="py-4 px-4">
                          {submission.status === "PENDING" ? (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-50 font-semibold border border-yellow-50/20">
                              PENDING
                            </span>
                          ) : submission.status === "PASSED" ? (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                              PASSED
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-xs bg-pink-500/10 text-pink-400 font-semibold border border-pink-500/20">
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {isMcq ? (
                            <span className="text-xs text-richblack-400">Auto-graded</span>
                          ) : (
                            <button
                              onClick={() => handleOpenGrading(submission)}
                              className="inline-flex items-center gap-1 text-xs text-yellow-50 border border-yellow-50/30 px-2 py-1 rounded bg-yellow-50/5 hover:bg-yellow-50/15 transition-all duration-200"
                            >
                              <FiEdit2 size={12} /> Grade / Feedback
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-richblack-700 bg-richblack-800 p-8 text-center text-richblack-400">
          Please select a Course and Exam to view submissions.
        </div>
      )}

      {/* Grading Form Modal / Sidebar Panel */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center bg-white bg-opacity-10 backdrop-blur-sm">
          <div className="w-11/12 max-w-[500px] rounded-lg border border-richblack-700 bg-richblack-800 p-6 font-inter text-white">
            <div className="flex items-center justify-between border-b border-richblack-700 pb-4 mb-4">
              <h3 className="text-lg font-bold text-richblack-5">
                Grade Submission: {gradingSubmission.student.firstName} {gradingSubmission.student.lastName}
              </h3>
              <button
                onClick={() => setGradingSubmission(null)}
                className="text-richblack-200 hover:text-white transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Document preview block */}
            <div className="mb-5 p-4 rounded-md bg-richblack-900 border border-richblack-700">
              <h4 className="text-xs font-semibold text-richblack-300 uppercase tracking-wider mb-2">
                Submitted Assignment File:
              </h4>
              <a
                href={gradingSubmission.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-yellow-50 hover:underline inline-flex"
              >
                <FiFileText className="text-lg" /> View Document (PDF/Image)
              </a>

              {/* Basic iframe or image preview for smooth UI */}
              <div className="mt-3 border border-richblack-800 rounded bg-richblack-950 h-32 flex items-center justify-center text-xs text-richblack-400 overflow-hidden">
                {gradingSubmission.submissionUrl.endsWith(".pdf") ? (
                  <span className="flex flex-col items-center gap-1">
                    <FiFileText className="text-xl" /> PDF assignment file
                  </span>
                ) : (
                  <img
                    src={gradingSubmission.submissionUrl}
                    alt="Submission Preview"
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-richblack-300">
                  Obtained Marks (Max: {selectedExam?.totalMarks}) <sup className="text-pink-200">*</sup>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={obtainedMarks}
                  placeholder="e.g. 85.5"
                  onChange={(e) => setObtainedMarks(e.target.value)}
                  required
                  className="w-full rounded-[0.5rem] bg-richblack-700 p-2.5 text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-50 text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs text-richblack-300">Result Status</label>
                <select
                  value={gradeStatus}
                  onChange={(e) => setGradeStatus(e.target.value)}
                  className="w-full rounded-[0.5rem] bg-richblack-700 p-2.5 text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-50 text-sm"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs text-richblack-300">Feedback for Student</label>
                <textarea
                  value={feedback}
                  rows={3}
                  placeholder="Provide correction details or positive notes..."
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full rounded-[0.5rem] bg-richblack-700 p-2.5 text-richblack-5 outline-none border border-richblack-600 focus:border-yellow-50 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-x-3 pt-3 border-t border-richblack-700">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  disabled={saveLoading}
                  className="rounded-md bg-richblack-700 py-1.5 px-4 text-xs font-semibold text-richblack-50 hover:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-md bg-yellow-50 py-1.5 px-4 text-xs font-semibold text-richblack-900 hover:scale-95 transition-all inline-flex items-center gap-1"
                >
                  <FiCheck /> {saveLoading ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
