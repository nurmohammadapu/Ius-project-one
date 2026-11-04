import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { certificateEndpoints } from "../apis";

const {
  GET_CERTIFICATE_API,
  GET_MY_CERTIFICATES_API,
  GET_INSTRUCTOR_CERTIFICATES_API,
  GET_ADMIN_ALL_CERTIFICATES_API,
  VERIFY_CERTIFICATE_API,
} = certificateEndpoints;

// 1. Get or generate course certificate for completed course (Student)
export async function getCourseCertificate(courseId, token) {
  let result = null;
  const toastId = toast.loading("Checking certificate status...");
  try {
    const response = await apiConnector(
      "GET",
      `${GET_CERTIFICATE_API}/${courseId}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not retrieve certificate");
    }

    result = response.data.data;
  } catch (error) {
    console.error("GET COURSE CERTIFICATE ERROR:", error);
    toast.error(
      error.response?.data?.message || error.message || "Failed to load certificate"
    );
  }
  toast.dismiss(toastId);
  return result;
}

// 2. Get all student certificates (Student)
export async function getMyCertificates(token) {
  let result = [];
  try {
    const response = await apiConnector("GET", GET_MY_CERTIFICATES_API, null, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch certificates");
    }
    result = response.data.data;
  } catch (error) {
    console.error("GET MY CERTIFICATES ERROR:", error);
  }
  return result;
}

// 3. Public Verify Certificate by ID (for QR code verification)
export async function verifyCertificate(certificateId) {
  let result = null;
  try {
    const response = await apiConnector(
      "GET",
      `${VERIFY_CERTIFICATE_API}/${certificateId}`,
      null,
      {}
    );

    result = response.data;
  } catch (error) {
    console.error("VERIFY CERTIFICATE ERROR:", error);
    result = error.response?.data || { success: false, isValid: false, message: "Verification failed" };
  }
  return result;
}

// 4. Get instructor certificates (Instructor)
export async function getInstructorCertificates(token) {
  let result = null;
  try {
    const response = await apiConnector(
      "GET",
      GET_INSTRUCTOR_CERTIFICATES_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch instructor certificates");
    }
    result = response.data.data;
  } catch (error) {
    console.error("GET INSTRUCTOR CERTIFICATES ERROR:", error);
    toast.error(error.response?.data?.message || "Failed to load instructor certificates");
  }
  return result;
}

// 5. Get all certificates for admin (Admin)
export async function getAdminAllCertificates(token) {
  let result = null;
  try {
    const response = await apiConnector(
      "GET",
      GET_ADMIN_ALL_CERTIFICATES_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch admin certificates");
    }
    result = response.data.data;
  } catch (error) {
    console.error("GET ADMIN ALL CERTIFICATES ERROR:", error);
    toast.error(error.response?.data?.message || "Failed to load certificates");
  }
  return result;
}
