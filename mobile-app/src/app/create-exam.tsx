import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { createExam } from "../services/operations/examAPI";
import { getFullDetailsOfCourse } from "../services/operations/courseDetailsAPI";
import { setCourse } from "../redux/slices/courseSlice";

export default function CreateExamScreen() {
  const { courseId, sectionId, subSectionId } = useLocalSearchParams();
  const { token } = useSelector((state: any) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState<"MCQ" | "WRITTEN">("MCQ");
  const [totalMarks, setTotalMarks] = useState("100");

  // MCQ Questions States
  const [questions, setQuestions] = useState<any[]>([
    { questionText: "", options: ["", "", "", ""], correctOption: "0" },
  ]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { questionText: "", options: ["", "", "", ""], correctOption: "0" },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (text: string, idx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, questionText: text } : q))
    );
  };

  const handleOptionChange = (text: string, qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i === qIdx) {
          const updatedOptions = [...q.options];
          updatedOptions[oIdx] = text;
          return { ...q, options: updatedOptions };
        }
        return q;
      })
    );
  };

  const handleCorrectOptionChange = (oIdx: string, qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, correctOption: oIdx } : q))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter an exam title.");
      return;
    }
    const marksNum = parseFloat(totalMarks);
    if (isNaN(marksNum) || marksNum <= 0) {
      Alert.alert("Error", "Please enter a valid total marks score.");
      return;
    }

    const payload: any = {
      title,
      description,
      examType,
      totalMarks: marksNum,
      courseId: courseId as string,
    };

    if (sectionId) payload.sectionId = sectionId as string;
    if (subSectionId) payload.subSectionId = subSectionId as string;

    if (examType === "MCQ") {
      // Validate questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) {
          Alert.alert("Error", `Please fill in the text for question #${i + 1}.`);
          return;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            Alert.alert("Error", `Please fill in option #${j + 1} for question #${i + 1}.`);
            return;
          }
        }
      }
      payload.questions = questions;
    }

    setLoading(true);
    const result = await createExam(payload, token);
    if (result) {
      // Reload course details to update the local builder list
      const detailsRes = await getFullDetailsOfCourse(courseId as string, token);
      if (detailsRes?.courseDetails) {
        dispatch(setCourse(detailsRes.courseDetails));
      }
      router.back();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-pure-greys-5 dark:bg-richblack-900">
      {/* Header */}
      <View className="px-4 py-3 border-b border-pure-greys-25 dark:border-richblack-800 flex-row items-center justify-between bg-white dark:bg-richblack-900">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={isDark ? "#F1F2FF" : "#000814"} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-richblack-900 dark:text-richblack-5">
            Create Exam
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-5" showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-300 mb-1.5">Exam Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Enter Exam Title"
            placeholderTextColor="#838894"
            className="bg-white dark:bg-richblack-800 text-richblack-900 dark:text-richblack-5 px-4 py-3 rounded-lg border border-pure-greys-25 dark:border-richblack-700"
          />
        </View>

        {/* Description Input */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-300 mb-1.5">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter instructions, syllabus or descriptions..."
            placeholderTextColor="#838894"
            multiline
            numberOfLines={3}
            style={{ textAlignVertical: "top" }}
            className="bg-white dark:bg-richblack-800 text-richblack-900 dark:text-richblack-5 px-4 py-3 rounded-lg border border-pure-greys-25 dark:border-richblack-700 min-h-[85px]"
          />
        </View>

        {/* Total Marks Input */}
        <View className="mb-4">
          <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-300 mb-1.5">Total Marks *</Text>
          <TextInput
            value={totalMarks}
            onChangeText={setTotalMarks}
            placeholder="100"
            keyboardType="numeric"
            placeholderTextColor="#838894"
            className="bg-white dark:bg-richblack-800 text-richblack-900 dark:text-richblack-5 px-4 py-3 rounded-lg border border-pure-greys-25 dark:border-richblack-700"
          />
        </View>

        {/* Exam Type Selector */}
        <View className="mb-6">
          <Text className="text-xs font-semibold text-richblack-700 dark:text-richblack-300 mb-2">Exam Type</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => setExamType("MCQ")}
              className={`flex-1 py-3.5 rounded-lg border flex-row justify-center items-center ${
                examType === "MCQ" ? "bg-yellow-500/10 border-yellow-50" : "bg-white dark:bg-richblack-800 border-pure-greys-25 dark:border-richblack-700"
              }`}
            >
              <Text className={`text-xs font-bold ${examType === "MCQ" ? "text-yellow-50" : "text-richblack-700 dark:text-richblack-300"}`}>
                MCQ (Auto-Graded)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExamType("WRITTEN")}
              className={`flex-1 py-3.5 rounded-lg border flex-row justify-center items-center ${
                examType === "WRITTEN" ? "bg-yellow-500/10 border-yellow-50" : "bg-white dark:bg-richblack-800 border-pure-greys-25 dark:border-richblack-700"
              }`}
            >
              <Text className={`text-xs font-bold ${examType === "WRITTEN" ? "text-yellow-50" : "text-richblack-700 dark:text-richblack-300"}`}>
                WRITTEN (Manual)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MCQ Questions Uploader Container */}
        {examType === "MCQ" && (
          <View className="mb-10">
            <Text className="text-base font-bold text-richblack-900 dark:text-richblack-5 mb-4">MCQ Questions</Text>
            
            {questions.map((q, idx) => (
              <View
                key={idx}
                className="bg-white dark:bg-richblack-850 p-4 border border-pure-greys-25 dark:border-richblack-800 rounded-xl mb-6 relative"
              >
                {questions.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveQuestion(idx)}
                    className="absolute top-3 right-3 p-1 bg-pink-500/10 rounded"
                  >
                    <Ionicons name="trash" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
                
                <Text className="text-xs font-bold text-yellow-50 mb-2">Question #{idx + 1}</Text>
                
                {/* Question Text */}
                <TextInput
                  value={q.questionText}
                  onChangeText={(t) => handleQuestionTextChange(t, idx)}
                  placeholder="Enter question prompt"
                  placeholderTextColor="#838894"
                  className="bg-pure-greys-5 dark:bg-richblack-900 text-richblack-900 dark:text-richblack-5 px-3 py-2.5 rounded-lg border border-pure-greys-50 dark:border-richblack-700 mb-3"
                />

                {/* Options Inputs */}
                <Text className="text-xxs font-semibold text-richblack-400 mb-1.5">Options and Correct Indicator</Text>
                {q.options.map((opt: string, oIdx: number) => {
                  const isCorrect = q.correctOption === String(oIdx);
                  return (
                    <View key={oIdx} className="flex-row items-center mb-2 space-x-2">
                      <TouchableOpacity
                        onPress={() => handleCorrectOptionChange(String(oIdx), idx)}
                        className={`w-5 h-5 rounded-full border justify-center items-center ${
                          isCorrect ? "border-yellow-50 bg-yellow-500/10" : "border-richblack-500"
                        }`}
                      >
                        {isCorrect && <View className="w-3 h-3 rounded-full bg-yellow-50" />}
                      </TouchableOpacity>
                      <TextInput
                        value={opt}
                        onChangeText={(t) => handleOptionChange(t, idx, oIdx)}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                        placeholderTextColor="#838894"
                        className="flex-1 bg-pure-greys-5 dark:bg-richblack-900 text-richblack-900 dark:text-richblack-5 px-3 py-2 rounded-lg border border-pure-greys-50 dark:border-richblack-700 text-xs"
                      />
                    </View>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddQuestion}
              className="border border-dashed border-yellow-50 py-3 rounded-xl flex-row justify-center items-center mt-2"
            >
              <Ionicons name="add" size={16} color="#FFD60A" />
              <Text className="text-yellow-50 font-bold text-xs ml-1">Add Question</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Action */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="bg-yellow-50 py-3.5 rounded-xl flex-row justify-center items-center mb-10"
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="save" size={18} color="#000" />
              <Text className="text-richblack-900 font-bold text-sm ml-2">Create Exam</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
