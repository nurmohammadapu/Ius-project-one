import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiAward, FiUsers, FiClock, FiCheckCircle, FiChevronDown, FiInfo, FiSearch } from "react-icons/fi";
import { getStudentExams, getExamLeaderboard } from "../../../../services/operations/examAPI";

export default function LeaderboardPage() {
  const { token, user } = useSelector((state) => state.auth);

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Fetch available student exams
  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      const res = await getStudentExams(token);
      if (res && res.length > 0) {
        setExams(res);
        setSelectedExamId(res[0].id);
      }
      setLoadingExams(false);
    };

    fetchExams();
  }, [token]);

  // 2. Fetch Leaderboard when selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) return;

    const fetchBoard = async () => {
      setLoadingLeaderboard(true);
      const res = await getExamLeaderboard(selectedExamId, token);
      if (res) {
        setLeaderboardData(res);
      }
      setLoadingLeaderboard(false);
    };

    fetchBoard();
  }, [selectedExamId, token]);

  const exam = leaderboardData?.exam;
  const list = leaderboardData?.leaderboard || [];
  const top1 = list[0];
  const top2 = list[1];
  const top3 = list[2];

  const filteredList = list.filter((item) =>
    `${item.firstName} ${item.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full text-richblack-5">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏆</span> Exam Leaderboard
          </h1>
          <p className="text-richblack-300 text-sm mt-1">
            Real-time rankings and top performers for your course exams.
          </p>
        </div>

        {/* Exam Selector Dropdown */}
        {exams.length > 0 && (
          <div className="relative min-w-[280px]">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-richblack-700 bg-richblack-800 px-4 py-2.5 pr-10 text-sm font-medium text-richblack-100 focus:outline-none focus:border-yellow-500 cursor-pointer shadow"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-richblack-900 text-white">
                  {ex.title} ({ex.courseName || "Course Exam"})
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-richblack-400 text-lg" />
          </div>
        )}
      </div>

      {/* Main Body */}
      {loadingExams ? (
        <div className="min-h-[250px] grid place-items-center">
          <div className="spinner"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-900/50 p-12 text-center max-w-lg mx-auto my-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-richblack-800 text-yellow-50 text-3xl">
            🏆
          </div>
          <h3 className="text-xl font-bold text-richblack-100">No Exams Available</h3>
          <p className="text-sm text-richblack-400 mt-2">
            Enroll in courses to participate in exams and view live leaderboard standings.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exam Summary Cards */}
          {exam && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                <p className="text-xs text-richblack-400">Total Marks</p>
                <p className="text-xl font-bold text-yellow-50">{exam.totalMarks}</p>
              </div>
              <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                <p className="text-xs text-richblack-400">Participants</p>
                <p className="text-xl font-bold text-caribbeangreen-200">
                  {leaderboardData?.totalParticipants || 0}
                </p>
              </div>
              <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                <p className="text-xs text-richblack-400">Exam Type</p>
                <p className="text-xl font-bold text-blue-200">{exam.examType}</p>
              </div>
              <div className="rounded-xl border border-richblack-700 bg-richblack-800 p-4">
                <p className="text-xs text-richblack-400">Your Rank</p>
                <p className="text-xl font-bold text-yellow-50">
                  {leaderboardData?.userRank ? `#${leaderboardData.userRank}` : "Not Ranked"}
                </p>
              </div>
            </div>
          )}

          {/* Academic Integrity Callout */}
          <div className="flex items-center gap-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-xs text-yellow-100">
            <FiInfo className="text-base text-yellow-50 flex-shrink-0" />
            <span>
              <strong>Leaderboard Rule:</strong> Only your 1st official submission is counted toward the leaderboard. Retaking in Practice Mode lets you practice freely without altering your official rank.
            </span>
          </div>

          {loadingLeaderboard ? (
            <div className="min-h-[250px] grid place-items-center">
              <div className="spinner"></div>
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-richblack-700 bg-richblack-800/60 p-12 text-center">
              <p className="text-richblack-300">No student submissions recorded for this exam yet.</p>
              <p className="text-xs text-richblack-500 mt-1">Be the first to complete the exam and claim 1st place!</p>
            </div>
          ) : (
            <>
              {/* Podium Section (Top 3) */}
              <div className="rounded-2xl border border-richblack-700 bg-gradient-to-b from-richblack-800 to-richblack-900 p-6 shadow-xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-richblack-400 text-center mb-6">
                  Top Performers Podium
                </h3>

                <div className="grid grid-cols-3 gap-3 md:gap-6 items-end max-w-xl mx-auto pt-4">
                  {/* Rank 2 (Silver) */}
                  <div className="flex flex-col items-center">
                    {top2 ? (
                      <>
                        <div className="relative mb-2">
                          <img
                            src={top2.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top2.firstName} ${top2.lastName}`}
                            alt="Top 2"
                            className="h-14 w-14 md:h-16 md:w-16 rounded-full border-2 border-slate-300 object-cover shadow-lg"
                          />
                          <span className="absolute -bottom-2 -right-1 text-2xl">🥈</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-center line-clamp-1 text-richblack-100">
                          {top2.firstName} {top2.lastName}
                        </p>
                        <p className="text-xs text-yellow-50 font-semibold">{top2.obtainedMarks} pts</p>
                        <div className="w-full h-20 md:h-24 rounded-t-xl bg-slate-500/20 border-t-2 border-slate-400 flex items-center justify-center mt-2">
                          <span className="text-xl md:text-2xl font-black text-slate-300">#2</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-28 w-full border border-dashed border-richblack-700 rounded-xl flex items-center justify-center text-richblack-600 text-xs">
                        Empty
                      </div>
                    )}
                  </div>

                  {/* Rank 1 (Gold) */}
                  <div className="flex flex-col items-center -mt-6">
                    {top1 && (
                      <>
                        <div className="relative mb-2">
                          <img
                            src={top1.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top1.firstName} ${top1.lastName}`}
                            alt="Top 1"
                            className="h-16 w-16 md:h-20 md:w-20 rounded-full border-4 border-yellow-400 object-cover shadow-xl ring-4 ring-yellow-400/20"
                          />
                          <span className="absolute -bottom-2 -right-1 text-3xl">🥇</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-center line-clamp-1 text-yellow-50">
                          {top1.firstName} {top1.lastName}
                        </p>
                        <p className="text-xs font-bold text-caribbeangreen-200">{top1.obtainedMarks} pts</p>
                        <div className="w-full h-28 md:h-32 rounded-t-xl bg-yellow-500/20 border-t-4 border-yellow-400 flex items-center justify-center mt-2 shadow-lg">
                          <span className="text-2xl md:text-3xl font-black text-yellow-50">#1</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rank 3 (Bronze) */}
                  <div className="flex flex-col items-center">
                    {top3 ? (
                      <>
                        <div className="relative mb-2">
                          <img
                            src={top3.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top3.firstName} ${top3.lastName}`}
                            alt="Top 3"
                            className="h-14 w-14 md:h-16 md:w-16 rounded-full border-2 border-amber-600 object-cover shadow-lg"
                          />
                          <span className="absolute -bottom-2 -right-1 text-2xl">🥉</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-center line-clamp-1 text-richblack-100">
                          {top3.firstName} {top3.lastName}
                        </p>
                        <p className="text-xs text-yellow-50 font-semibold">{top3.obtainedMarks} pts</p>
                        <div className="w-full h-16 md:h-20 rounded-t-xl bg-amber-600/20 border-t-2 border-amber-600 flex items-center justify-center mt-2">
                          <span className="text-lg md:text-xl font-black text-amber-500">#3</span>
                        </div>
                      </>
                    ) : (
                      <div className="h-28 w-full border border-dashed border-richblack-700 rounded-xl flex items-center justify-center text-richblack-600 text-xs">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Leaderboard Table */}
              <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                  <h3 className="text-base font-bold text-richblack-100">All Participants Ranking</h3>
                  <div className="relative w-full sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-richblack-400" />
                    <input
                      type="text"
                      placeholder="Search participant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-richblack-700 bg-richblack-900 py-1.5 pl-9 pr-3 text-xs text-white placeholder-richblack-400 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-richblack-700 text-xs uppercase text-richblack-400 bg-richblack-900/40">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Percentage</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-richblack-700/60">
                      {filteredList.map((row) => {
                        const isCurrentUser = row.studentId === user?.id;
                        const percentage = Math.round((row.obtainedMarks / (exam?.totalMarks || 100)) * 100);

                        return (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              isCurrentUser
                                ? "bg-yellow-500/10 font-semibold"
                                : "hover:bg-richblack-700/40"
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3 px-4">
                              {row.rank === 1 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-yellow-50">
                                  🥇 #1
                                </span>
                              ) : row.rank === 2 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-slate-300">
                                  🥈 #2
                                </span>
                              ) : row.rank === 3 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                  🥉 #3
                                </span>
                              ) : (
                                <span className="text-richblack-400 font-mono">#{row.rank}</span>
                              )}
                            </td>

                            {/* Student */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={
                                    row.image ||
                                    `https://api.dicebear.com/5.x/initials/svg?seed=${row.firstName} ${row.lastName}`
                                  }
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                                <div>
                                  <p className="text-richblack-100 flex items-center gap-1.5">
                                    {row.firstName} {row.lastName}
                                    {isCurrentUser && (
                                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-50">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Score */}
                            <td className="py-3 px-4 text-center font-bold text-yellow-50">
                              {row.obtainedMarks} <span className="text-xs text-richblack-400">/ {exam?.totalMarks}</span>
                            </td>

                            {/* Percentage */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  percentage >= 80
                                    ? "bg-caribbeangreen-900/40 text-caribbeangreen-200"
                                    : percentage >= 50
                                    ? "bg-yellow-900/40 text-yellow-200"
                                    : "bg-pink-900/40 text-pink-200"
                                }`}
                              >
                                {percentage}%
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                  row.status === "PASSED"
                                    ? "bg-caribbeangreen-800 text-caribbeangreen-100"
                                    : row.status === "FAILED"
                                    ? "bg-pink-800 text-pink-100"
                                    : "bg-richblack-700 text-richblack-200"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>

                            {/* Submitted Date */}
                            <td className="py-3 px-4 text-right text-xs text-richblack-400">
                              {new Date(row.submittedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

