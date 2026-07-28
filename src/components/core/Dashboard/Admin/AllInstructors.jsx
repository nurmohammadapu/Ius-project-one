import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { getAllInstructors, toggleUserStatus, deleteUser, createUser } from "../../../../services/operations/adminAPI"
import { formatDate } from "../../../../services/formatDate"
import { VscAdd, VscTrash } from "react-icons/vsc"

export default function AllInstructors() {
  const { token } = useSelector((state) => state.auth)
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
  })

  const fetchInstructors = async () => {
    setLoading(true)
    const data = await getAllInstructors(token)
    if (data) {
      setInstructors(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInstructors()
  }, [])

  const handleToggleStatus = async (userId, currentActive) => {
    const success = await toggleUserStatus(userId, !currentActive, token)
    if (success) {
      setInstructors((prev) =>
        prev.map((instructor) =>
          instructor.id === userId ? { ...instructor, active: !currentActive } : instructor
        )
      )
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this instructor account? This action cannot be undone.")) {
      const success = await deleteUser(userId, token)
      if (success) {
        setInstructors((prev) => prev.filter((instructor) => instructor.id !== userId))
      }
    }
  }

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...formData, accountType: "Instructor" }
    const newUser = await createUser(payload, token)
    if (newUser) {
      setInstructors((prev) => [newUser, ...prev])
      setShowCreateModal(false)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        contactNumber: "",
      })
    }
  }

  const filteredInstructors = instructors.filter(
    (instructor) =>
      instructor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-medium text-richblack-5">All Instructors</h1>
          <p className="text-sm text-richblack-400 mt-1">Manage instructor accounts, approval, activation status and profile details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg bg-richblack-800 px-4 py-2 text-richblack-5 placeholder-richblack-400 outline-none focus:ring-2 focus:ring-yellow-50 w-full sm:w-64"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-richblack-900 px-4 py-2 font-semibold text-sm transition-all duration-200"
          >
            <VscAdd size={16} />
            Create Instructor
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-richblack-800 bg-richblack-900">
        <table className="w-full text-left text-richblack-100 border-collapse">
          <thead>
            <tr className="border-b border-richblack-800 bg-richblack-800 text-sm font-semibold uppercase text-richblack-200">
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4">Approval</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstructors.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-xl font-medium text-richblack-300">
                  No instructors found
                </td>
              </tr>
            ) : (
              filteredInstructors.map((instructor) => (
                <tr key={instructor.id} className="border-b border-richblack-800 hover:bg-richblack-800/50 transition-all">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={instructor.image}
                      alt={`${instructor.firstName} ${instructor.lastName}`}
                      className="h-10 w-10 rounded-full object-cover border border-richblack-700"
                    />
                    <span className="font-semibold text-richblack-5">
                      {instructor.firstName} {instructor.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4">{instructor.email}</td>
                  <td className="px-6 py-4">{formatDate(instructor.createdAt).split(" | ")[0]}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        instructor.approved
                          ? "bg-caribbeangreen-900/40 text-caribbeangreen-100"
                          : "bg-yellow-900/40 text-yellow-100"
                      }`}
                    >
                      {instructor.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        instructor.active
                          ? "bg-caribbeangreen-900/40 text-caribbeangreen-100"
                          : "bg-pink-900/40 text-pink-100"
                      }`}
                    >
                      {instructor.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleToggleStatus(instructor.id, instructor.active)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                          instructor.active
                            ? "bg-pink-700 hover:bg-pink-800 text-white"
                            : "bg-yellow-50 hover:bg-yellow-100 text-richblack-900"
                        }`}
                      >
                        {instructor.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(instructor.id)}
                        className="rounded-lg p-2 text-pink-200 hover:bg-pink-900/30 hover:text-pink-100 transition-all duration-200"
                        title="Delete Account"
                      >
                        <VscTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Instructor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-richblack-700 bg-richblack-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-richblack-5">Create New Instructor</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-richblack-200 hover:text-richblack-5 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-xs text-richblack-300 font-medium">First Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="rounded bg-richblack-700 p-2 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:ring-1 focus:ring-yellow-50"
                  />
                </div>
                <div className="flex flex-col gap-1 w-1/2">
                  <label className="text-xs text-richblack-300 font-medium">Last Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="rounded bg-richblack-700 p-2 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:ring-1 focus:ring-yellow-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-richblack-300 font-medium">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded bg-richblack-700 p-2 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:ring-1 focus:ring-yellow-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-richblack-300 font-medium">Password</label>
                <input
                  required
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="rounded bg-richblack-700 p-2 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:ring-1 focus:ring-yellow-50"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-richblack-300 font-medium">Contact Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="rounded bg-richblack-700 p-2 text-sm text-richblack-5 placeholder-richblack-400 outline-none focus:ring-1 focus:ring-yellow-50"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded bg-richblack-700 hover:bg-richblack-600 px-4 py-2 text-sm font-semibold text-richblack-5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-yellow-50 hover:bg-yellow-100 px-4 py-2 text-sm font-semibold text-richblack-900 transition"
                >
                  Create Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
