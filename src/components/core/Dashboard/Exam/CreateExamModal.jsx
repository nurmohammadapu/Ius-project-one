import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useSelector } from "react-redux"
import { FiPlus, FiTrash2, FiX } from "react-icons/fi"
import { createExam } from "../../../../services/operations/examAPI"
import IconBtn from "../../../Common/IconBtn"

export default function CreateExamModal({
  courseId = null,
  sectionId = null,
  subSectionId = null,
  onClose,
  onSuccess,
}) {
  const { token } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      examType: "MCQ",
      totalMarks: 100,
      questions: [
        {
          questionText: "",
          options: ["", "", "", ""],
          correctOption: "0",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  })

  const examType = watch("examType")

  const onSubmit = async (data) => {
    setLoading(true)

    // Build the request body
    const examData = {
      title: data.title,
      description: data.description,
      examType: data.examType,
      totalMarks: parseFloat(data.totalMarks),
      courseId,
      sectionId,
      subSectionId,
    }

    if (data.examType === "MCQ") {
      examData.questions = data.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options.filter((opt) => opt.trim() !== ""),
        correctOption: q.correctOption,
      }))
    }

    const result = await createExam(examData, token)
    setLoading(false)
    if (result) {
      if (onSuccess) onSuccess(result)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="my-8 w-11/12 max-w-[700px] rounded-lg border border-richblack-700 bg-richblack-800 p-6 font-inter">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-4">
          <h2 className="text-2xl font-semibold text-richblack-5">Create New Exam</h2>
          <button
            onClick={onClose}
            className="text-richblack-200 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* General details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-richblack-5" htmlFor="title">
                Exam Title <sup className="text-pink-200">*</sup>
              </label>
              <input
                id="title"
                placeholder="Enter Exam Title"
                {...register("title", { required: true })}
                className="w-full rounded-[0.5rem] bg-richblack-700 p-[12px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50"
              />
              {errors.title && (
                <span className="text-xs text-pink-200">Title is required</span>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm text-richblack-5" htmlFor="totalMarks">
                Total Marks <sup className="text-pink-200">*</sup>
              </label>
              <input
                id="totalMarks"
                type="number"
                placeholder="Enter Total Marks"
                {...register("totalMarks", { required: true, min: 1 })}
                className="w-full rounded-[0.5rem] bg-richblack-700 p-[12px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50"
              />
              {errors.totalMarks && (
                <span className="text-xs text-pink-200">
                  Valid marks are required (min: 1)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="description">
              Description / Instructions
            </label>
            <textarea
              id="description"
              placeholder="Enter exam description, guidelines, or written requirements..."
              rows={3}
              {...register("description")}
              className="w-full rounded-[0.5rem] bg-richblack-700 p-[12px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50 resize-none"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="examType">
              Exam Type <sup className="text-pink-200">*</sup>
            </label>
            <select
              id="examType"
              {...register("examType", { required: true })}
              className="w-full rounded-[0.5rem] bg-richblack-700 p-[12px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50"
            >
              <option value="MCQ">MCQ (Multiple Choice Questions - Auto Grading)</option>
              <option value="WRITTEN">WRITTEN (Assignment upload - Manual Grading)</option>
            </select>
          </div>

          {/* Target Scoping Info Badge */}
          <div className="rounded-md bg-richblack-900 p-3 text-xs text-richblack-300 flex flex-col gap-1 border border-richblack-700">
            <span className="font-semibold text-yellow-50">Exam Scoping:</span>
            {subSectionId ? (
              <span>Linked to SubSection Video level (ID: {subSectionId})</span>
            ) : sectionId ? (
              <span>Linked to Section/Module level (ID: {sectionId})</span>
            ) : courseId ? (
              <span>Linked to Final Course level (ID: {courseId})</span>
            ) : (
              <span className="text-pink-200">Warning: No target scope provided.</span>
            )}
          </div>

          {/* MCQ Dynamic Questions Form */}
          {examType === "MCQ" && (
            <div className="space-y-6 border-t border-richblack-700 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-richblack-5">Questions</h3>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      questionText: "",
                      options: ["", "", "", ""],
                      correctOption: "0",
                    })
                  }
                  className="flex items-center gap-1 text-sm text-yellow-50 font-medium hover:underline"
                >
                  <FiPlus /> Add Question
                </button>
              </div>

              {fields.map((field, qIndex) => (
                <div
                  key={field.id}
                  className="rounded-md border border-richblack-700 bg-richblack-900 p-4 space-y-4 relative"
                >
                  {/* Delete question button */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(qIndex)}
                      className="absolute top-4 right-4 text-pink-200 hover:text-pink-100 transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}

                  <div className="flex flex-col space-y-2 pr-8">
                    <label className="text-xs font-semibold text-richblack-200">
                      Question {qIndex + 1}
                    </label>
                    <input
                      placeholder="e.g. What does SQL stand for?"
                      {...register(`questions.${qIndex}.questionText`, {
                        required: true,
                      })}
                      className="w-full rounded-[0.5rem] bg-richblack-700 p-[10px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50 text-sm"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((optIndex) => (
                      <div key={optIndex} className="flex flex-col space-y-1">
                        <label className="text-xs text-richblack-300">
                          Option {optIndex + 1}
                        </label>
                        <input
                          placeholder={`Option ${optIndex + 1}`}
                          {...register(`questions.${qIndex}.options.${optIndex}`, {
                            required: true,
                          })}
                          className="w-full rounded-[0.5rem] bg-richblack-700 p-[8px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50 text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct option selector */}
                  <div className="flex flex-col space-y-2 md:w-1/2">
                    <label className="text-xs text-richblack-200 font-medium">
                      Correct Answer Option
                    </label>
                    <select
                      {...register(`questions.${qIndex}.correctOption`, {
                        required: true,
                      })}
                      className="rounded-[0.5rem] bg-richblack-700 p-[8px] text-richblack-5 outline-none border-b border-richblack-600 focus:border-yellow-50 text-sm"
                    >
                      <option value="0">Option 1</option>
                      <option value="1">Option 2</option>
                      <option value="2">Option 3</option>
                      <option value="3">Option 4</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-x-3 border-t border-richblack-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-md bg-richblack-700 py-[8px] px-[20px] font-semibold text-richblack-50 hover:scale-95 transition-all duration-200"
            >
              Cancel
            </button>
            <IconBtn
              type="submit"
              disabled={loading}
              text={loading ? "Saving..." : "Create Exam"}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
