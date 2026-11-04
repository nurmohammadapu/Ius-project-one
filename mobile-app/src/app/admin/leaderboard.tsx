import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "../../navigation/navigationShim";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import { getAllExamsAdmin, getExamLeaderboard } from "../../services/operations/examAPI";

export default function AdminLeaderboardScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      const res = await getAllExamsAdmin(token);
      if (res && res.length > 0) {
        setExams(res);
        setSelectedExamId(res[0].id);
      }
      setLoadingExams(false);
    };

    if (token) {
      fetchExams();
    }
  }, [token]);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchBoard = async () => {
      setLoadingBoard(true);
      const res = await getExamLeaderboard(selectedExamId, token);
      if (res) {
        setLeaderboardData(res);
      }
      setLoadingBoard(false);
    };

    fetchBoard();
  }, [selectedExamId, token]);

  const selectedExamMeta = exams.find((e) => e.id === selectedExamId);
  const exam = leaderboardData?.exam;
  const list = leaderboardData?.leaderboard || [];
  const top1 = list[0];
  const top2 = list[1];
  const top3 = list[2];

  const totalPlatformSubmissions = exams.reduce((sum, e) => sum + (Number(e.submissionCount) || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            Platform Leaderboards
          </Text>
        </View>
        <View className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-50/20">
          <Text className="text-yellow-50 text-xxs font-bold">{exams.length} Exams</Text>
        </View>
      </View>

      {loadingExams ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : exams.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="trophy-outline" size={48} color="#838894" />
          <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5 text-center mt-3">
            No Exams in Platform
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Exam Horizontal Scroll Selector */}
          <Text className="text-xs text-richblack-500 dark:text-richblack-400 font-semibold mb-2 uppercase">
            Select Platform Exam
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {exams.map((ex) => {
              const isSelected = ex.id === selectedExamId;
              return (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => setSelectedExamId(ex.id)}
                  className={`mr-2.5 px-3.5 py-2 rounded-xl border ${
                    isSelected
                      ? "bg-yellow-50 border-yellow-50"
                      : "bg-white dark:bg-richblack-800 border-pure-greys-25 dark:border-richblack-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-richblack-900" : "text-richblack-700 dark:text-richblack-200"
                    }`}
                  >
                    {ex.title}
                  </Text>
                  <Text
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? "text-richblack-800" : "text-richblack-400"
                    }`}
                  >
                    {ex.courseName || "General"} • {ex.instructorFirstName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Metrics */}
          <View className="flex-row space-x-2 mb-4">
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400">Platform Subs</Text>
              <Text className="text-base font-bold text-emerald-400 mt-0.5">
                {totalPlatformSubmissions}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400">Exam Subs</Text>
              <Text className="text-base font-bold text-yellow-50 mt-0.5">
                {leaderboardData?.totalParticipants || 0}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-richblack-800 p-3 rounded-xl border border-pure-greys-25 dark:border-richblack-700 items-center">
              <Text className="text-[10px] text-richblack-400">Exam Avg</Text>
              <Text className="text-base font-bold text-blue-400 mt-0.5">
                {selectedExamMeta?.avgMarks || 0} pts
              </Text>
            </View>
          </View>

          {loadingBoard ? (
            <View className="py-12 justify-center items-center">
              <ActivityIndicator size="small" color="#FFD60A" />
            </View>
          ) : list.length === 0 ? (
            <View className="bg-white dark:bg-richblack-800 p-8 rounded-2xl border border-pure-greys-25 dark:border-richblack-700 items-center my-4">
              <Text className="text-sm font-semibold text-richblack-600 dark:text-richblack-300">
                No students have taken this exam yet.
              </Text>
            </View>
          ) : (
            <>
              {/* Podium Top 3 */}
              <View className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-2xl p-4 mb-4 shadow">
                <Text className="text-xs uppercase font-bold text-richblack-400 text-center mb-4">
                  Top 3 Performers Podium
                </Text>
                <View className="flex-row items-end justify-around pt-2">
                  {/* Rank 2 (Silver) */}
                  <View className="items-center flex-1">
                    {top2 ? (
                      <>
                        <Image
                          source={{
                            uri:
                              top2.image ||
                              `https://api.dicebear.com/5.x/initials/svg?seed=${top2.firstName} ${top2.lastName}`,
                          }}
                          style={{ width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: "#CBD5E1" }}
                        />
                        <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-100 mt-1" numberOfLines={1}>
                          {top2.firstName}
                        </Text>
                        <Text className="text-[10px] text-yellow-50 font-bold">{top2.obtainedMarks} pts</Text>
                        <View className="w-16 h-12 bg-slate-400/20 rounded-t-lg items-center justify-center mt-1 border-t-2 border-slate-300">
                          <Text className="text-sm font-black text-slate-300">🥈 #2</Text>
                        </View>
                      </>
                    ) : (
                      <View className="w-16 h-12 bg-richblack-700/20 rounded-t-lg items-center justify-center">
                        <Text className="text-[10px] text-richblack-500">—</Text>
                      </View>
                    )}
                  </View>

                  {/* Rank 1 (Gold) */}
                  <View className="items-center flex-1 -mt-4">
                    {top1 && (
                      <>
                        <Image
                          source={{
                            uri:
                              top1.image ||
                              `https://api.dicebear.com/5.x/initials/svg?seed=${top1.firstName} ${top1.lastName}`,
                          }}
                          style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "#FFD60A" }}
                        />
                        <Text className="text-xs font-bold text-yellow-50 mt-1" numberOfLines={1}>
                          {top1.firstName}
                        </Text>
                        <Text className="text-[11px] text-emerald-400 font-extrabold">{top1.obtainedMarks} pts</Text>
                        <View className="w-20 h-16 bg-yellow-500/20 rounded-t-xl items-center justify-center mt-1 border-t-4 border-yellow-400">
                          <Text className="text-base font-black text-yellow-50">🥇 #1</Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Rank 3 (Bronze) */}
                  <View className="items-center flex-1">
                    {top3 ? (
                      <>
                        <Image
                          source={{
                            uri:
                              top3.image ||
                              `https://api.dicebear.com/5.x/initials/svg?seed=${top3.firstName} ${top3.lastName}`,
                          }}
                          style={{ width: 45, height: 45, borderRadius: 23, borderWidth: 2, borderColor: "#D97706" }}
                        />
                        <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-100 mt-1" numberOfLines={1}>
                          {top3.firstName}
                        </Text>
                        <Text className="text-[10px] text-yellow-50 font-bold">{top3.obtainedMarks} pts</Text>
                        <View className="w-16 h-10 bg-amber-600/20 rounded-t-lg items-center justify-center mt-1 border-t-2 border-amber-600">
                          <Text className="text-xs font-black text-amber-500">🥉 #3</Text>
                        </View>
                      </>
                    ) : (
                      <View className="w-16 h-10 bg-richblack-700/20 rounded-t-lg items-center justify-center">
                        <Text className="text-[10px] text-richblack-500">—</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Participant Ranking List */}
              <View className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-2xl p-4 shadow mb-8">
                <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-3">
                  All Participants ({list.length})
                </Text>

                {list.map((row: any) => {
                  const percent = Math.round((row.obtainedMarks / (exam?.totalMarks || 100)) * 100);

                  return (
                    <View
                      key={row.id}
                      className="flex-row items-center justify-between py-2.5 border-b border-pure-greys-25 dark:border-richblack-700/60 last:border-0"
                    >
                      <View className="flex-row items-center flex-1 mr-2">
                        {/* Rank Badge */}
                        <View className="w-8 items-center mr-2">
                          {row.rank === 1 ? (
                            <Text className="text-base font-bold">🥇</Text>
                          ) : row.rank === 2 ? (
                            <Text className="text-base font-bold">🥈</Text>
                          ) : row.rank === 3 ? (
                            <Text className="text-base font-bold">🥉</Text>
                          ) : (
                            <Text className="text-xs font-mono font-bold text-richblack-400">#{row.rank}</Text>
                          )}
                        </View>

                        <Image
                          source={{
                            uri:
                              row.image ||
                              `https://api.dicebear.com/5.x/initials/svg?seed=${row.firstName} ${row.lastName}`,
                          }}
                          style={{ width: 34, height: 34, borderRadius: 17 }}
                          className="mr-2.5"
                        />

                        <View className="flex-1">
                          <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-100" numberOfLines={1}>
                            {row.firstName} {row.lastName}
                          </Text>
                          <Text className="text-[10px] text-richblack-400 mt-0.5">
                            {row.status} • {percent}%
                          </Text>
                        </View>
                      </View>

                      {/* Marks */}
                      <View className="items-end">
                        <Text className="text-xs font-bold text-yellow-50">
                          {row.obtainedMarks}{" "}
                          <Text className="text-[10px] text-richblack-400 font-normal">/ {exam?.totalMarks}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

