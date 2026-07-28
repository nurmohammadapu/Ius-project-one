import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getPendingInstructors, manageInstructor } from "../../../../services/operations/adminAPI"
import { formatDate } from "../../../../services/formatDate"

export default function PendingApprovals() {
  const { token } = useSelector((state) => state.auth)
  const [pendingList, setPendingList] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    setLoading(true)
    const data = await getPendingInstructors(token)
    if (data) {
      setPendingList(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleAction = async (instructorId, action) => {
    const confirmed = window.confirm(`Are you sure you want to ${action} this instructor?`)
    if (confirmed) {
      const success = await manageInstructor(instructorId, action, token)
      if (success) {
        setPendingList((prev) => prev.filter((item) => item.id !== instructorId))
      }
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-richblack-5">Pending Approvals</h1>
        <p className="text-sm text-richblack-400 mt-1">Review and approve or deny registration requests for new Instructors.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-richblack-800 bg-richblack-900">
        <table className="w-full text-left text-richblack-100 border-collapse">
          <thead>
            <tr className="border-b border-richblack-800 bg-richblack-800 text-sm font-semibold uppercase text-richblack-200">
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Registered Date</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-xl font-medium text-richblack-300">
                  No pending approval requests found
                </td>
              </tr>
            ) : (
              pendingList.map((item) => (
                <tr key={item.id} className="border-b border-richblack-800 hover:bg-richblack-800/50 transition-all">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={`${item.firstName} ${item.lastName}`}
                      className="h-10 w-10 rounded-full object-cover border border-richblack-700"
                    />
                    <span className="font-semibold text-richblack-5">
                      {item.firstName} {item.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.email}</td>
                  <td className="px-6 py-4">{formatDate(item.createdAt).split(" | ")[0]}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleAction(item.id, "approve")}
                        className="rounded bg-caribbeangreen-700 hover:bg-caribbeangreen-800 px-4 py-2 text-xs font-bold text-white transition-all duration-200"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, "deny")}
                        className="rounded bg-pink-700 hover:bg-pink-800 px-4 py-2 text-xs font-bold text-white transition-all duration-200"
                      >
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
