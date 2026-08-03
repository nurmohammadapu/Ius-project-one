import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import * as ImagePicker from "expo-image-picker";
import { getStudentExams, submitExam } from "../services/operations/examAPI";

export default function MyExamsScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const { autoTakeExamId } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "not-taken" | "pending" | "completed">("all");

  // Player state
  const [activeExam, setActiveExam] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    const res = await getStudentExams(token);
    if (res) {
      setExams(res);
      if (autoTakeExamId) {
        const found = res.find((e: any) => e.id === autoTakeExamId);
        if (found) {
          setActiveExam(found);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchExams();
    }
  }, [token]);

  const selectImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow access to gallery to upload written exam.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleClosePlayer = () => {
    setActiveExam(null);
    setSelectedAnswers({});
    setSelectedImage(null);
    fetchExams();
  };

  const handleSubmitMCQ = async () => {
    if (!activeExam) return;
    const unansweredCount = activeExam.questions.length - Object.keys(selectedAnswers).length;
    if (unansweredCount > 0) {
      Alert.alert(
        "Unanswered Questions",
        `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit",
            onPress: async () => {
              setSubmitting(true);
              const res = await submitExam({ examId: activeExam.id, answers: selectedAnswers }, token);
              setSubmitting(false);
              if (res) {
                Alert.alert(
                  "Exam Graded 🏆",
                  `Obtained Marks: ${res.obtainedMarks}/${activeExam.totalMarks}\nStatus: ${res.status}`
                );
                handleClosePlayer();
              }
            },
          },
        ]
      );
    } else {
      setSubmitting(true);
      const res = await submitExam({ examId: activeExam.id, answers: selectedAnswers }, token);
      setSubmitting(false);
      if (res) {
        Alert.alert(
          "Exam Graded 🏆",
          `Obtained Marks: ${res.obtainedMarks}/${activeExam.totalMarks}\nStatus: ${res.status}`
        );
        handleClosePlayer();
      }
    }
  };

  const handleSubmitWritten = async () => {
    if (!activeExam || !selectedImage) {
      Alert.alert("Error", "Please select a photo of your written sheet.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("examId", activeExam.id);
      
      const fileObj: any = {
        uri: selectedImage,
        name: selectedImage.split("/").pop() || "submission.jpg",
        type: "image/jpeg",
      };
      formData.append("submissionFile", fileObj);

      const res = await submitExam(formData, token, true);
      if (res) {
        handleClosePlayer();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter list
  const filteredExams = exams.filter((exam) => {
    const hasSubmitted = !!exam.submission;
    const status = exam.submission?.status;

    if (filter === "not-taken") return !hasSubmitted;
    if (filter === "pending") return hasSubmitted && status === "PENDING";
    if (filter === "completed") return hasSubmitted && status !== "PENDING";
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            My Exams
          </Text>
        </View>
        <View className="bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-50/20">
          <Text className="text-yellow-50 text-xxs font-bold">{exams.length} Total</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-pure-greys-25 dark:border-richblack-800 bg-white dark:bg-richblack-900 px-2">
        {(["all", "not-taken", "pending", "completed"] as const).map((tab) => {
          const label =
            tab === "all"
              ? "All"
              : tab === "not-taken"
              ? "Not Taken"
              : tab === "pending"
              ? "Pending"
              : "Graded";

          const count =
            tab === "all"
              ? exams.length
              : tab === "not-taken"
              ? exams.filter((e) => !e.submission).length
              : tab === "pending"
              ? exams.filter((e) => e.submission?.status === "PENDING").length
              : exams.filter((e) => e.submission && e.submission?.status !== "PENDING").length;

          const isSelected = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              className="flex-1 py-3 items-center border-b-2"
              style={{ borderBottomColor: isSelected ? "#FFD60A" : "transparent" }}
            >
              <Text
                className={`text-xs font-semibold ${
                  isSelected ? "text-yellow-50 font-bold" : "text-richblack-500 dark:text-richblack-300"
                }`}
              >
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : filteredExams.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="clipboard-outline" size={48} color="#838894" />
          <Text className="text-richblack-900 dark:text-richblack-300 text-sm mt-3 text-center">
            No exams match the selected filter.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {filteredExams.map((exam) => {
            const hasSubmitted = !!exam.submission;
            const submission = exam.submission;
            const isPassed = submission?.status === "PASSED";
            const isPending = submission?.status === "PENDING";

            return (
              <View
                key={exam.id}
                className="bg-white dark:bg-richblack-800 p-4 border border-pure-greys-25 dark:border-richblack-700 rounded-xl mb-4"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-50/20">
                    <Text className="text-yellow-50 text-[10px] font-bold uppercase">{exam.examType}</Text>
                  </View>
                  <Text className="text-xxs text-richblack-500 dark:text-richblack-300">{exam.level}</Text>
                </View>

                <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5">
                  {exam.title}
                </Text>
                <Text className="text-xs text-yellow-50 font-semibold mt-1">Course: {exam.courseName}</Text>
                {exam.description && (
                  <Text className="text-xs text-richblack-700 dark:text-richblack-300 mt-2 italic" numberOfLines={2}>
                    "{exam.description}"
                  </Text>
                )}

                <View className="border-t border-pure-greys-25 dark:border-richblack-700 mt-4 pt-3.5 flex-row justify-between items-center">
                  <Text className="text-xs text-richblack-900 dark:text-richblack-300">
                    Total Marks: <Text className="font-bold dark:text-white">{exam.totalMarks}</Text>
                  </Text>

                  {hasSubmitted ? (
                    isPending ? (
                      <View className="bg-yellow-500/10 border border-yellow-50/20 px-3 py-1.5 rounded-lg">
                        <Text className="text-yellow-50 text-xs font-bold">Pending Grading</Text>
                      </View>
                    ) : (
                      <View
                        className={`px-3 py-1.5 rounded-lg flex-row items-center ${
                          isPassed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-pink-500/10 border border-pink-500/20"
                        }`}
                      >
                        <Ionicons
                          name={isPassed ? "checkmark-circle" : "alert-circle"}
                          size={14}
                          color={isPassed ? "#10B981" : "#EF4444"}
                        />
                        <Text className={`text-xs font-bold ml-1 ${isPassed ? "text-emerald-400" : "text-pink-400"}`}>
                          Result: {submission.obtainedMarks}/{exam.totalMarks}
                        </Text>
                      </View>
                    )
                  ) : (
                    <TouchableOpacity
                      onPress={() => setActiveExam(exam)}
                      className="bg-yellow-50 px-4 py-1.5 rounded-lg flex-row items-center"
                    >
                      <Ionicons name="create-outline" size={14} color="#000" />
                      <Text className="text-richblack-900 font-bold text-xs ml-1">Take Exam</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Exam Player Modal */}
      <Modal visible={!!activeExam} animationType="slide">
        {activeExam && (
          <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
            {/* Player Header */}
            <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
              <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5 flex-1" numberOfLines={1}>
                {activeExam.title}
              </Text>
              <TouchableOpacity onPress={handleClosePlayer} className="p-1">
                <Ionicons name="close" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-xxs font-semibold uppercase text-yellow-50 bg-yellow-500/10 px-2 py-0.5 rounded self-start">
                  {activeExam.examType} Exam
                </Text>
                {activeExam.description && (
                  <Text className="text-sm text-richblack-700 dark:text-richblack-200 mt-2 italic">
                    "{activeExam.description}"
                  </Text>
                )}
                <Text className="text-xs text-richblack-500 dark:text-richblack-400 mt-2">
                  Total Marks: {activeExam.totalMarks}
                </Text>
              </View>

              {activeExam.examType === "MCQ" ? (
                /* =========================================================================
                   MCQ QUESTIONS LIST
                   ========================================================================= */
                <View className="space-y-6 mb-10">
                  {activeExam.questions?.map((q: any, qIdx: number) => {
                    const selectedOpt = selectedAnswers[q.id];
                    return (
                      <View
                        key={q.id}
                        className="bg-white dark:bg-richblack-850 p-4 border border-pure-greys-25 dark:border-richblack-800 rounded-xl mb-4"
                      >
                        <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-3">
                          {qIdx + 1}. {q.questionText}
                        </Text>
                        <View className="space-y-2">
                          {q.options?.map((opt: string, oIdx: number) => {
                            const isSelected = selectedOpt === String(oIdx);
                            return (
                              <TouchableOpacity
                                key={oIdx}
                                onPress={() =>
                                  setSelectedAnswers((prev) => ({ ...prev, [q.id]: String(oIdx) }))
                                }
                                className={`flex-row items-center p-3 rounded-lg border mb-2 ${
                                  isSelected
                                    ? "bg-yellow-50/10 border-yellow-50"
                                    : "bg-pure-greys-5 border-pure-greys-50 dark:bg-richblack-900 dark:border-richblack-800"
                                }`}
                              >
                                <View
                                  className={`w-4 h-4 rounded-full border justify-center items-center mr-2.5 ${
                                    isSelected ? "border-yellow-50" : "border-richblack-500"
                                  }`}
                                >
                                  {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-yellow-50" />}
                                </View>
                                <Text
                                  className={`text-xs flex-1 ${
                                    isSelected ? "text-yellow-50 font-semibold" : "text-richblack-900 dark:text-richblack-100"
                                  }`}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                /* =========================================================================
                   WRITTEN PHOTO UPLOADER
                   ========================================================================= */
                <View className="bg-white dark:bg-richblack-850 p-5 border border-pure-greys-25 dark:border-richblack-800 rounded-xl mb-6">
                  <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mb-4 text-center">
                    Upload Your Answer Sheet
                  </Text>

                  <TouchableOpacity
                    onPress={selectImage}
                    className="bg-pure-greys-5 dark:bg-richblack-900 aspect-square rounded-xl border-2 border-dashed border-pure-greys-50 dark:border-richblack-700 justify-center items-center overflow-hidden mb-6"
                  >
                    {selectedImage ? (
                      <Image source={{ uri: selectedImage }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                    ) : (
                      <View className="items-center p-6">
                        <Ionicons name="camera-outline" size={48} color="#FFD60A" />
                        <Text className="text-xs text-richblack-900 dark:text-richblack-200 font-semibold mt-3 text-center">
                          Tap to select or take answer photo
                        </Text>
                        <Text className="text-xxs text-richblack-500 mt-1 text-center">
                          Format: JPEG/PNG image of sheet
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {selectedImage && (
                    <TouchableOpacity
                      onPress={() => setSelectedImage(null)}
                      className="border border-pink-200 py-2.5 rounded-lg mb-4"
                    >
                      <Text className="text-pink-200 text-center font-bold text-xs">Clear Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Bottom Actions */}
            <View className="p-4 border-t border-pure-greys-25 dark:border-richblack-800 bg-white dark:bg-richblack-900">
              <TouchableOpacity
                onPress={activeExam.examType === "MCQ" ? handleSubmitMCQ : handleSubmitWritten}
                disabled={submitting}
                className="bg-yellow-50 py-3.5 rounded-xl flex-row justify-center items-center"
              >
                {submitting ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={18} color="#000" />
                    <Text className="text-richblack-900 font-bold text-sm ml-2">Submit Answers</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
