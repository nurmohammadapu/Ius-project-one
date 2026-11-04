import React, { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"

import "video-react/dist/video-react.css"
import { useLocation } from "react-router-dom"
import { BigPlayButton, Player } from "video-react"
import { FiDownload, FiFileText } from "react-icons/fi"

import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI"
import { updateCompletedLectures } from "../../../redux/Slices/viewCourseSlice"
import IconBtn from "../../Common/IconBtn"
import StudentExamPlayer from "./StudentExamPlayer"
import LectureNotes from "./LectureNotes"

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { courseSectionData, courseEntireData, completedLectures } =
    useSelector((state) => state.viewCourse)

  const [videoData, setVideoData] = useState([])
  const [previewSource, setPreviewSource] = useState("")
  const [videoEnded, setVideoEnded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!courseSectionData.length) return
      if (!courseId && !sectionId && !subSectionId) {
        navigate(`/dashboard/enrolled-courses`)
      } else {
        const filteredData = courseSectionData.filter(
          (course) => (course?.id || course?._id) === sectionId
        )
        const filteredVideoData = filteredData?.[0]?.subSection.filter(
          (data) => (data?.id || data?._id) === subSectionId
        )
        setVideoData(filteredVideoData[0])
        setPreviewSource(courseEntireData.thumbnail)
        setVideoEnded(false)
      }
    })()
  }, [courseSectionData, courseEntireData, location.pathname])

  // check if the lecture is the first video of the course
  const isFirstVideo = () => {
    const currentSectionIndx = courseSectionData.findIndex(
      (data) => (data?.id || data?._id) === sectionId
    )

    const currentSubSectionIndx = courseSectionData[
      currentSectionIndx
    ].subSection.findIndex((data) => (data?.id || data?._id) === subSectionId)

    if (currentSectionIndx === 0 && currentSubSectionIndx === 0) {
      return true
    } else {
      return false
    }
  }

  // go to the next video
  const goToNextVideo = () => {
    const currentSectionIndx = courseSectionData.findIndex(
      (data) => (data?.id || data?._id) === sectionId
    )

    const noOfSubsections =
      courseSectionData[currentSectionIndx].subSection.length

    const currentSubSectionIndx = courseSectionData[
      currentSectionIndx
    ].subSection.findIndex((data) => (data?.id || data?._id) === subSectionId)

    if (currentSubSectionIndx !== noOfSubsections - 1) {
      const nextSubSection =
        courseSectionData[currentSectionIndx].subSection[
          currentSubSectionIndx + 1
        ]
      const nextSubSectionId = nextSubSection?.id || nextSubSection?._id
      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`
      )
    } else {
      const nextSection = courseSectionData[currentSectionIndx + 1]
      const nextSectionId = nextSection?.id || nextSection?._id
      const nextSubSection = nextSection.subSection[0]
      const nextSubSectionId = nextSubSection?.id || nextSubSection?._id
      navigate(
        `/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubSectionId}`
      )
    }
  }

  // check if the lecture is the last video of the course
  const isLastVideo = () => {
    const currentSectionIndx = courseSectionData.findIndex(
      (data) => (data?.id || data?._id) === sectionId
    )

    const noOfSubsections =
      courseSectionData[currentSectionIndx].subSection.length

    const currentSubSectionIndx = courseSectionData[
      currentSectionIndx
    ].subSection.findIndex((data) => (data?.id || data?._id) === subSectionId)

    if (
      currentSectionIndx === courseSectionData.length - 1 &&
      currentSubSectionIndx === noOfSubsections - 1
    ) {
      return true
    } else {
      return false
    }
  }

  // go to the previous video
  const goToPrevVideo = () => {
    const currentSectionIndx = courseSectionData.findIndex(
      (data) => (data?.id || data?._id) === sectionId
    )

    const currentSubSectionIndx = courseSectionData[
      currentSectionIndx
    ].subSection.findIndex((data) => (data?.id || data?._id) === subSectionId)

    if (currentSubSectionIndx !== 0) {
      const prevSubSection =
        courseSectionData[currentSectionIndx].subSection[
          currentSubSectionIndx - 1
        ]
      const prevSubSectionId = prevSubSection?.id || prevSubSection?._id
      navigate(
        `/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`
      )
    } else {
      const prevSection = courseSectionData[currentSectionIndx - 1]
      const prevSectionId = prevSection?.id || prevSection?._id
      const prevSubSectionLength = prevSection.subSection.length
      const prevSubSection = prevSection.subSection[prevSubSectionLength - 1]
      const prevSubSectionId = prevSubSection?.id || prevSubSection?._id
      navigate(
        `/view-course/${courseId}/section/${prevSectionId}/sub-section/${prevSubSectionId}`
      )
    }
  }

  const handleLectureCompletion = async () => {
    setLoading(true)
    const res = await markLectureAsComplete(
      { courseId: courseId, subsectionId: subSectionId },
      token
    )
    if (res) {
      dispatch(updateCompletedLectures(subSectionId))
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-5 text-white">
      {!videoData ? (
        <img
          src={previewSource}
          alt="Preview"
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <Player
          ref={playerRef}
          aspectRatio="16:9"
          playsInline
          onEnded={() => setVideoEnded(true)}
          src={videoData?.videoUrl}
        >
          <BigPlayButton position="center" />
          {videoEnded && (
            <div
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.1)",
              }}
              className="full absolute inset-0 z-[100] grid h-full place-content-center font-inter"
            >
              {!completedLectures.includes(subSectionId) && (
                <IconBtn
                  disabled={loading}
                  onclick={() => handleLectureCompletion()}
                  text={!loading ? "Mark As Completed" : "Loading..."}
                  customClasses="text-xl max-w-max px-4 mx-auto"
                />
              )}
              <IconBtn
                disabled={loading}
                onclick={() => {
                  if (playerRef?.current) {
                    playerRef?.current?.seek(0)
                    setVideoEnded(false)
                  }
                }}
                text="Rewatch"
                customClasses="text-xl max-w-max px-4 mx-auto mt-2"
              />
              <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
                {!isFirstVideo() && (
                  <button
                    disabled={loading}
                    onClick={goToPrevVideo}
                    className="blackButton"
                  >
                    Prev
                  </button>
                )}
                {!isLastVideo() && (
                  <button
                    disabled={loading}
                    onClick={goToNextVideo}
                    className="blackButton"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </Player>
      )}

      <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>
      <p className="pt-2 pb-2 text-richblack-200">{videoData?.description}</p>

      {/* Lecture Supplementary Material / Downloadable Resource */}
      {videoData?.resourceUrl && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-yellow-50/40 bg-richblack-800 p-4 shadow-md">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50/10 text-yellow-50 text-xl">
              <FiFileText />
            </div>
            <div>
              <p className="text-sm font-bold text-richblack-5">
                {videoData.resourceName || "Lecture Study Material & Slides"}
              </p>
              <p className="text-xs text-richblack-300">
                Supplementary handout / reference code attached to this lecture
              </p>
            </div>
          </div>
          <a
            href={videoData.resourceUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center space-x-2 rounded-lg bg-yellow-50 px-4 py-2 text-xs font-bold text-richblack-900 shadow hover:bg-yellow-100 transition-all"
          >
            <FiDownload />
            <span>Download Resource</span>
          </a>
        </div>
      )}

      {/* Personal Lecture Notes Text Area */}
      <LectureNotes subSectionId={subSectionId} />

      {/* Student Exam Center */}
      <div className="mt-4 space-y-4">
        <StudentExamPlayer subSectionId={subSectionId} />
        <StudentExamPlayer sectionId={sectionId} />
        <StudentExamPlayer courseId={courseId} />
      </div>
    </div>
  )
}

export default VideoDetails
