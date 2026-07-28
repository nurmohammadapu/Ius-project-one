import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getFinancialReport } from "../../../../services/operations/adminAPI"

export default function FinancialReport() {
  const { token } = useSelector((state) => state.auth)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      const data = await getFinancialReport(token)
      if (data) {
        setReportData(data)
      }
      setLoading(false)
    }
    fetchReport()
  }, [token])

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="mx-auto w-11/12 max-w-[1000px] py-10 text-center text-richblack-100">
        <p className="text-xl">Could not retrieve financial report. Please try again later.</p>
      </div>
    )
  }

  const { totalRevenue, totalSales, totalStudents, totalInstructors, courseBreakdown } = reportData

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-richblack-5">Financial Report</h1>
        <p className="text-sm text-richblack-400 mt-1">Platform-wide overview of revenue, sales and registration metrics.</p>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-richblack-800 bg-richblack-900 p-6">
          <p className="text-sm font-semibold text-richblack-400">Total Revenue</p>
          <p className="text-3xl font-bold text-yellow-50 mt-2">${totalRevenue.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-richblack-800 bg-richblack-900 p-6">
          <p className="text-sm font-semibold text-richblack-400">Total Course Sales</p>
          <p className="text-3xl font-bold text-caribbeangreen-100 mt-2">{totalSales}</p>
        </div>

        <div className="rounded-xl border border-richblack-800 bg-richblack-900 p-6">
          <p className="text-sm font-semibold text-richblack-400">Active Students</p>
          <p className="text-3xl font-bold text-richblack-5 mt-2">{totalStudents}</p>
        </div>

        <div className="rounded-xl border border-richblack-800 bg-richblack-900 p-6">
          <p className="text-sm font-semibold text-richblack-400">Instructors</p>
          <p className="text-3xl font-bold text-richblack-5 mt-2">{totalInstructors}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-medium text-richblack-5">Course Breakdown</h2>
        <p className="text-xs text-richblack-400 mt-1">Sales and revenue metrics detailed per course.</p>
      </div>

      {/* Breakdown Table */}
      <div className="overflow-x-auto rounded-xl border border-richblack-800 bg-richblack-900">
        <table className="w-full text-left text-richblack-100 border-collapse">
          <thead>
            <tr className="border-b border-richblack-800 bg-richblack-800 text-sm font-semibold uppercase text-richblack-200">
              <th className="px-6 py-4">Course Title</th>
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4 text-center">Sales</th>
              <th className="px-6 py-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {courseBreakdown.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-xl font-medium text-richblack-300">
                  No courses sold or uploaded yet.
                </td>
              </tr>
            ) : (
              courseBreakdown.map((course) => (
                <tr key={course.id} className="border-b border-richblack-800 hover:bg-richblack-800/50 transition-all">
                  <td className="px-6 py-4 font-semibold text-richblack-5">{course.courseName}</td>
                  <td className="px-6 py-4 text-sm text-richblack-300">{course.instructor}</td>
                  <td className="px-6 py-4">${course.price}</td>
                  <td className="px-6 py-4 text-center">{course.sales}</td>
                  <td className="px-6 py-4 text-right font-semibold text-yellow-50">${course.revenue.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
