import { Alert } from "react-native";
import { apiConnector } from "../apiConnector";
import { doubtEndpoints } from "../apis";

const {
  GET_ALL_DOUBTS_API,
  GET_DOUBT_DETAILS_API,
  CREATE_DOUBT_API,
  ADD_COMMENT_API,
  TOGGLE_RESOLVE_API,
  DELETE_DOUBT_API,
} = doubtEndpoints;

export async function getAllDoubts(filters = {}, token) {
  let result = [];
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await apiConnector(
      "GET",
      `${GET_ALL_DOUBTS_API}?${params}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (response?.data?.success) {
      result = response.data.data;
    }
  } catch (error) {
    console.log("GET ALL DOUBTS ERROR:", error);
  }
  return result;
}

export async function getDoubtDetails(postId, token) {
  let result = null;
  try {
    const response = await apiConnector(
      "GET",
      `${GET_DOUBT_DETAILS_API}?postId=${postId}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (response?.data?.success) {
      result = response.data.data;
    }
  } catch (error) {
    console.log("GET DOUBT DETAILS ERROR:", error);
  }
  return result;
}

export async function createDoubt(doubtData, token) {
  let result = null;
  try {
    const response = await apiConnector("POST", CREATE_DOUBT_API, doubtData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to post doubt");
    }

    Alert.alert("Success 🎉", "Your doubt has been posted to the Community Forum!");
    result = response.data;
  } catch (error) {
    console.log("CREATE DOUBT ERROR:", error);
    Alert.alert("Error", error.response?.data?.message || "Failed to post doubt");
  }
  return result;
}

export async function addComment(commentData, token) {
  let result = null;
  try {
    const response = await apiConnector("POST", ADD_COMMENT_API, commentData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to add comment");
    }

    Alert.alert("Success 🎉", "Solution / comment posted!");
    result = response.data;
  } catch (error) {
    console.log("ADD COMMENT ERROR:", error);
    Alert.alert("Error", error.response?.data?.message || "Failed to post comment");
  }
  return result;
}

export async function toggleResolveDoubt(postId, token) {
  let result = null;
  try {
    const response = await apiConnector(
      "POST",
      TOGGLE_RESOLVE_API,
      { postId },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (response?.data?.success) {
      Alert.alert("Status Updated", response.data.message);
      result = response.data.status;
    }
  } catch (error) {
    console.log("TOGGLE RESOLVE ERROR:", error);
    Alert.alert("Error", "Failed to update status");
  }
  return result;
}

export async function deleteDoubt(postId, token) {
  let success = false;
  try {
    const response = await apiConnector(
      "POST",
      DELETE_DOUBT_API,
      { postId },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (response?.data?.success) {
      Alert.alert("Deleted", "Doubt post deleted successfully");
      success = true;
    }
  } catch (error) {
    console.log("DELETE DOUBT ERROR:", error);
    Alert.alert("Error", "Failed to delete post");
  }
  return success;
}

