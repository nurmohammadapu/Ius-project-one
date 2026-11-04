import { useEffect, useState } from "react"
import { BsChevronDown } from "react-icons/bs"
import { IoIosArrowBack } from "react-icons/io"
import { FiAward } from "react-icons/fi"
import { useSelector } from "react-redux"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import IconBtn from "../../Common/IconBtn"
import { getCourseCertificate } from "../../../services/operations/certificateAPI"
import CertificateModal from "../Course/CertificateModal"

export default function VideoDetailsSidebar({ setReviewModal }) {
  const [activeStatus, setActiveStatus] = useState("")
  const [videoBarActive, setVideoBarActive] = useState("")
  const [showCertModal, setShowCertModal] = useState(false)
  const [certData, setCertData] = useState(null)
  const [certLoading, setCertLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { sectionId, subSectionId } = useParams()
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const {
    courseSectionData,
    courseEntireData,
    totalNoOfLectures,
    completedLectures,
  } = useSelector((state) => state.viewCourse)

  const alreadyReviewed = courseEntireData?.ratingAndReviews?.some(
    (review) => review.userId === user?.id || review.userId === user?._id
  )

  const isCourseComplete =
    totalNoOfLectures > 0 && completedLectures?.length >= totalNoOfLectures

  const handleOpenCert = async () => {
    const courseId = courseEntireData?.id || courseEntireData?._id
    if (!courseId) return

    setCertLoading(true)
    const cert = await getCourseCertificate(courseId, token)
    if (cert) {
      setCertData(cert)
      setShowCertModal(true)
    }
    setCertLoading(false)
  }

  useEffect(() => {
    ;(() => {
      if (!courseSectionData.length) return
      const currentSectionIndx = courseSectionData.findIndex(
        (data) => (data?.id || data?._id) === sectionId
      )
      const currentSubSectionIndx = courseSectionData?.[
        currentSectionIndx
      ]?.subSection.findIndex((data) => (data?.id || data?._id) === subSectionId)
      const activeSubSectionId =
        courseSectionData[currentSectionIndx]?.subSection?.[
          currentSubSectionIndx
        ]?.id ||
        courseSectionData[currentSectionIndx]?.subSection?.[
          currentSubSectionIndx
        ]?._id
      setActiveStatus(courseSectionData?.[currentSectionIndx]?.id || courseSectionData?.[currentSectionIndx]?._id)
      setVideoBarActive(activeSubSectionId)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSectionData, courseEntireData, location.pathname])

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] w-full lg:w-[320px] lg:max-w-[350px] flex-col border-r-[1px] border-r-richblack-700 bg-richblack-800">
        <div className="mx-5 flex flex-col items-start justify-between gap-2 gap-y-3 border-b border-richblack-600 py-5 text-lg font-bold text-richblack-25">
          <div className="flex w-full items-center justify-between ">
            <div
              onClick={() => {
                navigate(`/dashboard/enrolled-courses`)
              }}
              className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-richblack-100 p-1 text-richblack-700 hover:scale-90 cursor-pointer"
              title="Back to enrolled courses"
            >
              <IoIosArrowBack size={30} />
            </div>
            {!alreadyReviewed && (
              <IconBtn
                text="Add Review"
                customClasses={`ml-auto ${
                  completedLectures?.length < totalNoOfLectures
                    ? "opacity-40 cursor-not-allowed bg-richblack-700 text-richblack-400"
                    : ""
                }`}
                disabled={completedLectures?.length < totalNoOfLectures}
                onclick={() => setReviewModal(true)}
                title={
                  completedLectures?.length < totalNoOfLectures
                    ? "Complete all lectures to add a review"
                    : "Add a review"
                }
              />
            )}
          </div>

          <div className="flex flex-col w-full">
            <p className="truncate text-base">{courseEntireData?.courseName}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-semibold text-richblack-400">
                {completedLectures?.length} / {totalNoOfLectures} Completed
              </p>
              {isCourseComplete && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  100% Done
                </span>
              )}
            </div>

            {/* Claim Certificate Button */}
            {isCourseComplete && (
              <button
                onClick={handleOpenCert}
                disabled={certLoading}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-richblack-900 hover:bg-yellow-100 transition shadow animate-pulse"
              >
                <FiAward className="text-base" /> {certLoading ? "Loading..." : "Claim Certificate 🎓"}
              </button>
            )}
          </div>
        </div>

        <div className="h-[calc(100vh - 5rem)] overflow-y-auto">
          {courseSectionData.map((course, index) => (
            <div
              className="mt-2 cursor-pointer text-sm text-richblack-5"
              key={index}
            >
              {/* Section */}
              <div
                className="flex flex-row justify-between bg-richblack-600 px-5 py-4"
                onClick={() => {
                  const currentId = course?.id || course?._id;
                  setActiveStatus(activeStatus === currentId ? "" : currentId);
                }}
              >
                <div className="w-[70%] font-semibold">
                  {course?.sectionName}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`${
                      activeStatus === (course?.id || course?._id)
                        ? "rotate-0"
                        : "rotate-180"
                    } transition-all duration-500`}
                  >
                    <BsChevronDown />
                  </span>
                </div>
              </div>

              {/* Sub Sections */}
              {activeStatus === (course?.id || course?._id) && (
                <div className="transition-[height] duration-500 ease-in-out">
                  {course.subSection.map((topic, i) => (
                    <div
                      className={`flex gap-3 px-5 py-2 ${
                        videoBarActive === (topic?.id || topic?._id)
                          ? "bg-yellow-200 font-semibold text-richblack-800"
                          : "hover:bg-richblack-900"
                      } `}
                      key={i}
                      onClick={() => {
                        const courseId = courseEntireData?.id || courseEntireData?._id
                        const secId = course?.id || course?._id
                        const subSecId = topic?.id || topic?._id
                        navigate(
                          `/view-course/${courseId}/section/${secId}/sub-section/${subSecId}`
                        )
                        setVideoBarActive(subSecId)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={completedLectures.includes(topic?.id || topic?._id)}
                        onChange={() => {}}
                      />
                      {topic.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertModal && certData && (
        <CertificateModal
          certificate={certData}
          onClose={() => setShowCertModal(false)}
        />
      )}
    </>
  )
}
