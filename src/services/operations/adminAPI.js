import { toast } from "react-hot-toast"
import { apiConnector } from "../apiConnector"
import { adminEndpoints } from "../apis"

const {
  GET_ALL_STUDENTS_API,
  GET_ALL_INSTRUCTORS_API,
  TOGGLE_USER_STATUS_API,
  DELETE_USER_API,
  CREATE_USER_API,
  GET_ALL_COURSES_API,
  TOGGLE_COURSE_PUBLISH_API,
  GET_PENDING_INSTRUCTORS_API,
  MANAGE_INSTRUCTOR_API,
  GET_FINANCIAL_REPORT_API,
} = adminEndpoints

export async function getAllStudents(token) {
  let result = []
  try {
    const response = await apiConnector("GET", GET_ALL_STUDENTS_API, null, {
      Authorization: `Bearer ${token}`,
    })

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    result = response.data.data
  } catch (error) {
    console.log("GET_ALL_STUDENTS_API ERROR............", error)
    toast.error(error.response?.data?.message || "Could Not Fetch Students")
  }
  return result
}

export async function getAllInstructors(token) {
  let result = []
  try {
    const response = await apiConnector("GET", GET_ALL_INSTRUCTORS_API, null, {
      Authorization: `Bearer ${token}`,
    })

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    result = response.data.data
  } catch (error) {
    console.log("GET_ALL_INSTRUCTORS_API ERROR............", error)
    toast.error(error.response?.data?.message || "Could Not Fetch Instructors")
  }
  return result
}

export async function toggleUserStatus(userId, active, token) {
  let success = false
  try {
    const response = await apiConnector(
      "PUT",
      TOGGLE_USER_STATUS_API,
      { userId, active },
      {
        Authorization: `Bearer ${token}`,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success("User status updated successfully")
    success = true
  } catch (error) {
    console.log("TOGGLE_USER_STATUS_API ERROR............", error)
    toast.error(error.response?.data?.message || "Failed to Update User Status")
  }
  return success
}

export async function deleteUser(userId, token) {
  let success = false
  try {
    const response = await apiConnector(
      "DELETE",
      DELETE_USER_API,
      { userId },
      {
        Authorization: `Bearer ${token}`,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success("User deleted successfully")
    success = true
  } catch (error) {
    console.log("DELETE_USER_API ERROR............", error)
    toast.error(error.response?.data?.message || "Failed to Delete User")
  }
  return success
}

export async function createUser(data, token) {
  let result = null
  try {
    const response = await apiConnector(
      "POST",
      CREATE_USER_API,
      data,
      {
        Authorization: `Bearer ${token}`,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success(response.data.message || "User created successfully")
    result = response.data.data
  } catch (error) {
    console.log("CREATE_USER_API ERROR............", error)
    toast.error(error.response?.data?.message || "Failed to Create User")
  }
  return result
}

export async function getAllCourses(token) {
  let result = []
  try {
    const response = await apiConnector("GET", GET_ALL_COURSES_API, null, {
      Authorization: `Bearer ${token}`,
    })

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    result = response.data.data
  } catch (error) {
    console.log("GET_ALL_COURSES_API ERROR............", error)
    toast.error(error.response?.data?.message || "Could Not Fetch Courses")
  }
  return result
}

export async function toggleCoursePublish(courseId, publish, token) {
  let success = false
  try {
    const response = await apiConnector(
      "PUT",
      TOGGLE_COURSE_PUBLISH_API,
      { courseId, publish },
      {
        Authorization: `Bearer ${token}`,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success(response.data.message || "Course status updated successfully")
    success = true
  } catch (error) {
    console.log("TOGGLE_COURSE_PUBLISH_API ERROR............", error)
    toast.error(error.response?.data?.message || "Failed to Update Course Status")
  }
  return success
}

export async function getPendingInstructors(token) {
  let result = []
  try {
    const response = await apiConnector("GET", GET_PENDING_INSTRUCTORS_API, null, {
      Authorization: `Bearer ${token}`,
    })

    if (response.data.success) {
      result = response.data.data
    }
  } catch (error) {
    console.log("GET_PENDING_INSTRUCTORS_API ERROR............", error)
  }
  return result
}

export async function manageInstructor(instructorId, action, token) {
  let success = false
  try {
    const response = await apiConnector(
      "POST",
      MANAGE_INSTRUCTOR_API,
      { instructorId, action },
      {
        Authorization: `Bearer ${token}`,
      }
    )

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    toast.success(`Instructor ${action === "approve" ? "approved" : "denied"} successfully`)
    success = true
  } catch (error) {
    console.log("MANAGE_INSTRUCTOR_API ERROR............", error)
    toast.error(error.response?.data?.message || "Failed to process approval")
  }
  return success
}

export async function getFinancialReport(token) {
  let result = null
  try {
    const response = await apiConnector("GET", GET_FINANCIAL_REPORT_API, null, {
      Authorization: `Bearer ${token}`,
    })

    if (!response.data.success) {
      throw new Error(response.data.message)
    }
    result = response.data.data
  } catch (error) {
    console.log("GET_FINANCIAL_REPORT_API ERROR............", error)
    toast.error(error.response?.data?.message || "Could Not Fetch Financial Report")
  }
  return result
}
