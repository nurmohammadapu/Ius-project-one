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
  const { token, user } = useSelector((state) => state.auth);

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
  const [creating, setCreating] = useState(false);

  // Active Discussion Modal state
  const [activePost, setActivePost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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
    const res = await createDoubt(
      {
        title: title.trim(),
        description: description.trim(),
        courseId: selectedCourseId || null,
      },
      token
    );
    if (res) {
      setTitle("");
      setDescription("");
      setSelectedCourseId("");
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
    const res = await addComment(
      {
        postId: activePost.id,
        commentText: newComment.trim(),
      },
      token
    );
    if (res) {
      setNewComment("");
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
    if (!window.confirm("Are you sure you want to delete this doubt?")) return;
    const ok = await deleteDoubt(postId, token);
    if (ok) {
      if (activePost?.id === postId) {
        setActivePost(null);
      }
      fetchDoubts();
    }
  };

  return (
    <div className="w-full text-richblack-5">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiMessageSquare className="text-yellow-50" /> Community Doubt Forum
          </h1>
          <p className="text-richblack-300 text-sm mt-1">
            Ask questions, help fellow learners, and discuss lecture topics with instructors and peers.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-50 px-5 py-2.5 text-sm font-bold text-richblack-900 hover:bg-yellow-100 transition shadow"
        >
          <FiPlus className="text-lg" /> Ask a Doubt
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-richblack-900 p-1 rounded-xl border border-richblack-700">
          {(["ALL", "OPEN", "RESOLVED"]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-yellow-50 text-richblack-900 shadow"
                  : "text-richblack-400 hover:text-richblack-100"
              }`}
            >
              {st === "ALL" ? "All Doubts" : st === "OPEN" ? "Open" : "Resolved ✅"}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchDoubts();
          }}
          className="relative w-full sm:w-72"
        >
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-richblack-400 text-sm" />
          <input
            type="text"
            placeholder="Search questions or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-richblack-700 bg-richblack-900 py-2 pl-9 pr-3 text-xs text-white placeholder-richblack-400 focus:outline-none focus:border-yellow-500"
          />
        </form>
      </div>

      {/* Doubts Feed */}
      {loading ? (
        <div className="min-h-[250px] grid place-items-center">
          <div className="spinner"></div>
        </div>
      ) : doubts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-900/50 p-12 text-center max-w-lg mx-auto my-8">
          <FiHelpCircle className="mx-auto text-4xl text-yellow-50 mb-3" />
          <h3 className="text-xl font-bold text-richblack-100">No Doubts Found</h3>
          <p className="text-sm text-richblack-400 mt-2">
            Have a question about a course or programming concept? Be the first to ask!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-xs font-bold text-richblack-900"
          >
            <FiPlus /> Ask a Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((doubt) => {
            const isAuthor = doubt.userId === user?.id;
            const isInstructorOrAdmin = user?.accountType === "Instructor" || user?.accountType === "Admin";
            const isResolved = doubt.status === "RESOLVED";

            return (
              <div
                key={doubt.id}
                className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow hover:border-richblack-600 transition duration-200"
              >
                {/* Author row & status */}
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
                        <span className="font-semibold text-richblack-100 text-sm">
                          {doubt.firstName} {doubt.lastName}
                        </span>
                        {doubt.accountType === "Instructor" && (
                          <span className="rounded bg-yellow-500/20 px-1.5 py-0.2 text-[10px] font-bold text-yellow-50">
                            Instructor
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-richblack-400 flex items-center gap-1">
                        <FiClock className="text-[10px]" />{" "}
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
                      <span className="hidden sm:inline-block rounded-full bg-richblack-900 px-3 py-1 text-xs text-yellow-50 border border-yellow-500/20">
                        {doubt.courseName}
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isResolved
                          ? "bg-caribbeangreen-900/40 text-caribbeangreen-200 border border-caribbeangreen-500/30"
                          : "bg-blue-900/40 text-blue-200 border border-blue-500/30"
                      }`}
                    >
                      {isResolved ? "Resolved ✅" : "Open"}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-richblack-5 mb-2 hover:text-yellow-50 transition cursor-pointer"
                    onClick={() => handleOpenDiscussion(doubt)}>
                  {doubt.title}
                </h3>
                <p className="text-sm text-richblack-300 leading-relaxed mb-4 whitespace-pre-wrap line-clamp-3">
                  {doubt.description}
                </p>

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
                    {(isAuthor || isInstructorOrAdmin) && (
                      <button
                        onClick={() => handleToggleResolve(doubt.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg border transition ${
                          isResolved
                            ? "border-richblack-600 bg-richblack-900 text-richblack-300 hover:text-white"
                            : "border-caribbeangreen-500/40 bg-caribbeangreen-900/20 text-caribbeangreen-200 hover:bg-caribbeangreen-900/40"
                        }`}
                      >
                        {isResolved ? "Reopen" : "Mark as Resolved"}
                      </button>
                    )}

                    {(isAuthor || user?.accountType === "Admin") && (
                      <button
                        onClick={() => handleDelete(doubt.id)}
                        className="p-1.5 text-richblack-400 hover:text-pink-300 transition"
                        title="Delete Post"
                      >
                        <FiTrash2 className="text-sm" />
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
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-richblack-700 bg-richblack-900 p-6 shadow-2xl">
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
                  Description / Code Snippet *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Explain what problem you are facing, what you expected to happen, and paste any error messages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-richblack-700 bg-richblack-800 p-3 text-sm text-white placeholder-richblack-500 focus:outline-none focus:border-yellow-500 resize-y"
                />
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
      {activePost && (
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
                    {activePost.accountType === "Instructor" && (
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

            {/* Post Title & Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-richblack-5 mb-2">{activePost.title}</h2>
              <div className="rounded-xl bg-richblack-800 p-4 border border-richblack-700/70 text-sm text-richblack-200 leading-relaxed whitespace-pre-wrap">
                {activePost.description}
              </div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write your solution or comment here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-xl border border-richblack-700 bg-richblack-800 px-4 py-2.5 text-xs text-white placeholder-richblack-500 focus:outline-none focus:border-yellow-500"
              />
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
      )}
    </div>
  );
}

