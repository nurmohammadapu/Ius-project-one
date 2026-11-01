import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import {
  getAdminCategories,
  addCategory,
  editCategory,
  removeCategory,
} from "../../../../services/operations/adminAPI"
import ConfirmationModal from "../../../Common/ConfirmationModal"
import { VscAdd, VscEdit, VscTrash, VscClose, VscFolder, VscSearch } from "react-icons/vsc"

export default function CategoryManage() {
  const { token } = useSelector((state) => state.auth)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Confirmation modal for delete
  const [confirmationModal, setConfirmationModal] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    const data = await getAdminCategories()
    if (data) {
      setCategories(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name || "",
      description: category.description || "",
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({ name: "", description: "" })
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setFormSubmitting(true)
    let success = false

    if (editingCategory) {
      success = await editCategory(
        {
          categoryId: editingCategory.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
        token
      )
    } else {
      success = await addCategory(
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
        token
      )
    }

    setFormSubmitting(false)

    if (success) {
      handleCloseModal()
      fetchCategories()
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    const success = await removeCategory(categoryId, token)
    if (success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    }
    setConfirmationModal(null)
  }

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-richblack-5">Manage Categories</h1>
          <p className="text-sm text-richblack-400 mt-1">
            Create, view, update, and manage course categories on the platform.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-x-2 rounded-md bg-yellow-50 py-2 px-5 font-semibold text-richblack-900 transition-all duration-200 hover:scale-95"
        >
          <VscAdd className="text-lg" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <VscSearch className="absolute left-3 top-3.5 text-richblack-400 text-lg" />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg bg-richblack-800 py-3 pl-10 pr-4 text-richblack-5 placeholder-richblack-400 outline-none focus:ring-2 focus:ring-yellow-50"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto rounded-xl border border-richblack-800 bg-richblack-900 w-full shadow-lg">
        <table className="w-full text-left text-richblack-100 border-collapse table-auto min-w-[700px]">
          <thead>
            <tr className="border-b border-richblack-800 bg-richblack-800 text-sm font-semibold uppercase text-richblack-200">
              <th className="px-6 py-4 w-[30%]">Category Name</th>
              <th className="px-6 py-4 w-[40%]">Description</th>
              <th className="px-6 py-4 w-[15%] text-center">Courses</th>
              <th className="px-6 py-4 w-[15%] text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-xl font-medium text-richblack-300">
                  {searchTerm ? "No categories matching your search" : "No categories found. Create one!"}
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-richblack-800 hover:bg-richblack-800/50 transition-colors"
                >
                  {/* Category Name */}
                  <td className="px-6 py-4 font-medium text-richblack-5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-richblack-700 p-2 text-yellow-50">
                        <VscFolder className="text-lg" />
                      </div>
                      <span className="text-base font-semibold">{category.name}</span>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 text-sm text-richblack-300">
                    {category.description ? (
                      <p className="line-clamp-2 max-w-md">{category.description}</p>
                    ) : (
                      <span className="italic text-richblack-500">No description provided</span>
                    )}
                  </td>

                  {/* Courses Count */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block rounded-full bg-richblack-700 px-3 py-1 text-xs font-medium text-richblack-100">
                      {Array.isArray(category.courses) ? category.courses.length : 0} courses
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-x-2">
                      <button
                        onClick={() => handleOpenEditModal(category)}
                        title="Edit Category"
                        className="rounded-lg p-2 text-caribbeangreen-300 hover:bg-caribbeangreen-900/40 hover:text-caribbeangreen-100 transition-colors"
                      >
                        <VscEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmationModal({
                            text1: "Delete Category?",
                            text2: `Are you sure you want to delete "${category.name}"? Any linked courses will have their category unassigned.`,
                            btn1Text: "Delete",
                            btn2Text: "Cancel",
                            btn1Handler: () => handleDeleteCategory(category.id),
                            btn2Handler: () => setConfirmationModal(null),
                          })
                        }
                        title="Delete Category"
                        className="rounded-lg p-2 text-pink-300 hover:bg-pink-900/40 hover:text-pink-100 transition-colors"
                      >
                        <VscTrash className="text-xl" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center overflow-auto bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] rounded-xl border border-richblack-700 bg-richblack-800 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-richblack-700 pb-3">
              <h2 className="text-xl font-semibold text-richblack-5">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-richblack-400 hover:text-richblack-5 text-xl"
              >
                <VscClose />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 flex flex-col gap-4">
              <div>
                <label className="text-sm text-richblack-5 font-medium">
                  Category Name <span className="text-pink-200">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Web Development"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-richblack-700 p-3 text-richblack-5 placeholder-richblack-400 outline-none focus:ring-2 focus:ring-yellow-50"
                />
              </div>

              <div>
                <label className="text-sm text-richblack-5 font-medium">Description</label>
                <textarea
                  rows="4"
                  placeholder="Describe the category topics and target learners..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-richblack-700 p-3 text-richblack-5 placeholder-richblack-400 outline-none focus:ring-2 focus:ring-yellow-50 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                  className="rounded-md bg-richblack-700 px-5 py-2 text-sm font-semibold text-richblack-200 hover:bg-richblack-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-md bg-yellow-50 px-5 py-2 text-sm font-semibold text-richblack-900 hover:bg-yellow-100 transition"
                >
                  {formSubmitting
                    ? "Saving..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  )
}

