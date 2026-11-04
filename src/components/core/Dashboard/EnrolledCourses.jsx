import { useEffect, useState } from "react"
import ProgressBar from "@ramonak/react-progress-bar"
import { FiAward } from "react-icons/fi"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

import { getUserEnrolledCourses } from "../../../services/operations/profileAPI"
import { getCourseCertificate } from "../../../services/operations/certificateAPI"
import CertificateModal from "../Course/CertificateModal"

export default function EnrolledCourses() {
  const { token } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [enrolledCourses, setEnrolledCourses] = useState(null)
  const [activeCertificate, setActiveCertificate] = useState(null)
  const [certLoading, setCertLoading] = useState(false)

  const fetchEnrolledCourses = async () => {
    try {
      const res = await getUserEnrolledCourses(token)
      const filterPublishCourse = res.filter((ele) => ele.status !== "Draft")
      setEnrolledCourses(filterPublishCourse)
    } catch (error) {
      console.log("Could not fetch enrolled courses.", error)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchEnrolledCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleViewCertificate = async (courseId) => {
    setCertLoading(true)
    const cert = await getCourseCertificate(courseId, token)
    if (cert) {
      setActiveCertificate(cert)
    }
    setCertLoading(false)
  }

  return (
    <>
      <div className="text-3xl text-richblack-50">Enrolled Courses</div>
      {!enrolledCourses ? (
        <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
          <div className="spinner"></div>
        </div>
      ) : !enrolledCourses.length ? (
        <p className="grid h-[10vh] w-full place-content-center text-richblack-5">
          You have not enrolled in any course yet.
        </p>
      ) : (
        <div className="my-8 text-richblack-5">
          {/* Headings */}
          <div className="flex rounded-t-lg bg-richblack-500 ">
            <p className="w-[45%] px-5 py-3">Course Name</p>
            <p className="w-1/4 px-2 py-3">Duration</p>
            <p className="flex-1 px-2 py-3">Progress</p>
          </div>
          {/* Course Names */}
          {enrolledCourses.map((course, i, arr) => {
            const courseId = course?.id || course?._id
            const isCompleted = course.progressPercentage >= 100

            return (
              <div
                className={`flex flex-col md:flex-row items-center border border-richblack-700 ${
                  i === arr.length - 1 ? "rounded-b-lg" : "rounded-none"
                }`}
                key={i}
              >
                <div
                  className="flex flex-col md:flex-row w-full md:w-[45%] cursor-pointer items-center gap-4 px-5 py-3"
                  onClick={() => {
                    navigate(
                      `/view-course/${courseId}/section/${course.courseContent?.[0]?.id || course.courseContent?.[0]?._id}/sub-section/${course.courseContent?.[0]?.subSection?.[0]?.id || course.courseContent?.[0]?.subSection?.[0]?._id}`
                    )
                  }}
                >
                  <img
                    src={course.thumbnail}
                    alt="course_img"
                    className="md:h-14 md:w-14 w-full rounded-lg object-cover"
                  />
                  <div className="flex w-full md:max-w-xs flex-col gap-2">
                    <p className="font-semibold">{course.courseName}</p>
                    <p className="text-xs text-richblack-300">
                      {course.courseDescription.length > 50
                        ? `${course.courseDescription.slice(0, 50)}...`
                        : course.courseDescription}
                    </p>
                  </div>
                </div>
                
                <div className="w-full md:w-1/4 px-5 md:px-2 py-3">{course?.totalDuration}</div>
                <div className="flex w-full md:w-1/5 flex-col gap-2 px-5 md:px-2 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs">Progress: {course.progressPercentage || 0}%</p>
                    {isCompleted && (
                      <button
                        onClick={() => handleViewCertificate(courseId)}
                        disabled={certLoading}
                        className="flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-[11px] font-bold text-richblack-900 hover:bg-yellow-100 transition shadow"
                        title="View Official Certificate"
                      >
                        <FiAward /> Certificate
                      </button>
                    )}
                  </div>
                  <ProgressBar
                    completed={course.progressPercentage || 0}
                    height="8px"
                    isLabelVisible={false}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Certificate Modal */}
      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </>
  )
}
