import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { IoAddCircleOutline } from "react-icons/io5"
import { MdNavigateNext } from "react-icons/md"
import { useDispatch, useSelector } from "react-redux"

import {
  createSection,
  updateSection,
  getFullDetailsOfCourse,
} from "../../../../../services/operations/courseDetailsAPI"
import { setCourse, setEditCourse, setStep } from "../../../../../redux/Slices/courseSlice"
import IconBtn from "../../../../Common/IconBtn"
import NestedView from "./NestedView"
import CreateExamModal from "../../Exam/CreateExamModal"

export default function CourseBuilderForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  const { course } = useSelector((state) => state.course)
  const { token } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [editSectionName, setEditSectionName] = useState(null)
  const [createCourseExam, setCreateCourseExam] = useState(false)
  const dispatch = useDispatch()

  // handle form submission
  const onSubmit = async (data) => {
    // console.log(data)
    setLoading(true)

    let result

    if (editSectionName) {
      result = await updateSection(
        {
          sectionName: data.sectionName,
          sectionId: editSectionName,
          courseId: course?.id || course?._id,
        },
        token
      )
      // console.log("edit", result)
    } else {
      result = await createSection(
        {
          sectionName: data.sectionName,
          courseId: course?.id || course?._id,
        },
        token
      )
    }
    if (result) {
      // console.log("section result", result)
      dispatch(setCourse(result))
      setEditSectionName(null)
      setValue("sectionName", "")
    }
    setLoading(false)
  }

  const cancelEdit = () => {
    setEditSectionName(null)
    setValue("sectionName", "")
  }

  const handleChangeEditSectionName = (sectionId, sectionName) => {
    if (editSectionName === sectionId) {
      cancelEdit()
      return
    }
    setEditSectionName(sectionId)
    setValue("sectionName", sectionName)
  }

  const goToNext = () => {
    if (!course?.courseContent || course.courseContent.length === 0) {
      toast.error("Please add atleast one section")
      return
    }
    if (
      course?.courseContent?.some((section) => !section?.subSection || section.subSection.length === 0)
    ) {
      toast.error("Please add atleast one lecture in each section")
      return
    }
    dispatch(setStep(3))
  }

  const goBack = () => { 
    dispatch(setStep(1))
    dispatch(setEditCourse(true))
  }

  return (
    <div className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-2xl font-semibold text-richblack-5">Course Builder</p>
        <button
          type="button"
          onClick={() => setCreateCourseExam(true)}
          className="flex items-center gap-x-1 text-xs text-yellow-50 border border-yellow-50/20 px-3 py-1.5 rounded bg-yellow-50/5 hover:bg-yellow-50/15 transition-all font-semibold"
        >
          <IoAddCircleOutline size={16} /> Add Final Course Exam
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="sectionName">
            Section Name <sup className="text-pink-200">*</sup>
          </label>
          <input
            id="sectionName"
            disabled={loading}
            placeholder="Add a section to build your course"
            {...register("sectionName", { required: true })}
            className="form-style w-full"
          />
          {errors.sectionName && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              Section name is required
            </span>
          )}
        </div>
        <div className="flex items-end gap-x-4">
          <IconBtn
            type="submit"
            disabled={loading}
            text={editSectionName ? "Edit Section Name" : "Create Section"}
            outline={true}
          >
            <IoAddCircleOutline size={20} className="text-yellow-50" />
          </IconBtn>
          {editSectionName && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-richblack-300 underline"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
      {course?.courseContent && course.courseContent.length > 0 && (
        <NestedView handleChangeEditSectionName={handleChangeEditSectionName} />
      )}

      {/* Render Final Course Exam if exists */}
      {course.exams && course.exams.length > 0 && (
        <div className="rounded-md border border-yellow-50/20 bg-richblack-900 p-5 font-inter text-sm text-richblack-100 space-y-3">
          <div className="flex items-center justify-between border-b border-richblack-800 pb-2">
            <h3 className="font-bold text-yellow-50 flex items-center gap-1.5">
              🏆 Final Course Exam: {course.exams[0].title} ({course.exams[0].examType})
            </h3>
            <span className="text-xs text-richblack-400">Total Marks: {course.exams[0].totalMarks}</span>
          </div>
          {course.exams[0].description && <p className="text-xs text-richblack-300 italic">"{course.exams[0].description}"</p>}
          {course.exams[0].questions && course.exams[0].questions.length > 0 && (
            <div className="space-y-1.5 pl-3 border-l-2 border-richblack-700 mt-3">
              <p className="text-xs font-semibold text-richblack-200">Exam Questions ({course.exams[0].questions.length}):</p>
              {course.exams[0].questions.map((q, qidx) => (
                <p key={q.id} className="text-xs text-richblack-400">
                  {qidx + 1}. {q.questionText}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Next Prev Button */}
      <div className="flex justify-end gap-x-3">
        <button
          onClick={goBack}
          className={`flex cursor-pointer items-center gap-x-2 rounded-md bg-richblack-300 py-[8px] px-[20px] font-semibold text-richblack-900`}
        >
          Back
        </button>
        <IconBtn disabled={loading} text="Next" onclick={goToNext}>
          <MdNavigateNext />
        </IconBtn>
      </div>

      {createCourseExam && (
        <CreateExamModal
          courseId={course?.id || course?._id}
          onClose={() => setCreateCourseExam(false)}
          onSuccess={async () => {
            toast.success("Final Course Exam added successfully!")
            const result = await getFullDetailsOfCourse(course?.id || course?._id, token)
            if (result && result.courseDetails) {
              dispatch(setCourse(result.courseDetails))
            } else if (result) {
              dispatch(setCourse(result))
            }
          }}
        />
      )}
    </div>
  )
}
