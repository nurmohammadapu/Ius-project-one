import { Alert } from "react-native";
import { apiConnector } from "../apiConnector";
import { examEndpoints } from "../apis";

const {
  CREATE_EXAM_API,
  GET_EXAM_BY_TARGET_API,
  SUBMIT_EXAM_API,
  GET_SUBMISSIONS_BY_EXAM_API,
  GRADE_SUBMISSION_API,
  GET_STUDENT_EXAMS_API,
} = examEndpoints;

// 1. Create Exam (Instructor)
export async function createExam(examData, token) {
  let result = null;
  try {
    const response = await apiConnector("POST", CREATE_EXAM_API, examData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not create exam");
    }
    Alert.alert("Success 🎉", "Exam created successfully!");
    result = response.data.data;
  } catch (error) {
    console.log("CREATE EXAM API ERROR:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to create exam"
    );
  }
  return result;
}

// 2. Get Exam By Target (Student/Instructor)
export async function getExamByTarget(targetParams, token) {
  let result = [];
  try {
    const queryStr = new URLSearchParams(targetParams).toString();
    const response = await apiConnector(
      "GET",
      `${GET_EXAM_BY_TARGET_API}?${queryStr}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch exams");
    }
    result = response.data.data;
  } catch (error) {
    console.log("GET EXAM BY TARGET API ERROR:", error);
    // Don't show Alert here as it's called passively in screen renders
  }
  return result;
}

// 3. Submit Exam (Student)
export async function submitExam(submitData, token, isMultipart = false) {
  let result = null;
  try {
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    if (isMultipart) {
      headers["Content-Type"] = "multipart/form-data";
    }

    const response = await apiConnector("POST", SUBMIT_EXAM_API, submitData, headers);

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not submit exam");
    }

    Alert.alert("Success 🎉", "Exam submitted successfully!");
    result = response.data.data;
  } catch (error) {
    console.log("SUBMIT EXAM API ERROR:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to submit exam"
    );
  }
  return result;
}

// 4. Get Submissions By Exam (Instructor)
export async function getSubmissionsByExam(examId, token) {
  let result = [];
  try {
    const response = await apiConnector(
      "GET",
      `${GET_SUBMISSIONS_BY_EXAM_API}?examId=${examId}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch submissions");
    }
    result = response.data.data;
  } catch (error) {
    console.log("GET SUBMISSIONS BY EXAM API ERROR:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to load submissions"
    );
  }
  return result;
}

// 5. Grade Submission (Instructor)
export async function gradeSubmission(gradeData, token) {
  let result = null;
  try {
    const response = await apiConnector("POST", GRADE_SUBMISSION_API, gradeData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not grade submission");
    }

    Alert.alert("Success 🎉", "Graded and feedback saved successfully!");
    result = response.data.data;
  } catch (error) {
    console.log("GRADE SUBMISSION API ERROR:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to grade submission"
    );
  }
  return result;
}

// 6. Get Student Exams (Student)
export async function getStudentExams(token) {
  let result = [];
  try {
    const response = await apiConnector("GET", GET_STUDENT_EXAMS_API, null, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch exams");
    }
    result = response.data.data;
  } catch (error) {
    console.log("GET STUDENT EXAMS API ERROR:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to load exams"
    );
  }
  return result;
}
