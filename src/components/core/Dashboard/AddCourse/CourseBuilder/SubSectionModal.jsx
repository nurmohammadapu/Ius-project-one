import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { RxCross2 } from "react-icons/rx"
import { FiPaperclip, FiFileText, FiDownload } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"

import {
  createSubSection,
  updateSubSection,
} from "../../../../../services/operations/courseDetailsAPI"
import { setCourse } from "../../../../../redux/Slices/courseSlice"
import IconBtn from "../../../../Common/IconBtn"
import Upload from "../Upload"

export default function SubSectionModal({
  modalData,
  setModalData,
  add = false,
  view = false,
  edit = false,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    getValues,
  } = useForm()

  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [resourceFile, setResourceFile] = useState(null)
  const { token } = useSelector((state) => state.auth)
  const { course } = useSelector((state) => state.course)

  useEffect(() => {
    if (view || edit) {
      setValue("lectureTitle", modalData.title)
      setValue("lectureDesc", modalData.description)
      setValue("lectureVideo", modalData.videoUrl)
    }
  }, [])

  // detect whether form is updated or not
  const isFormUpdated = () => {
    const currentValues = getValues()
    if (
      currentValues.lectureTitle !== modalData.title ||
      currentValues.lectureDesc !== modalData.description ||
      currentValues.lectureVideo !== modalData.videoUrl ||
      resourceFile !== null
    ) {
      return true
    }
    return false
  }

  // handle the editing of subsection
  const handleEditSubsection = async () => {
    const currentValues = getValues()
    const formData = new FormData()
    formData.append("sectionId", modalData.sectionId)
    formData.append("subSectionId", modalData?.id || modalData?._id)
    if (currentValues.lectureTitle !== modalData.title) {
      formData.append("title", currentValues.lectureTitle)
    }
    if (currentValues.lectureDesc !== modalData.description) {
      formData.append("description", currentValues.lectureDesc)
    }
    if (currentValues.lectureVideo !== modalData.videoUrl) {
      formData.append("video", currentValues.lectureVideo)
    }
    if (resourceFile) {
      formData.append("resource", resourceFile)
      formData.append("resourceName", resourceFile.name)
    }
    setLoading(true)
    const result = await updateSubSection(formData, token)
    if (result) {
      const updatedCourseContent = course.courseContent.map((section) =>
        (section?.id || section?._id) === modalData.sectionId ? result : section
      )
      const updatedCourse = { ...course, courseContent: updatedCourseContent }
      dispatch(setCourse(updatedCourse))
    }
    setModalData(null)
    setLoading(false)
  }

  const onSubmit = async (data) => {
    if (view) return

    if (edit) {
      if (!isFormUpdated()) {
        toast.error("No changes made to the form")
      } else {
        handleEditSubsection()
      }
      return
    }

    const formData = new FormData()
    formData.append("sectionId", modalData)
    formData.append("title", data.lectureTitle)
    formData.append("description", data.lectureDesc)
    formData.append("video", data.lectureVideo)
    if (resourceFile) {
      formData.append("resource", resourceFile)
      formData.append("resourceName", resourceFile.name)
    }
    setLoading(true)
    const result = await createSubSection(formData, token)
    if (result) {
      const updatedCourseContent = course.courseContent.map((section) =>
        (section?.id || section?._id) === modalData ? result : section
      )
      const updatedCourse = { ...course, courseContent: updatedCourseContent }
      dispatch(setCourse(updatedCourse))
    }
    setModalData(null)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid h-screen w-screen place-items-center overflow-auto bg-white bg-opacity-10 backdrop-blur-sm">
      <div className="my-10 w-11/12 max-w-[700px] rounded-lg border border-richblack-400 bg-richblack-800">
        {/* Modal Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-richblack-700 p-5">
          <p className="text-xl font-semibold text-richblack-5">
            {view && "Viewing"} {add && "Adding"} {edit && "Editing"} Lecture
          </p>
          <button onClick={() => (!loading ? setModalData(null) : {})}>
            <RxCross2 className="text-2xl text-richblack-5" />
          </button>
        </div>
        {/* Modal Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 px-8 py-8"
        >
          {/* Lecture Video Upload */}
          <Upload
            name="lectureVideo"
            label="Lecture Video"
            register={register}
            setValue={setValue}
            errors={errors}
            video={true}
            viewData={view ? modalData.videoUrl : null}
            editData={edit ? modalData.videoUrl : null}
          />
          {/* Lecture Title */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="lectureTitle">
              Lecture Title {!view && <sup className="text-pink-200">*</sup>}
            </label>
            <input
              disabled={view || loading}
              id="lectureTitle"
              placeholder="Enter Lecture Title"
              {...register("lectureTitle", { required: true })}
              className="form-style w-full"
            />
            {errors.lectureTitle && (
              <span className="ml-2 text-xs tracking-wide text-pink-200">
                Lecture title is required
              </span>
            )}
          </div>
          {/* Lecture Description */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-richblack-5" htmlFor="lectureDesc">
              Lecture Description{" "}
              {!view && <sup className="text-pink-200">*</sup>}
            </label>
            <textarea
              disabled={view || loading}
              id="lectureDesc"
              placeholder="Enter Lecture Description"
              {...register("lectureDesc", { required: true })}
              className="form-style resize-x-none min-h-[100px] w-full"
            />
            {errors.lectureDesc && (
              <span className="ml-2 text-xs tracking-wide text-pink-200">
                Lecture Description is required
              </span>
            )}
          </div>

          {/* Lecture Resource / Supplementary Material */}
          <div className="flex flex-col space-y-2 rounded-lg border border-richblack-700 bg-richblack-900 p-4">
            <label className="flex items-center text-sm font-semibold text-richblack-5">
              <FiPaperclip className="mr-1.5 text-yellow-50" />
              Lecture Resource / Slides (PDF, ZIP, Code)
              <span className="ml-2 text-xs text-richblack-400 font-normal">Optional</span>
            </label>

            {/* If viewing existing resource */}
            {(view || edit) && modalData?.resourceUrl && (
              <div className="flex items-center justify-between rounded-md bg-richblack-800 p-3 border border-richblack-700">
                <div className="flex items-center space-x-2 text-xs text-yellow-50">
                  <FiFileText className="text-base" />
                  <span className="font-medium truncate max-w-[280px]">
                    {modalData.resourceName || "Attached Resource Material"}
                  </span>
                </div>
                <a
                  href={modalData.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center text-xs font-semibold text-yellow-50 hover:underline bg-yellow-50/10 px-2.5 py-1 rounded border border-yellow-50/30"
                >
                  <FiDownload className="mr-1" /> View / Download
                </a>
              </div>
            )}

            {!view && (
              <div className="mt-2">
                <input
                  type="file"
                  id="resourceFileInput"
                  disabled={loading}
                  onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="resourceFileInput"
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-richblack-600 bg-richblack-800 p-3 text-xs text-richblack-300 hover:border-yellow-50 transition-colors"
                >
                  <FiPaperclip className="mr-1.5 text-yellow-50 text-sm" />
                  {resourceFile ? (
                    <span className="text-yellow-50 font-medium truncate max-w-[350px]">
                      Selected: {resourceFile.name} ({(resourceFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  ) : (
                    <span>Click to attach supplementary slide, PDF, or code archive</span>
                  )}
                </label>
                {resourceFile && (
                  <button
                    type="button"
                    onClick={() => setResourceFile(null)}
                    className="mt-1 text-xxs text-pink-300 hover:underline"
                  >
                    Remove attachment
                  </button>
                )}
              </div>
            )}
          </div>

          {!view && (
            <div className="flex justify-end pt-2">
              <IconBtn
                disabled={loading}
                text={loading ? "Loading.." : edit ? "Save Changes" : "Save"}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
