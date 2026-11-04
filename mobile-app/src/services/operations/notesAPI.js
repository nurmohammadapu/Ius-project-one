import { Alert } from "react-native";
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
    console.log("GET LECTURE NOTE ERROR:", error);
  }
  return result;
}

export async function saveLectureNote(subSectionId, notes, token) {
  let success = false;
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

    Alert.alert("Saved 💾", "Your lecture notes have been saved!");
    success = true;
  } catch (error) {
    console.log("SAVE LECTURE NOTE ERROR:", error);
    Alert.alert("Error", error.response?.data?.message || "Failed to save note");
  }
  return success;
}

