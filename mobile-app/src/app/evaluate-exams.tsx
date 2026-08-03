import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { fetchInstructorCourses } from "../services/operations/courseDetailsAPI";
import { getSubmissionsByExam, gradeSubmission } from "../services/operations/examAPI";

export default function EvaluateExamsScreen() {
  const { token } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Exams List States
  const [exams, setExams] = useState<any[]>([]);
  const [visibleQuestions, setVisibleQuestions] = useState<Record<string, boolean>>({});

  // Submissions States
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  // Grading Modal States
  const [gradingSub, setGradingSub] = useState<any>(null);
  const [obtainedMarks, setObtainedMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [gradeStatus, setGradeStatus] = useState<"PASSED" | "FAILED">("PASSED");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const res = await fetchInstructorCourses(token);
      if (res) {
        setCourses(res);
      }
      setLoading(false);
    };
    if (token) {
      fetchCourses();
    }
  }, [token]);

  // Extract exams on course selection
  useEffect(() => {
    if (selectedCourse) {
      const collectedExams: any[] = [];
      
      // Course-level
      if (selectedCourse.exams) {
        selectedCourse.exams.forEach((exam: any) => {
          if (!exam.sectionId && !exam.subSectionId) {
            collectedExams.push({ ...exam, level: "Course Final" });
          }
        });
      }

      // Section-level & Subsection-level
      selectedCourse.courseContent?.forEach((section: any) => {
        if (section.exams) {
          section.exams.forEach((exam: any) => {
            if (exam.sectionId && !exam.subSectionId) {
              collectedExams.push({ ...exam, level: `Section: ${section.sectionName}` });
            }
          });
        }

        section.subSection?.forEach((sub: any) => {
          if (sub.exams) {
            sub.exams.forEach((exam: any) => {
              if (exam.subSectionId) {
                collectedExams.push({ ...exam, level: `Lecture: ${sub.title}` });
              }
            });
          }
        });
      });

      setExams(collectedExams);
      setSelectedExam(null);
      setSubmissions([]);
    } else {
      setExams([]);
      setSelectedExam(null);
      setSubmissions([]);
    }
  }, [selectedCourse]);

  // Fetch submissions when selectedExam changes
  const fetchSubmissions = async (exam: any) => {
    setSelectedExam(exam);
    setSubsLoading(true);
    const res = await getSubmissionsByExam(exam.id, token);
    if (res) {
      setSubmissions(res);
    }
    setSubsLoading(false);
  };

  const handleOpenGrading = (sub: any) => {
    setGradingSub(sub);
    setObtainedMarks(sub.obtainedMarks !== null ? String(sub.obtainedMarks) : "");
    setFeedback(sub.feedback || "");
    setGradeStatus(sub.status === "PENDING" ? "PASSED" : sub.status);
  };

  const handleSaveGrade = async () => {
    if (!gradingSub || !selectedExam) return;
    const parsedMarks = parseFloat(obtainedMarks);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > selectedExam.totalMarks) {
      Alert.alert("Error", `Please enter valid marks between 0 and ${selectedExam.totalMarks}.`);
      return;
    }

    setSaveLoading(true);
    const res = await gradeSubmission(
      {
        submissionId: gradingSub.id,
        obtainedMarks: parsedMarks,
        feedback,
        status: gradeStatus,
      },
      token
    );
    setSaveLoading(false);

    if (res) {
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === gradingSub.id ? { ...sub, ...res } : sub))
      );
      setGradingSub(null);
    }
  };

  const toggleQuestions = (examId: string) => {
    setVisibleQuestions((prev) => ({ ...prev, [examId]: !prev[examId] }));
  };

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center bg-white dark:bg-richblack-900">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
          Evaluate Exams
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FFD60A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Select Course Button */}
          <View className="mb-4">
            <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-300 mb-1.5">Select Course</Text>
            <TouchableOpacity
              onPress={() => setShowCourseModal(true)}
              className="bg-white dark:bg-richblack-800 px-4 py-3.5 rounded-xl border border-pure-greys-25 dark:border-richblack-700 flex-row justify-between items-center"
            >
              <Text className={selectedCourse ? "text-richblack-900 dark:text-richblack-5 font-bold" : "text-richblack-400"}>
                {selectedCourse ? selectedCourse.courseName : "-- Choose Course --"}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#838894" />
            </TouchableOpacity>
          </View>

          {/* List of exams under selected course */}
          {selectedCourse && (
            <View className="bg-white dark:bg-richblack-850 p-4 border border-pure-greys-25 dark:border-richblack-850 rounded-xl mb-6">
              <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-4">Exams in Course</Text>
              
              {exams.length === 0 ? (
                <Text className="text-xs text-richblack-500 italic py-4 text-center">No exams created for this course yet.</Text>
              ) : (
                <View className="space-y-4">
                  {exams.map((exam) => {
                    const isSelected = selectedExam?.id === exam.id;
                    const showQ = !!visibleQuestions[exam.id];

                    return (
                      <View key={exam.id} className="bg-pure-greys-5 dark:bg-richblack-900 p-4 border border-pure-greys-25 dark:border-richblack-800 rounded-lg mb-3">
                        <View className="flex-row items-center justify-between">
                          <View className="bg-yellow-500/10 px-2 py-0.5 rounded">
                            <Text className="text-yellow-50 text-[10px] font-bold uppercase">{exam.examType}</Text>
                          </View>
                          <Text className="text-[10px] text-richblack-400 font-medium">{exam.level}</Text>
                        </View>

                        <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 mt-1.5">{exam.title}</Text>
                        {exam.description && (
                          <Text className="text-xs text-richblack-600 dark:text-richblack-300 mt-1 italic">"{exam.description}"</Text>
                        )}
                        <Text className="text-xs text-richblack-500 dark:text-richblack-400 mt-1">Total Marks: {exam.totalMarks}</Text>

                        {/* Expandable questions */}
                        {showQ && (
                          <View className="mt-3 border-t border-pure-greys-25 dark:border-richblack-800 pt-3 space-y-2">
                            <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-200 mb-1.5">Questions ({exam.questions?.length || 0}):</Text>
                            {(!exam.questions || exam.questions.length === 0) ? (
                              <Text className="text-[11px] text-richblack-400 italic">No questions added.</Text>
                            ) : (
                              exam.questions.map((q: any, idx: number) => (
                                <View key={q.id} className="border-l border-pure-greys-25 dark:border-richblack-700 pl-2.5 py-1 mb-2">
                                  <Text className="text-xs text-richblack-900 dark:text-richblack-5 font-bold">Q{idx + 1}. {q.questionText}</Text>
                                  {q.options?.map((opt: string, oIdx: number) => {
                                    const isCorrect = String(oIdx) === String(q.correctOption);
                                    return (
                                      <Text key={oIdx} className={`text-xxs mt-0.5 ${isCorrect ? "text-emerald-400 font-bold" : "text-richblack-600 dark:text-richblack-300"}`}>
                                        {String.fromCharCode(65 + oIdx)}. {opt} {isCorrect && "✓"}
                                      </Text>
                                    );
                                  })}
                                </View>
                              ))
                            )}
                          </View>
                        )}

                        <View className="flex-row justify-end space-x-3 mt-4">
                          <TouchableOpacity
                            onPress={() => toggleQuestions(exam.id)}
                            className="bg-pure-greys-5 dark:bg-richblack-800 px-3 py-1.5 rounded-lg border border-pure-greys-25 dark:border-richblack-700 mr-2"
                          >
                            <Text className="text-richblack-900 dark:text-richblack-5 text-xs font-semibold">
                              {showQ ? "Hide Qs" : "View Qs"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => fetchSubmissions(exam)}
                            className={`px-3 py-1.5 rounded-lg ${
                              isSelected ? "bg-yellow-50" : "bg-richblack-800 border border-richblack-700"
                            }`}
                          >
                            <Text className={`text-xs font-bold ${isSelected ? "text-black" : "text-yellow-50"}`}>
                              {isSelected ? "Viewing Submissions" : "View Submissions"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Submissions Section */}
          {selectedExam && (
            <View className="bg-white dark:bg-richblack-850 p-4 border border-pure-greys-25 dark:border-richblack-850 rounded-xl mb-10">
              <View className="flex-row items-center justify-between border-b border-pure-greys-25 dark:border-richblack-700 pb-3 mb-4">
                <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5">Submissions List</Text>
                <Text className="text-xxs text-richblack-400">{submissions.length} Total</Text>
              </View>

              {subsLoading ? (
                <ActivityIndicator color="#FFD60A" />
              ) : submissions.length === 0 ? (
                <Text className="text-xs text-richblack-500 italic text-center py-4">No submissions received yet.</Text>
              ) : (
                <View className="space-y-4">
                  {submissions.map((sub) => {
                    const isPending = sub.status === "PENDING";
                    const isPassed = sub.status === "PASSED";

                    return (
                      <View key={sub.id} className="bg-pure-greys-5 dark:bg-richblack-900 p-4 border border-pure-greys-25 dark:border-richblack-800 rounded-lg mb-3">
                        <View className="flex-row items-center mb-3">
                          <Image
                            source={{ uri: sub.student?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${sub.student?.firstName}` }}
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                          />
                          <View className="ml-3 flex-1">
                            <Text className="text-xs font-bold text-richblack-900 dark:text-richblack-5">
                              {sub.student?.firstName} {sub.student?.lastName}
                            </Text>
                            <Text className="text-[10px] text-richblack-400 mt-0.5">{sub.student?.email}</Text>
                          </View>
                        </View>

                        {/* Submission details */}
                        <Text className="text-xs text-richblack-600 dark:text-richblack-300">
                          Date: {new Date(sub.createdAt).toLocaleDateString()}
                        </Text>
                        <Text className="text-xs text-richblack-600 dark:text-richblack-300 mt-1">
                          Marks Obtained: {sub.obtainedMarks !== null ? `${sub.obtainedMarks}/${selectedExam.totalMarks}` : "N/A"}
                        </Text>

                        {/* Status Badges */}
                        <View className="flex-row justify-between items-center mt-4">
                          <View className={`px-2 py-0.5 rounded ${
                            isPending ? "bg-yellow-500/10" : isPassed ? "bg-emerald-500/10" : "bg-pink-500/10"
                          }`}>
                            <Text className={`text-[10px] font-bold ${
                              isPending ? "text-yellow-50" : isPassed ? "text-emerald-400" : "text-pink-400"
                            }`}>{sub.status}</Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleOpenGrading(sub)}
                            className="bg-yellow-50 px-3.5 py-1.5 rounded-lg flex-row items-center"
                          >
                            <Ionicons name="shield-checkmark" size={12} color="#000" />
                            <Text className="text-richblack-900 font-bold text-xs ml-1">Grade Submission</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Select Course Modal Picker */}
      <Modal visible={showCourseModal} transparent animationType="slide">
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-richblack-800 border-t border-richblack-700 rounded-t-2xl p-5 max-h-[70%]">
            <View className="flex-row justify-between items-center pb-4 border-b border-richblack-700">
              <Text className="text-lg font-bold text-richblack-5">Select Course</Text>
              <TouchableOpacity onPress={() => setShowCourseModal(false)}>
                <Ionicons name="close" size={24} color="#F1F2FF" />
              </TouchableOpacity>
            </View>
            <ScrollView className="py-2" showsVerticalScrollIndicator={false}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    setSelectedCourse(c);
                    setShowCourseModal(false);
                  }}
                  className="py-4 border-b border-richblack-700 flex-row justify-between items-center"
                >
                  <Text className="text-richblack-5 font-semibold text-sm">{c.courseName}</Text>
                  {selectedCourse?.id === c.id && (
                    <Ionicons name="checkmark" size={18} color="#FFD60A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grading Modal Form */}
      <Modal visible={!!gradingSub} transparent animationType="slide">
        {gradingSub && (
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-white dark:bg-richblack-800 border-t border-pure-greys-25 dark:border-richblack-750 rounded-t-2xl p-5 max-h-[90%]">
              <View className="flex-row justify-between items-center pb-4 border-b border-pure-greys-50 dark:border-richblack-700 mb-4">
                <Text className="text-lg font-bold text-richblack-900 dark:text-richblack-5">Grade Written Submission</Text>
                <TouchableOpacity onPress={() => setGradingSub(null)}>
                  <Ionicons name="close" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
                </TouchableOpacity>
              </View>

              <ScrollView className="space-y-4 mb-4" showsVerticalScrollIndicator={false}>
                {/* Paper PDF/Image */}
                {gradingSub.submissionUrl && (
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-richblack-700 dark:text-richblack-100 mb-2">Submitted Sheet</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(gradingSub.submissionUrl)}
                      className="bg-yellow-500/10 border border-yellow-50/20 py-3 rounded-lg flex-row justify-center items-center"
                    >
                      <Ionicons name="image-outline" size={16} color="#FFD60A" />
                      <Text className="text-yellow-50 text-xs font-bold ml-1.5">Click to Open Submitted Sheet</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Obtained Marks Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-richblack-700 dark:text-richblack-100 mb-2">
                    Obtained Marks * (Max: {selectedExam?.totalMarks})
                  </Text>
                  <TextInput
                    value={obtainedMarks}
                    onChangeText={setObtainedMarks}
                    keyboardType="numeric"
                    placeholder="Enter obtained score"
                    placeholderTextColor="#838894"
                    className="w-full bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 p-3 rounded-lg border border-pure-greys-50 dark:border-richblack-700"
                  />
                </View>

                {/* Feedback Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-richblack-700 dark:text-richblack-100 mb-2">Feedback / Comments</Text>
                  <TextInput
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Provide constructive feedback..."
                    placeholderTextColor="#838894"
                    multiline
                    numberOfLines={3}
                    style={{ textAlignVertical: "top" }}
                    className="w-full bg-pure-greys-5 text-richblack-900 dark:bg-richblack-900 dark:text-richblack-5 p-3 rounded-lg border border-pure-greys-50 dark:border-richblack-700 min-h-[80px]"
                  />
                </View>

                {/* Pass/Fail Status Selector */}
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-richblack-700 dark:text-richblack-100 mb-2">Grade Status</Text>
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => setGradeStatus("PASSED")}
                      className={`flex-1 py-3 rounded-lg border flex-row justify-center items-center ${
                        gradeStatus === "PASSED" ? "bg-emerald-500/10 border-emerald-500" : "bg-pure-greys-5 border-pure-greys-50 dark:bg-richblack-900 dark:border-richblack-800"
                      }`}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                      <Text className="text-emerald-400 text-xs font-bold ml-1.5">PASS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setGradeStatus("FAILED")}
                      className={`flex-1 py-3 rounded-lg border flex-row justify-center items-center ${
                        gradeStatus === "FAILED" ? "bg-pink-500/10 border-pink-500" : "bg-pure-greys-5 border-pure-greys-50 dark:bg-richblack-900 dark:border-richblack-800"
                      }`}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                      <Text className="text-pink-400 text-xs font-bold ml-1.5">FAIL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                onPress={handleSaveGrade}
                disabled={saveLoading}
                className="bg-yellow-50 py-3.5 rounded-xl flex-row justify-center items-center"
              >
                {saveLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#000" />
                    <Text className="text-richblack-900 font-bold text-sm ml-2">Save Evaluation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
