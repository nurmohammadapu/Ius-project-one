import { toast } from "react-hot-toast";
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
  const toastId = toast.loading("Creating exam...");
  try {
    const response = await apiConnector("POST", CREATE_EXAM_API, examData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not create exam");
    }

    toast.success("Exam created successfully!");
    result = response.data.data;
  } catch (error) {
    console.error("CREATE EXAM API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to create exam"
    );
  }
  toast.dismiss(toastId);
  return result;
}

// 2. Get Exams by Target (Student / Instructor)
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
    console.error("GET EXAM BY TARGET API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to load exams"
    );
  }
  return result;
}

// 3. Submit Exam (Student)
export async function submitExam(submissionData, token) {
  let result = null;
  const toastId = toast.loading("Submitting your answers...");
  try {
    // If it's a file submission (written), submissionData should be FormData
    const isFormData = submissionData instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    if (isFormData) {
      headers["Content-Type"] = "multipart/form-data";
    }

    const response = await apiConnector("POST", SUBMIT_EXAM_API, submissionData, headers);

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not submit exam");
    }

    toast.success(response.data.message || "Submitted successfully!");
    result = response.data.data;
  } catch (error) {
    console.error("SUBMIT EXAM API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to submit exam"
    );
  }
  toast.dismiss(toastId);
  return result;
}

// 4. Get Submissions for Exam (Instructor)
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
    console.error("GET SUBMISSIONS BY EXAM API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to load submissions"
    );
  }
  return result;
}

// 5. Grade Submission (Instructor)
export async function gradeSubmission(gradeData, token) {
  let result = null;
  const toastId = toast.loading("Saving grades...");
  try {
    const response = await apiConnector("POST", GRADE_SUBMISSION_API, gradeData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not grade submission");
    }

    toast.success("Graded and feedback saved successfully!");
    result = response.data.data;
  } catch (error) {
    console.error("GRADE SUBMISSION API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to grade submission"
    );
  }
  toast.dismiss(toastId);
  return result;
}

// 6. Get student exams (Student)
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
    console.error("GET STUDENT EXAMS API ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to load exams"
    );
  }
  return result;
}
