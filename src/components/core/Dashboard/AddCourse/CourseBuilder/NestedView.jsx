import { useState } from "react"
import { AiFillCaretDown } from "react-icons/ai"
import { FaPlus } from "react-icons/fa"
import { MdEdit } from "react-icons/md"
import { RiDeleteBin6Line } from "react-icons/ri"
import { RxDropdownMenu } from "react-icons/rx"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-hot-toast"

import {
  deleteSection,
  deleteSubSection,
  getFullDetailsOfCourse,
} from "../../../../../services/operations/courseDetailsAPI"
import { setCourse } from "../../../../../redux/Slices/courseSlice"
import ConfirmationModal from "../../../../Common/ConfirmationModal"
import SubSectionModal from "./SubSectionModal"
import CreateExamModal from "../../Exam/CreateExamModal"

export default function NestedView({ handleChangeEditSectionName }) {
  const { course } = useSelector((state) => state.course)
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  // States to keep track of mode of modal [add, view, edit]
  const [addSubSection, setAddSubsection] = useState(null)
  const [viewSubSection, setViewSubSection] = useState(null)
  const [editSubSection, setEditSubSection] = useState(null)
  // to keep track of exam creation modal
  const [createExam, setCreateExam] = useState(null)
  // to keep track of confirmation modal
  const [confirmationModal, setConfirmationModal] = useState(null)

  const handleDeleleSection = async (sectionId) => {
    const result = await deleteSection({
      sectionId,
      courseId: course?.id || course?._id,
      token,
    })
    if (result) {
      dispatch(setCourse(result))
    }     
    setConfirmationModal(null)
  }

  const handleDeleteSubSection = async (subSectionId, sectionId) => {
    const result = await deleteSubSection({ subSectionId, sectionId, token })
    if (result) {
      // update the structure of course
      const updatedCourseContent = course.courseContent.map((section) =>
        (section?.id || section?._id) === sectionId ? result : section
      )
      const updatedCourse = { ...course, courseContent: updatedCourseContent }
      dispatch(setCourse(updatedCourse))
    }
    setConfirmationModal(null)
  }

  return (
    <>
      <div
        className="rounded-lg bg-richblack-700 p-6 px-8"
        id="nestedViewContainer"
      >
        {course?.courseContent?.map((section) => (
          // Section Dropdown
          <details key={section?.id || section?._id} open>
            {/* Section Dropdown Content */}
            <summary className="flex cursor-pointer items-center justify-between border-b-2 border-b-richblack-600 py-2">
              <div className="flex items-center gap-x-3">
                <RxDropdownMenu className="text-2xl text-richblack-50" />
                <p className="font-semibold text-richblack-50">
                  {section.sectionName}
                </p>
              </div>
              <div className="flex items-center gap-x-3">
                <button
                  onClick={() =>
                    handleChangeEditSectionName(
                      section?.id || section?._id,
                      section.sectionName
                    )
                  }
                >
                  <MdEdit className="text-xl text-richblack-300" />
                </button>
                <button
                  onClick={() =>
                    setConfirmationModal({
                      text1: "Delete this Section?",
                      text2: "All the lectures in this section will be deleted",
                      btn1Text: "Delete",
                      btn2Text: "Cancel",
                      btn1Handler: () => handleDeleleSection(section?.id || section?._id),
                      btn2Handler: () => setConfirmationModal(null),
                    })
                  }
                >
                  <RiDeleteBin6Line className="text-xl text-richblack-300" />
                </button>
                <span className="font-medium text-richblack-300">|</span>
                <AiFillCaretDown className={`text-xl text-richblack-300`} />
              </div>
            </summary>
            <div className="px-6 pb-4">
              {/* Render Section Exam if exists */}
              {section.exams && section.exams.length > 0 && (
                <div className="mb-4 rounded-md border border-yellow-50/20 bg-richblack-900 p-4 font-inter text-xs text-richblack-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-50">Section Exam: {section.exams[0].title} ({section.exams[0].examType})</span>
                    <span className="text-richblack-400">Total Marks: {section.exams[0].totalMarks}</span>
                  </div>
                  {section.exams[0].description && <p className="text-richblack-300 italic">"{section.exams[0].description}"</p>}
                  {section.exams[0].questions && section.exams[0].questions.length > 0 && (
                    <div className="mt-2 space-y-1 pl-2 border-l border-richblack-700">
                      <p className="font-semibold text-richblack-200">Questions ({section.exams[0].questions.length}):</p>
                      {section.exams[0].questions.map((q, qidx) => (
                        <p key={q.id} className="text-richblack-400">
                          {qidx + 1}. {q.questionText}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Render All Sub Sections Within a Section */}
              {section.subSection.map((data) => (
                <div key={data?.id || data?._id} className="mb-3">
                  <div
                    onClick={() => setViewSubSection(data)}
                    className="flex cursor-pointer items-center justify-between gap-x-3 border-b-2 border-b-richblack-600 py-2"
                  >
                    <div className="flex items-center gap-x-3 py-2 ">
                      <RxDropdownMenu className="text-2xl text-richblack-50" />
                      <p className="font-semibold text-richblack-50">
                        {data.title}
                      </p>
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-x-3"
                    >
                      <button
                        onClick={() => setCreateExam({ subSectionId: data.id || data._id })}
                        className="text-xs text-yellow-50 border border-yellow-50/20 px-2 py-0.5 rounded bg-yellow-50/5 hover:bg-yellow-50/15"
                      >
                        Add Exam
                      </button>
                      <button
                        onClick={() =>
                          setEditSubSection({ ...data, sectionId: section?.id || section?._id })
                        }
                      >
                        <MdEdit className="text-xl text-richblack-300" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmationModal({
                            text1: "Delete this Sub-Section?",
                            text2: "This lecture will be deleted",
                            btn1Text: "Delete",
                            btn2Text: "Cancel",
                            btn1Handler: () =>
                              handleDeleteSubSection(data?.id || data?._id, section?.id || section?._id),
                            btn2Handler: () => setConfirmationModal(null),
                          })
                        }
                      >
                        <RiDeleteBin6Line className="text-xl text-richblack-300" />
                      </button>
                    </div>
                  </div>
                  {/* Subsection Exam if exists */}
                  {data.exams && data.exams.length > 0 && (
                    <div className="ml-8 mt-1.5 rounded border border-yellow-50/20 bg-richblack-900 p-3 text-[11px] text-richblack-100 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-yellow-50">Lecture Exam: {data.exams[0].title} ({data.exams[0].examType})</span>
                        <span className="text-richblack-400">Marks: {data.exams[0].totalMarks}</span>
                      </div>
                      {data.exams[0].description && <p className="text-richblack-300 italic">"{data.exams[0].description}"</p>}
                      {data.exams[0].questions && data.exams[0].questions.length > 0 && (
                        <div className="mt-1 pl-2 border-l border-richblack-700">
                          <p className="font-semibold text-richblack-200">Questions ({data.exams[0].questions.length}):</p>
                          {data.exams[0].questions.map((q, qidx) => (
                            <p key={q.id} className="text-richblack-400">
                              {qidx + 1}. {q.questionText}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {/* Add New Lecture to Section */}
              <div className="mt-3 flex items-center gap-x-4">
                <button
                  onClick={() => setAddSubsection(section.id || section._id)}
                  className="flex items-center gap-x-1 text-yellow-50 font-medium hover:underline"
                >
                  <FaPlus className="text-lg" />
                  <p>Add Lecture</p>
                </button>
                <span className="text-richblack-400">|</span>
                <button
                  onClick={() => setCreateExam({ sectionId: section.id || section._id })}
                  className="flex items-center gap-x-1 text-yellow-50 font-medium hover:underline"
                >
                  <FaPlus className="text-lg" />
                  <p>Add Exam</p>
                </button>
              </div>
            </div>
          </details>
        ))}
      </div>
      {/* Modal Display */}
      {addSubSection ? (
        <SubSectionModal
          modalData={addSubSection}
          setModalData={setAddSubsection}
          add={true}
        />
      ) : viewSubSection ? (
        <SubSectionModal
          modalData={viewSubSection}
          setModalData={setViewSubSection}
          view={true}
        />
      ) : editSubSection ? (
        <SubSectionModal
          modalData={editSubSection}
          setModalData={setEditSubSection}
          edit={true}
        />
      ) : (
        <></>
      )}
      {/* Create Exam Modal */}
      {createExam && (
        <CreateExamModal
          courseId={course?.id || course?._id}
          sectionId={createExam.sectionId}
          subSectionId={createExam.subSectionId}
          onClose={() => setCreateExam(null)}
          onSuccess={async () => {
            toast.success("Exam added successfully to the course layout!")
            const result = await getFullDetailsOfCourse(course?.id || course?._id, token)
            if (result && result.courseDetails) {
              dispatch(setCourse(result.courseDetails))
            } else if (result) {
              dispatch(setCourse(result))
            }
          }}
        />
      )}
      {/* Confirmation Modal */}
      {confirmationModal ? (
        <ConfirmationModal modalData={confirmationModal} />
      ) : (
        <></>
      )}
    </>
  )
}
