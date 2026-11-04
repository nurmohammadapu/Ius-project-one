import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { notesEndpoints } from "../apis";

const { GET_NOTE_API, SAVE_NOTE_API } = notesEndpoints;

export async function getLectureNote(subSectionId, token) {
  let result = "";
  try {
    const response = await apiConnector(
      "GET",
      `${GET_NOTE_API}?subSectionId=${subSectionId}`,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (response?.data?.success) {
      result = response.data.notes || "";
    }
  } catch (error) {
    console.error("GET LECTURE NOTE ERROR:", error);
  }
  return result;
}

export async function saveLectureNote(subSectionId, notes, token) {
  let success = false;
  const toastId = toast.loading("Saving notes...");
  try {
    const response = await apiConnector(
      "POST",
      SAVE_NOTE_API,
      { subSectionId, notes },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not save notes");
    }

    toast.success("Notes saved successfully!");
    success = true;
  } catch (error) {
    console.error("SAVE LECTURE NOTE ERROR:", error);
    toast.error(error.response?.data?.message || error.message || "Failed to save note");
  }
  toast.dismiss(toastId);
  return success;
}

