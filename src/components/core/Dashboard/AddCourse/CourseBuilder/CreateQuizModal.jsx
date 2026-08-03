import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { RxCross2 } from "react-icons/rx"
import { useSelector } from "react-redux"
import IconBtn from "../../../../Common/IconBtn"

export default function CreateQuizModal({ modalData, setModalData }) {
  // modalData contains: { quizType: 'SUBSECTION'|'SECTION'|'COURSE_FINAL', id: string, titleLabel: string }
  const { token } = useSelector((state) => state.auth)
  const { course } = useSelector((state) => state.course)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [existingQuiz, setExistingQuiz] = useState(null)
  const [isPublished, setIsPublished] = useState(false)
  const [submissionType, setSubmissionType] = useState("MCQ")
  const [questions, setQuestions] = useState([
    { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "optionA", marks: 1 },
  ])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchExistingQuiz()
  }, [])

  const fetchExistingQuiz = async () => {
    setFetching(true)
    try {
      const response = await fetch(
        `http://localhost:5001/api/v1/course/quiz/get/${modalData.quizType}/${modalData.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const res = await response.json()
      if (res.success && res.hasQuiz && res.quiz) {
        const q = res.quiz
        setExistingQuiz(q)
        setValue("title", q.title)
        setValue("description", q.description || "")
        setValue("totalMarks", q.totalMarks)
        setValue("passMarks", q.passMarks)
        setValue("timeLimitMinutes", q.timeLimitMinutes)
        if (q.dueDate) setValue("dueDate", new Date(q.dueDate).toISOString().slice(0, 16))
        if (q.publishDate) setValue("publishDate", new Date(q.publishDate).toISOString().slice(0, 16))
        setSubmissionType(q.submissionType)

        if (q.questions && q.questions.length > 0) {
          setQuestions(q.questions)
        }

        const now = new Date()
        const published = q.isPublished || (q.publishDate && now >= new Date(q.publishDate))
        setIsPublished(published)
      }
    } catch (err) {
      console.error(err)
    }
    setFetching(false)
  }

  const handleAddQuestion = () => {
    if (isPublished) return
    setQuestions([
      ...questions,
      { questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "optionA", marks: 1 },
    ])
  }

  const handleQuestionChange = (index, field, value) => {
    if (isPublished) return
    const updated = [...questions]
    updated[index][field] = value
    setQuestions(updated)
  }

  const handleRemoveQuestion = (index) => {
    if (isPublished) return
    if (questions.length === 1) {
      toast.error("At least one question is required for MCQ")
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (isPublished) {
      toast.error("Published exams cannot be edited. View mode only.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      if (existingQuiz?.id) {
        formData.append("quizId", existingQuiz.id)
      }
      formData.append("title", data.title)
      formData.append("description", data.description || "")
      formData.append("quizType", modalData.quizType)
      formData.append("submissionType", submissionType)
      formData.append("totalMarks", data.totalMarks || 10)
      formData.append("passMarks", data.passMarks || 5)
      formData.append("timeLimitMinutes", data.timeLimitMinutes || 10)
      if (data.dueDate) formData.append("dueDate", data.dueDate)
      if (data.publishDate) formData.append("publishDate", data.publishDate)

      if (modalData.quizType === "SUBSECTION") {
        formData.append("subSectionId", modalData.id)
      } else if (modalData.quizType === "SECTION") {
        formData.append("sectionId", modalData.id)
      } else {
        formData.append("courseId", course?.id || course?._id)
      }

      if (submissionType === "MCQ" || submissionType === "BOTH") {
        formData.append("questions", JSON.stringify(questions))
      }

      if (data.questionFile && data.questionFile[0]) {
        formData.append("questionFile", data.questionFile[0])
      }

      const response = await fetch("http://localhost:5001/api/v1/course/quiz/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        toast.success("Exam saved successfully!")
        setModalData(null)
      } else {
        toast.error(result.message || "Failed to save Exam")
      }
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong saving exam")
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="my-10 w-11/12 max-w-[750px] rounded-lg border border-richblack-500 bg-richblack-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-3">
          <div>
            <p className="text-xl font-semibold text-richblack-5">
              {isPublished ? "View Exam (Read-Only)" : existingQuiz ? "Edit Exam Draft" : "Create Exam / Assignment"} ({modalData?.titleLabel})
            </p>
            {isPublished && (
              <p className="text-xs text-yellow-50 font-medium mt-0.5">
                🔒 Exam is Published. Editing is disabled to preserve student grades.
              </p>
            )}
          </div>
          <button onClick={() => setModalData(null)}>
            <RxCross2 className="text-2xl text-richblack-5" />
          </button>
        </div>

        {fetching ? (
          <div className="py-10 text-center text-richblack-200">Loading Exam Details...</div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm text-richblack-5">Exam / Assignment Title *</label>
              <input
                disabled={isPublished}
                placeholder="Enter Title (e.g. Midterm Quiz, Assignment 1)"
                {...register("title", { required: true })}
                className="form-style w-full mt-1"
              />
              {errors.title && <span className="text-xs text-pink-200">Title is required</span>}
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-richblack-5">Description / Instructions</label>
              <textarea
                disabled={isPublished}
                rows={2}
                placeholder="Enter details or instructions for students..."
                {...register("description")}
                className="form-style w-full mt-1"
              />
            </div>

            {/* Submission Mode & Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-richblack-5">Submission Type *</label>
                <select
                  disabled={isPublished}
                  value={submissionType}
                  onChange={(e) => setSubmissionType(e.target.value)}
                  className="form-style w-full mt-1"
                >
                  <option value="MCQ">MCQ Quiz (Auto-Graded)</option>
                  <option value="FILE_UPLOAD">Assignment / PDF Upload (Manual)</option>
                  <option value="BOTH">Both (MCQ + Written File)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-richblack-5">Time Limit (Minutes)</label>
                <input
                  disabled={isPublished}
                  type="number"
                  placeholder="10"
                  defaultValue={10}
                  {...register("timeLimitMinutes")}
                  className="form-style w-full mt-1"
                />
              </div>
            </div>

            {/* Schedule Publish & Deadline Dates */}
            <div className="grid grid-cols-2 gap-4 rounded-md border border-richblack-700 bg-richblack-900 p-3">
              <div>
                <label className="text-sm text-yellow-50 font-medium">📅 Schedule Publish Time</label>
                <p className="text-[11px] text-richblack-300 mb-1">Set date/time when exam becomes visible to students.</p>
                <input
                  disabled={isPublished}
                  type="datetime-local"
                  {...register("publishDate")}
                  className="form-style w-full text-xs"
                />
              </div>
              <div>
                <label className="text-sm text-pink-200 font-medium">⏱️ Exam Deadline (Due Date)</label>
                <p className="text-[11px] text-richblack-300 mb-1">After this time, submissions will be closed.</p>
                <input
                  disabled={isPublished}
                  type="datetime-local"
                  {...register("dueDate")}
                  className="form-style w-full text-xs"
                />
              </div>
            </div>

            {/* Marks & Pass Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-richblack-5">Total Marks</label>
                <input
                  disabled={isPublished}
                  type="number"
                  defaultValue={10}
                  {...register("totalMarks")}
                  className="form-style w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-richblack-5">Pass Marks</label>
                <input
                  disabled={isPublished}
                  type="number"
                  defaultValue={5}
                  {...register("passMarks")}
                  className="form-style w-full mt-1"
                />
              </div>
            </div>

            {/* Question PDF File Upload */}
            {(submissionType === "FILE_UPLOAD" || submissionType === "BOTH") && (
              <div>
                <label className="text-sm text-richblack-5">Question / Assignment File (PDF/Image)</label>
                <input
                  disabled={isPublished}
                  type="file"
                  accept=".pdf,image/*"
                  {...register("questionFile")}
                  className="form-style w-full mt-1 text-sm"
                />
                {existingQuiz?.questionFileUrl && (
                  <p className="text-xs text-yellow-50 mt-1">
                    Current Question File: <a href={existingQuiz.questionFileUrl} target="_blank" rel="noreferrer" className="underline">View PDF</a>
                  </p>
                )}
              </div>
            )}

            {/* MCQ Builder */}
            {(submissionType === "MCQ" || submissionType === "BOTH") && (
              <div className="space-y-4 border-t border-richblack-700 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-richblack-5">MCQ Questions</p>
                  {!isPublished && (
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="rounded-md bg-yellow-50 px-3 py-1 text-xs font-semibold text-black"
                    >
                      + Add Question
                    </button>
                  )}
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="rounded-md border border-richblack-600 bg-richblack-700 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-yellow-50">Question {idx + 1}</p>
                      {!isPublished && questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-xs text-pink-200 underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      disabled={isPublished}
                      placeholder="Enter question statement"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(idx, "questionText", e.target.value)}
                      className="form-style w-full text-sm"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        disabled={isPublished}
                        placeholder="Option A"
                        value={q.optionA}
                        onChange={(e) => handleQuestionChange(idx, "optionA", e.target.value)}
                        className="form-style w-full"
                      />
                      <input
                        disabled={isPublished}
                        placeholder="Option B"
                        value={q.optionB}
                        onChange={(e) => handleQuestionChange(idx, "optionB", e.target.value)}
                        className="form-style w-full"
                      />
                      <input
                        disabled={isPublished}
                        placeholder="Option C"
                        value={q.optionC}
                        onChange={(e) => handleQuestionChange(idx, "optionC", e.target.value)}
                        className="form-style w-full"
                      />
                      <input
                        disabled={isPublished}
                        placeholder="Option D"
                        value={q.optionD}
                        onChange={(e) => handleQuestionChange(idx, "optionD", e.target.value)}
                        className="form-style w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-x-2">
                        <label className="text-richblack-200">Correct Answer:</label>
                        <select
                          disabled={isPublished}
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(idx, "correctAnswer", e.target.value)}
                          className="form-style text-xs"
                        >
                          <option value="optionA">Option A</option>
                          <option value="optionB">Option B</option>
                          <option value="optionC">Option C</option>
                          <option value="optionD">Option D</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-x-2">
                        <label className="text-richblack-200">Marks:</label>
                        <input
                          disabled={isPublished}
                          type="number"
                          defaultValue={1}
                          value={q.marks}
                          onChange={(e) => handleQuestionChange(idx, "marks", e.target.value)}
                          className="form-style w-16 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end gap-x-3 pt-4 border-t border-richblack-700">
              <button
                type="button"
                onClick={() => setModalData(null)}
                className="rounded-md bg-richblack-700 px-4 py-2 text-sm font-semibold text-richblack-5"
              >
                Close
              </button>
              {!isPublished && (
                <IconBtn disabled={loading} text={loading ? "Saving..." : existingQuiz ? "Update Exam" : "Save Exam"} type="submit" />
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
