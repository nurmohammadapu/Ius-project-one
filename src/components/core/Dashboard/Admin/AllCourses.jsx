import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getAllCourses, toggleCoursePublish } from "../../../../services/operations/adminAPI"
import { formatDate } from "../../../../services/formatDate"
import { VscEye } from "react-icons/vsc"

export default function AllCourses() {
  const { token } = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Selected course for view details modal
  const [viewingCourse, setViewingCourse] = useState(null)

  const fetchCourses = async () => {
    setLoading(true)
    const data = await getAllCourses(token)
    if (data) {
      setCourses(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleTogglePublish = async (courseId, currentStatus) => {
    const willPublish = currentStatus !== "Published"
    const success = await toggleCoursePublish(courseId, willPublish, token)
    if (success) {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, status: willPublish ? "Published" : "Draft" }
            : course
        )
      )
      
      // Update modal state if we are currently viewing this course
      if (viewingCourse && viewingCourse.id === courseId) {
        setViewingCourse((prev) => ({
          ...prev,
          status: willPublish ? "Published" : "Draft",
        }))
      }
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-richblack-5">All Courses</h1>
          <p className="text-sm text-richblack-400 mt-1">View all platform courses, their instructors, prices, and control their publication status.</p>
        </div>
        <input
          type="text"
          placeholder="Search by title, instructor, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-lg bg-richblack-800 p-3 text-richblack-5 placeholder-richblack-400 outline-none focus:ring-2 focus:ring-yellow-50 md:w-80 w-full"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-richblack-800 bg-richblack-900 w-full">
        <table className="w-full text-left text-richblack-100 border-collapse table-auto min-w-[850px]">
          <thead>
            <tr className="border-b border-richblack-800 bg-richblack-800 text-sm font-semibold uppercase text-richblack-200">
              <th className="px-6 py-4 w-[30%]">Course</th>
              <th className="px-6 py-4 w-[25%]">Instructor</th>
              <th className="px-6 py-4 w-[15%]">Category</th>
              <th className="px-6 py-4 w-[10%]">Price</th>
              <th className="px-6 py-4 w-[10%] text-center">Students</th>
              <th className="px-6 py-4 w-[10%]">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-xl font-medium text-richblack-300">
                  No courses found
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-richblack-800 hover:bg-richblack-800/50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={course.thumbnail}
                        alt={course.courseName}
                        className="h-10 w-16 rounded object-cover border border-richblack-700 shrink-0"
                      />
                      <span className="font-semibold text-richblack-5 line-clamp-2">
                        {course.courseName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-richblack-5 font-semibold">
                      {course.instructor?.firstName} {course.instructor?.lastName}
                    </div>
                    <div className="text-xs text-richblack-400 break-all">{course.instructor?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-richblack-100">{course.category?.name || "N/A"}</td>
                  <td className="px-6 py-4 text-richblack-100">${course.price}</td>
                  <td className="px-6 py-4 text-richblack-100 text-center">{course.studentsEnroled?.length || 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        course.status === "Published"
                          ? "bg-caribbeangreen-900/40 text-caribbeangreen-100"
                          : "bg-pink-900/40 text-pink-100"
                      }`}
                    >
                      {course.status === "Published" ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleTogglePublish(course.id, course.status)}
                        className={`rounded px-3 py-1.5 text-xs font-bold transition-all duration-200 shrink-0 ${
                          course.status === "Published"
                            ? "bg-pink-700 hover:bg-pink-800 text-white"
                            : "bg-yellow-50 hover:bg-yellow-100 text-richblack-900"
                        }`}
                      >
                        {course.status === "Published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => setViewingCourse(course)}
                        className="rounded p-2 text-richblack-200 hover:bg-richblack-800 hover:text-richblack-5 transition-all duration-200 shrink-0"
                        title="View Course Details & Contents"
                      >
                        <VscEye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Course Details Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-richblack-700 bg-richblack-800 p-6 shadow-2xl my-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-richblack-5">Course Outline & Review</h2>
              <button
                onClick={() => setViewingCourse(null)}
                className="text-richblack-200 hover:text-richblack-5 font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto pr-2">
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src={viewingCourse.thumbnail}
                  alt={viewingCourse.courseName}
                  className="w-full sm:w-48 h-32 rounded object-cover border border-richblack-700"
                />
                <div className="flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-richblack-5">{viewingCourse.courseName}</h3>
                    <p className="text-xs text-richblack-300 mt-1">Instructor: {viewingCourse.instructor?.firstName} {viewingCourse.instructor?.lastName} ({viewingCourse.instructor?.email})</p>
                    <p className="text-xs text-richblack-300">Category: {viewingCourse.category?.name || "N/A"}</p>
                    <p className="text-xs text-richblack-300">Price: ${viewingCourse.price}</p>
                  </div>
                  <span
                    className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold mt-2 ${
                      viewingCourse.status === "Published"
                        ? "bg-caribbeangreen-900/40 text-caribbeangreen-100"
                        : "bg-pink-900/40 text-pink-100"
                    }`}
                  >
                    {viewingCourse.status === "Published" ? "Published" : "Unpublished"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-richblack-5 text-sm uppercase text-richblack-200 border-b border-richblack-700 pb-1 mb-2">Description</h4>
                <p className="text-sm text-richblack-200 whitespace-pre-wrap">{viewingCourse.courseDescription || "No description provided."}</p>
              </div>

              <div>
                <h4 className="font-semibold text-richblack-5 text-sm uppercase text-richblack-200 border-b border-richblack-700 pb-1 mb-2">What you will learn</h4>
                <p className="text-sm text-richblack-200">{viewingCourse.whatYouWillLearn || "No learn points defined."}</p>
              </div>

              {/* Course Content Section Accordion Outline */}
              <div>
                <h4 className="font-semibold text-richblack-5 text-sm uppercase text-richblack-200 border-b border-richblack-700 pb-1 mb-2">Course Sections & Lessons</h4>
                {!viewingCourse.courseContent || viewingCourse.courseContent.length === 0 ? (
                  <p className="text-xs text-richblack-400 italic">No content has been uploaded for this course yet.</p>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    {viewingCourse.courseContent.map((section, idx) => (
                      <div key={section.id || idx} className="rounded-lg border border-richblack-700 bg-richblack-900 p-3">
                        <h5 className="font-semibold text-richblack-5 text-sm flex items-center justify-between">
                          <span>Section {idx + 1}: {section.sectionName}</span>
                          <span className="text-xs text-richblack-400">{section.subSection?.length || 0} Lessons</span>
                        </h5>
                        
                        {section.subSection && section.subSection.length > 0 && (
                          <div className="mt-2 flex flex-col gap-2 pl-4 border-l border-richblack-700">
                            {section.subSection.map((sub, sIdx) => (
                              <div key={sub.id || sIdx} className="text-xs flex items-center justify-between py-1 text-richblack-200">
                                <span>{idx + 1}.{sIdx + 1} {sub.title}</span>
                                <span className="text-richblack-400 font-mono">{sub.timeDuration}s</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingCourse(null)}
                className="rounded bg-richblack-700 hover:bg-richblack-600 px-5 py-2 text-sm font-semibold text-richblack-5 transition"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
