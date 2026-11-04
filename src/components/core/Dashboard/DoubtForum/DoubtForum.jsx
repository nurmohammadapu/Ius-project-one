import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiHelpCircle,
  FiClock,
  FiTrash2,
  FiSend,
  FiX,
  FiUser,
  FiImage,
  FiPaperclip,
} from "react-icons/fi";
import {
  getAllDoubts,
  getDoubtDetails,
  createDoubt,
  addComment,
  toggleResolveDoubt,
  deleteDoubt,
} from "../../../../services/operations/doubtAPI";
import { fetchInstructorCourses } from "../../../../services/operations/courseDetailsAPI";
import { getUserEnrolledCourses } from "../../../../services/operations/profileAPI";

export default function DoubtForum() {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  const [doubts, setDoubts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // Active Discussion Modal state
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentMedia, setCommentMedia] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fullscreen Image Lightbox
  const [lightboxImg, setLightboxImg] = useState(null);

  const currentUserId = user?.id || user?._id;

  // 1. Fetch Doubts List
  const fetchDoubts = async () => {
    setLoading(true);
    const filterParams = {};
    if (statusFilter !== "ALL") filterParams.status = statusFilter;
    if (searchQuery.trim()) filterParams.search = searchQuery.trim();

    const res = await getAllDoubts(filterParams, token);
    if (res) {
      setDoubts(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoubts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, token]);

  // 2. Fetch Courses for Doubt Tagging
  useEffect(() => {
    const fetchCoursesList = async () => {
      try {
        if (user?.accountType === "Instructor") {
          const list = await fetchInstructorCourses(token);
          if (list) setCourses(list);
        } else {
          const list = await getUserEnrolledCourses(token);
          if (list) setCourses(list);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (token) fetchCoursesList();
  }, [token, user?.accountType]);

  // 3. Handle Create Doubt
  const handleCreateDoubt = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setCreating(true);
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    if (selectedCourseId) formData.append("courseId", selectedCourseId);
    if (mediaFile) formData.append("media", mediaFile);

    const res = await createDoubt(formData, token);
    if (res) {
      setTitle("");
      setDescription("");
      setSelectedCourseId("");
      setMediaFile(null);
      setIsCreateOpen(false);
      fetchDoubts();
    }
    setCreating(false);
  };

  // 4. Open Discussion Modal & Fetch Comments
  const handleOpenDiscussion = async (post) => {
    setActivePost(post);
    setLoadingComments(true);
    const res = await getDoubtDetails(post.id, token);
    if (res) {
      setActivePost(res.post);
      setComments(res.comments || []);
    }
    setLoadingComments(false);
  };

  // 5. Submit a Comment / Solution
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activePost) return;

    setSubmittingComment(true);
    const formData = new FormData();
    formData.append("postId", activePost.id);
    formData.append("commentText", newComment.trim());
    if (commentMedia) formData.append("media", commentMedia);

    const res = await addComment(formData, token);
    if (res) {
      setNewComment("");
      setCommentMedia(null);
      // Refresh discussion
      const details = await getDoubtDetails(activePost.id, token);
      if (details) {
        setComments(details.comments || []);
      }
      fetchDoubts();
    }
    setSubmittingComment(false);
  };

  // 6. Toggle Status
  const handleToggleResolve = async (postId) => {
    const newStatus = await toggleResolveDoubt(postId, token);
    if (newStatus) {
      if (activePost && activePost.id === postId) {
        setActivePost({ ...activePost, status: newStatus });
      }
      fetchDoubts();
    }
  };

  // 7. Delete Doubt
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this doubt? All discussion comments will be deleted.")) return;
    const ok = await deleteDoubt(postId, token);
    if (ok) {
      if (activePost?.id === postId) {
        setActivePost(null);
      }
      fetchDoubts();
    }
  };

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10 text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-richblack-5 flex items-center gap-3">
            <FiMessageSquare className="text-yellow-50" /> Community Doubt Forum
          </h1>
          <p className="text-sm text-richblack-300 mt-1">
            Ask coding or course doubts, share screenshots, and collaborate with peers & instructors.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-50 px-5 py-2.5 text-sm font-bold text-richblack-900 shadow hover:bg-yellow-100 transition self-start sm:self-auto"
        >
          <FiPlus className="text-lg" /> Ask a Doubt
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-richblack-800 p-4 rounded-2xl border border-richblack-700/80 mb-8 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <FiSearch className="absolute left-3.5 top-3.5 text-richblack-400" />
          <input
            type="text"
            placeholder="Search doubts by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDoubts()}
            className="w-full rounded-xl border border-richblack-700 bg-richblack-900 py-2.5 pl-10 pr-4 text-xs text-white placeholder-richblack-400 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {["ALL", "OPEN", "RESOLVED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                statusFilter === tab
                  ? "bg-yellow-50 text-richblack-900 font-bold shadow"
                  : "bg-richblack-900 text-richblack-300 hover:text-white border border-richblack-700"
              }`}
            >
              {tab === "ALL" && "All Doubts"}
              {tab === "OPEN" && "Open ❓"}
              {tab === "RESOLVED" && "Resolved ✅"}
            </button>
          ))}
        </div>
      </div>

      {/* Doubts Feed */}
      {loading ? (
        <div className="py-20 text-center text-richblack-300">
          <div className="spinner mx-auto mb-3" />
          Loading community discussions...
        </div>
      ) : doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-800/40 p-12 text-center">
          <FiHelpCircle className="mx-auto text-5xl text-richblack-500 mb-3" />
          <h3 className="text-lg font-bold text-richblack-100">No doubts found</h3>
          <p className="text-xs text-richblack-400 max-w-md mx-auto mt-1 mb-5">
            Be the first student to ask a question! Your instructors and peers are ready to help.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl bg-yellow-50 px-4 py-2 text-xs font-bold text-richblack-900"
          >
            Ask a Doubt
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {doubts.map((doubt) => {
            const isAuthor =
              currentUserId &&
              (String(doubt.userId) === String(currentUserId) ||
                String(doubt.author?.id) === String(currentUserId));
            const isInstructorOrAdmin =
              user?.accountType === "Instructor" || user?.accountType === "Admin";
            const canManage = isAuthor || isInstructorOrAdmin;
            const isResolved = doubt.status === "RESOLVED";

            return (
              <div
                key={doubt.id}
                className="rounded-2xl border border-richblack-700/80 bg-richblack-800 p-6 shadow-sm hover:border-richblack-600 transition"
              >
                {/* Author Info & Status Tag */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        doubt.image ||
                        `https://api.dicebear.com/5.x/initials/svg?seed=${doubt.firstName} ${doubt.lastName}`
                      }
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-richblack-100">
                          {doubt.firstName} {doubt.lastName}
                        </span>
                        {isAuthor && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-50">
                            You (Author)
                          </span>
                        )}
                        {doubt.accountType === "Instructor" && !isAuthor && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.2 text-[10px] font-bold text-yellow-50">
                            Instructor
                          </span>
                        )}
                        {doubt.accountType === "Admin" && !isAuthor && (
                          <span className="rounded bg-pink-500/20 px-1.5 py-0.2 text-[10px] font-bold text-pink-200">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-richblack-400">
                        {new Date(doubt.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doubt.courseName && (
                      <span className="hidden sm:inline-block rounded-lg bg-richblack-900 px-2.5 py-1 text-xs font-semibold text-yellow-50 border border-richblack-700">
                        📘 {doubt.courseName}
                      </span>
                    )}

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isResolved
                          ? "bg-caribbeangreen-900/40 text-caribbeangreen-200 border border-caribbeangreen-500/30"
                          : "bg-blue-900/40 text-blue-200 border border-blue-500/30"
                      }`}
                    >
                      {isResolved ? "Resolved ✅" : "Open ❓"}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3
                  className="text-lg font-bold text-richblack-5 mb-2 hover:text-yellow-50 transition cursor-pointer"
                  onClick={() => handleOpenDiscussion(doubt)}
                >
                  {doubt.title}
                </h3>
                <p className="text-sm text-richblack-300 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-3">
                  {doubt.description}
                </p>

                {/* Media Attachment Preview if exists */}
                {doubt.mediaUrl && (
                  <div className="mb-4">
                    <img
                      src={doubt.mediaUrl}
                      alt="Attached doubt screenshot"
                      onClick={() => setLightboxImg(doubt.mediaUrl)}
                      className="max-h-48 rounded-xl border border-richblack-700 object-cover cursor-pointer hover:opacity-90 transition shadow"
                    />
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-richblack-700/60">
                  <button
                    onClick={() => handleOpenDiscussion(doubt)}
                    className="flex items-center gap-1.5 text-xs font-bold text-yellow-50 hover:underline"
                  >
                    <FiMessageSquare className="text-sm" />
                    {doubt.commentsCount || 0} Solutions / Comments
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Resolve / Reopen Button */}
                    {canManage && (
                      <button
                        onClick={() => handleToggleResolve(doubt.id)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                          isResolved
                            ? "border-richblack-500 bg-richblack-700 text-richblack-200 hover:bg-richblack-600 hover:text-white"
                            : "border-caribbeangreen-500 bg-caribbeangreen-900/40 text-caribbeangreen-200 hover:bg-caribbeangreen-900/60"
                        }`}
                      >
                        <FiCheckCircle className="text-sm" />
                        <span>{isResolved ? "Reopen Doubt 🔄" : "Mark Resolved ✅"}</span>
                      </button>
                    )}

                    {/* Delete Button for Author or Admin */}
                    {(isAuthor || user?.accountType === "Admin") && (
                      <button
                        onClick={() => handleDelete(doubt.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-pink-700/60 bg-pink-900/20 text-pink-200 hover:bg-pink-900/50 transition"
                        title="Delete this doubt permanently"
                      >
                        <FiTrash2 className="text-sm text-pink-300" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE DOUBT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-richblack-700 bg-richblack-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-richblack-700">
              <h3 className="text-lg font-bold text-richblack-5 flex items-center gap-2">
                <FiHelpCircle className="text-yellow-50" /> Post a Doubt to Community
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-richblack-400 hover:text-white"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateDoubt} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-richblack-300 mb-1 block">
                  Question Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to prevent infinite re-renders in useEffect?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-richblack-700 bg-richblack-800 p-3 text-sm text-white placeholder-richblack-500 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {courses.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-richblack-300 mb-1 block">
                    Related Course (Optional)
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-xl border border-richblack-700 bg-richblack-800 p-3 text-sm text-richblack-200 focus:outline-none focus:border-yellow-500"
                  >
                    <option value="">-- General / No Specific Course --</option>
                    {courses.map((c) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-richblack-300 mb-1 block">
                  Description / Code Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what problem you are facing, what you expected to happen, and paste any error messages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-richblack-700 bg-richblack-800 p-3 text-sm text-white placeholder-richblack-500 focus:outline-none focus:border-yellow-500 resize-y"
                />
              </div>

              {/* Image / Screenshot Upload Field */}
              <div>
                <label className="text-xs font-semibold text-richblack-300 mb-1 block">
                  Attach Screenshot / Code Image (Optional)
                </label>
                <input
                  type="file"
                  id="doubtImageInput"
                  accept="image/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="doubtImageInput"
                  className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-richblack-600 bg-richblack-800 p-3.5 text-xs text-richblack-300 hover:border-yellow-50 transition"
                >
                  <FiImage className="mr-2 text-yellow-50 text-base" />
                  {mediaFile ? (
                    <span className="text-yellow-50 font-medium truncate max-w-[320px]">
                      Selected: {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  ) : (
                    <span>Click to upload an error screenshot or diagram</span>
                  )}
                </label>
                {mediaFile && (
                  <button
                    type="button"
                    onClick={() => setMediaFile(null)}
                    className="mt-1 text-xxs text-pink-300 hover:underline block"
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-richblack-700">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg bg-richblack-800 px-4 py-2 text-xs font-semibold text-richblack-300 hover:bg-richblack-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-yellow-50 px-5 py-2 text-xs font-bold text-richblack-900 hover:bg-yellow-100 disabled:opacity-50 shadow"
                >
                  {creating ? "Posting..." : "Post Doubt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCUSSION / COMMENTS MODAL */}
      {activePost && (() => {
        const isAuthorActive =
          currentUserId &&
          (String(activePost.userId) === String(currentUserId) ||
            String(activePost.author?.id) === String(currentUserId));
        const isInstructorOrAdmin =
          user?.accountType === "Instructor" || user?.accountType === "Admin";
        const canManageActive = isAuthorActive || isInstructorOrAdmin;
        const isResolvedActive = activePost.status === "RESOLVED";

        return (
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-richblack-700 bg-richblack-900 p-6 shadow-2xl my-8">
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between pb-3 mb-4 border-b border-richblack-700">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      activePost.image ||
                      `https://api.dicebear.com/5.x/initials/svg?seed=${activePost.firstName} ${activePost.lastName}`
                    }
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-richblack-100">
                        {activePost.firstName} {activePost.lastName}
                      </span>
                      {isAuthorActive && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-50">
                          You (Author)
                        </span>
                      )}
                      {activePost.accountType === "Instructor" && !isAuthorActive && (
                        <span className="rounded bg-yellow-500/20 px-1.5 py-0.2 text-[10px] font-bold text-yellow-50">
                          Instructor
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-richblack-400">
                      {new Date(activePost.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActivePost(null)}
                  className="text-richblack-400 hover:text-white"
                >
                  <FiX className="text-2xl" />
                </button>
              </div>

              {/* Modal Management Bar: Status, Resolve, Delete */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-richblack-800/80 p-3 rounded-xl border border-richblack-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-richblack-300">Status:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isResolvedActive
                        ? "bg-caribbeangreen-900/40 text-caribbeangreen-200 border border-caribbeangreen-500/30"
                        : "bg-blue-900/40 text-blue-200 border border-blue-500/30"
                    }`}
                  >
                    {isResolvedActive ? "Resolved ✅" : "Open ❓"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canManageActive && (
                    <button
                      onClick={() => handleToggleResolve(activePost.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                        isResolvedActive
                          ? "border-richblack-500 bg-richblack-700 text-richblack-200 hover:bg-richblack-600 hover:text-white"
                          : "border-caribbeangreen-500 bg-caribbeangreen-900/40 text-caribbeangreen-200 hover:bg-caribbeangreen-900/60"
                      }`}
                    >
                      <FiCheckCircle className="text-sm" />
                      <span>{isResolvedActive ? "Reopen Doubt 🔄" : "Mark as Resolved ✅"}</span>
                    </button>
                  )}

                  {(isAuthorActive || user?.accountType === "Admin") && (
                    <button
                      onClick={() => handleDelete(activePost.id)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-pink-700/60 bg-pink-900/20 text-pink-200 hover:bg-pink-900/50 transition"
                      title="Delete this doubt"
                    >
                      <FiTrash2 className="text-sm text-pink-300" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Post Title & Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-richblack-5 mb-2">{activePost.title}</h2>
                <div className="rounded-xl bg-richblack-800 p-4 border border-richblack-700/70 text-sm text-richblack-200 leading-relaxed whitespace-pre-wrap">
                  {activePost.description}
                </div>

                {/* Post Attached Media Image */}
                {activePost.mediaUrl && (
                  <div className="mt-3">
                    <img
                      src={activePost.mediaUrl}
                      alt="Post Screenshot"
                      onClick={() => setLightboxImg(activePost.mediaUrl)}
                      className="max-h-72 rounded-xl border border-richblack-700 object-contain bg-black/40 cursor-pointer hover:opacity-95 transition"
                    />
                  </div>
                )}
              </div>

              {/* Solutions & Comments Section */}
              <div className="border-t border-richblack-700 pt-4 mb-6">
                <h4 className="text-sm font-bold text-richblack-100 mb-4 flex items-center gap-2">
                  <FiMessageSquare className="text-yellow-50" /> Solutions & Comments ({comments.length})
                </h4>

                {loadingComments ? (
                  <div className="py-8 text-center text-xs text-richblack-400">Loading discussion...</div>
                ) : comments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-richblack-700 p-6 text-center text-xs text-richblack-400">
                    No replies yet. Share your solution or advice below!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="rounded-xl border border-richblack-700/80 bg-richblack-800/80 p-3.5"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                comm.image ||
                                `https://api.dicebear.com/5.x/initials/svg?seed=${comm.firstName} ${comm.lastName}`
                              }
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-semibold text-richblack-100">
                              {comm.firstName} {comm.lastName}
                            </span>
                            {comm.accountType === "Instructor" && (
                              <span className="rounded bg-caribbeangreen-900/40 text-caribbeangreen-200 text-[9px] font-bold px-1.5 py-0.2 border border-caribbeangreen-500/30">
                                Instructor
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-richblack-500">
                            {new Date(comm.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-richblack-200 leading-relaxed whitespace-pre-wrap pl-8">
                          {comm.commentText}
                        </p>

                        {/* Comment Media if exists */}
                        {comm.mediaUrl && (
                          <div className="pl-8 mt-2">
                            <img
                              src={comm.mediaUrl}
                              alt="Comment screenshot"
                              onClick={() => setLightboxImg(comm.mediaUrl)}
                              className="max-h-40 rounded-lg border border-richblack-700 object-contain cursor-pointer hover:opacity-90 transition"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Comment Input */}
              <div>
                {commentMedia && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-richblack-800 px-3 py-1.5 border border-yellow-50/40 text-xs text-yellow-50">
                    <span className="truncate max-w-[280px]">
                      Attached: {commentMedia.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCommentMedia(null)}
                      className="text-pink-300 hover:text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Write your solution or comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border border-richblack-700 bg-richblack-800 px-4 py-2.5 text-xs text-white placeholder-richblack-500 focus:outline-none focus:border-yellow-500"
                  />

                  <input
                    type="file"
                    id="commentMediaInput"
                    accept="image/*"
                    onChange={(e) => setCommentMedia(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="commentMediaInput"
                    className="cursor-pointer rounded-xl bg-richblack-800 border border-richblack-700 p-2.5 text-richblack-300 hover:text-yellow-50 hover:border-yellow-50 transition"
                    title="Attach screenshot to reply"
                  >
                    <FiPaperclip className="text-sm" />
                  </label>

                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-yellow-50 px-4 py-2.5 text-xs font-bold text-richblack-900 hover:bg-yellow-100 disabled:opacity-50 shadow"
                  >
                    <FiSend /> Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Modal for Full Image View */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[1200] grid place-items-center bg-black/90 p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:text-yellow-50"
            >
              <FiX />
            </button>
            <img
              src={lightboxImg}
              alt="Fullscreen Preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
