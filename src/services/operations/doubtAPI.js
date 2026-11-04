import { toast } from "react-hot-toast";
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
    console.error("GET ALL DOUBTS ERROR:", error);
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
    console.error("GET DOUBT DETAILS ERROR:", error);
  }
  return result;
}

export async function createDoubt(doubtData, token) {
  let result = null;
  const toastId = toast.loading("Posting your doubt...");
  try {
    const response = await apiConnector("POST", CREATE_DOUBT_API, doubtData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to post doubt");
    }

    toast.success("Doubt posted to Community Forum!");
    result = response.data;
  } catch (error) {
    console.error("CREATE DOUBT ERROR:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to post doubt");
  }
  toast.dismiss(toastId);
  return result;
}

export async function addComment(commentData, token) {
  let result = null;
  const toastId = toast.loading("Adding comment...");
  try {
    const response = await apiConnector("POST", ADD_COMMENT_API, commentData, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to add comment");
    }

    toast.success("Solution posted!");
    result = response.data;
  } catch (error) {
    console.error("ADD COMMENT ERROR:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to post solution");
  }
  toast.dismiss(toastId);
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
      toast.success(response.data.message);
      result = response.data.status;
    }
  } catch (error) {
    console.error("TOGGLE RESOLVE ERROR:", error);
    toast.error("Failed to update status");
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
      toast.success("Doubt post deleted");
      success = true;
    }
  } catch (error) {
    console.error("DELETE DOUBT ERROR:", error);
    toast.error("Failed to delete post");
  }
  return success;
}

