import React, { useEffect, useState } from "react";
import { FiAward, FiX, FiUser, FiCheckCircle, FiClock } from "react-icons/fi";
import { FaCrown, FaMedal } from "react-icons/fa";
import { getExamLeaderboard } from "../../../../services/operations/examAPI";
import { useSelector } from "react-redux";

export default function LeaderboardModal({ examId, examTitle, onClose }) {
  const { token, user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const res = await getExamLeaderboard(examId, token);
      if (res) {
        setData(res);
      }
      setLoading(false);
    };

    if (examId) {
      fetchLeaderboard();
    }
  }, [examId, token]);

  const leaderboard = data?.leaderboard || [];
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white/10 backdrop-blur-sm p-4">
      <div className="w-11/12 max-w-[700px] rounded-2xl border border-richblack-700 bg-richblack-800 p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-50">
              <FiAward className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-richblack-5">Exam Leaderboard</h2>
              <p className="text-xs text-richblack-300">
                {data?.exam?.title || examTitle || "Leaderboard"} • Total Marks: {data?.exam?.totalMarks || 100}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-richblack-400 hover:bg-richblack-700 hover:text-richblack-5 transition-all"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center text-richblack-300">
            <div className="spinner">Loading Leaderboard...</div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="py-12 text-center text-richblack-400">
            <FiClock className="mx-auto text-4xl mb-2 text-richblack-500" />
            <p className="text-base font-medium">No official submissions recorded yet.</p>
            <p className="text-xs text-richblack-400 mt-1">Be the first student to take this exam and claim Rank #1!</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Current Student's Rank Banner */}
            {data?.userRank && (
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border border-yellow-500/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-50 text-xs font-bold text-richblack-900">
                    #{data.userRank}
                  </span>
                  <span className="text-sm font-semibold text-richblack-5">Your Current Ranking</span>
                </div>
                <span className="text-xs text-yellow-50 font-medium">
                  Out of {data.totalParticipants} {data.totalParticipants === 1 ? "participant" : "participants"}
                </span>
              </div>
            )}

            {/* Podium for Top 3 */}
            {leaderboard.length >= 2 && (
              <div className="flex items-end justify-center gap-4 pt-4 pb-2">
                {/* 2nd Place */}
                {top2 && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <img
                        src={top2.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top2.firstName} ${top2.lastName}`}
                        alt="2nd"
                        className="h-14 w-14 rounded-full border-2 border-slate-400 object-cover"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-richblack-900">
                        2
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-richblack-100 max-w-[80px] truncate text-center">
                      {top2.firstName}
                    </span>
                    <span className="text-xs font-bold text-slate-300">{top2.obtainedMarks} pts</span>
                    <div className="mt-2 h-16 w-20 rounded-t-lg bg-slate-700/60 flex items-center justify-center border-t-2 border-slate-400">
                      <FaMedal className="text-slate-300 text-lg" />
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {top1 && (
                  <div className="flex flex-col items-center">
                    <FaCrown className="text-yellow-50 text-xl mb-1 animate-bounce" />
                    <div className="relative mb-2">
                      <img
                        src={top1.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top1.firstName} ${top1.lastName}`}
                        alt="1st"
                        className="h-18 w-18 rounded-full border-4 border-yellow-50 object-cover shadow-lg shadow-yellow-500/20"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50 text-xs font-bold text-richblack-900">
                        1
                      </span>
                    </div>
                    <span className="text-sm font-bold text-yellow-50 max-w-[100px] truncate text-center">
                      {top1.firstName} {top1.lastName}
                    </span>
                    <span className="text-xs font-bold text-richblack-5">{top1.obtainedMarks} pts</span>
                    <div className="mt-2 h-24 w-24 rounded-t-lg bg-yellow-500/20 flex items-center justify-center border-t-4 border-yellow-50">
                      <FaMedal className="text-yellow-50 text-2xl" />
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {top3 && (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-2">
                      <img
                        src={top3.image || `https://api.dicebear.com/5.x/initials/svg?seed=${top3.firstName} ${top3.lastName}`}
                        alt="3rd"
                        className="h-14 w-14 rounded-full border-2 border-amber-600 object-cover"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-richblack-900">
                        3
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-richblack-100 max-w-[80px] truncate text-center">
                      {top3.firstName}
                    </span>
                    <span className="text-xs font-bold text-amber-500">{top3.obtainedMarks} pts</span>
                    <div className="mt-2 h-12 w-20 rounded-t-lg bg-amber-900/40 flex items-center justify-center border-t-2 border-amber-600">
                      <FaMedal className="text-amber-500 text-base" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Ranking List */}
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-richblack-700 bg-richblack-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-richblack-800 text-richblack-300 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 text-center w-16">Rank</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-richblack-800">
                  {leaderboard.map((item) => {
                    const isCurrentUser = item.studentId === user?._id || item.studentId === user?.id;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? "bg-yellow-500/15 font-semibold text-yellow-50"
                            : "hover:bg-richblack-800/50 text-richblack-100"
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {item.rank === 1 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50 text-richblack-900 font-bold">
                              1
                            </span>
                          ) : item.rank === 2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-richblack-900 font-bold">
                              2
                            </span>
                          ) : item.rank === 3 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-richblack-900 font-bold">
                              3
                            </span>
                          ) : (
                            <span className="text-richblack-400 font-medium">#{item.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.image || `https://api.dicebear.com/5.x/initials/svg?seed=${item.firstName} ${item.lastName}`}
                              alt=""
                              className="h-7 w-7 rounded-full object-cover border border-richblack-700"
                            />
                            <span className="font-medium text-richblack-5">
                              {item.firstName} {item.lastName} {isCurrentUser && <span className="text-yellow-50 text-[10px] ml-1">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-richblack-5">
                          {item.obtainedMarks} / {data?.exam?.totalMarks || 100}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === "PASSED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-pink-900/20 text-pink-400 border border-pink-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-richblack-400">
                          {new Date(item.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-richblack-400 text-center italic">
              * Rankings are calculated from the first official submission. Subsequent retakes in practice mode do not affect leaderboard rankings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

