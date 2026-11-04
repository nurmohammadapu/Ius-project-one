import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getLectureNote, saveLectureNote } from "../services/operations/notesAPI";

interface LectureNotesBoxProps {
  subSectionId: string;
}

export default function LectureNotesBox({ subSectionId }: LectureNotesBoxProps) {
  const { token } = useSelector((state: any) => state.auth);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subSectionId || !token) return;

    let isMounted = true;
    const fetchNote = async () => {
      setLoading(true);
      const res = await getLectureNote(subSectionId, token);
      if (isMounted) {
        setNotes(res || "");
      }
      setLoading(false);
    };

    fetchNote();
    return () => {
      isMounted = false;
    };
  }, [subSectionId, token]);

  const handleSave = async () => {
    if (!subSectionId || !token) return;
    setSaving(true);
    await saveLectureNote(subSectionId, notes, token);
    setSaving(false);
  };

  if (!subSectionId) return null;

  return (
    <View className="bg-white dark:bg-richblack-800 border border-pure-greys-25 dark:border-richblack-700 rounded-2xl p-4 mt-6 shadow">
      <View className="flex-row items-center justify-between pb-3 border-b border-pure-greys-25 dark:border-richblack-700/60 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="document-text-outline" size={18} color="#FFD60A" />
          <Text className="text-sm font-bold text-richblack-900 dark:text-richblack-5 ml-1.5">
            Personal Lecture Notes
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || loading}
          className="bg-yellow-50 px-3.5 py-1.5 rounded-lg flex-row items-center"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="save-outline" size={14} color="#000" />
              <Text className="text-richblack-900 font-bold text-xs ml-1">Save Note</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#FFD60A" />
        </View>
      ) : (
        <TextInput
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          placeholder="Jot down formulas, ideas, or notes for this lecture..."
          placeholderTextColor="#838894"
          className="bg-pure-greys-5 dark:bg-richblack-900 border border-pure-greys-50 dark:border-richblack-700 rounded-xl p-3 text-xs text-richblack-900 dark:text-richblack-100 min-h-[90px] text-top"
          textAlignVertical="top"
        />
      )}

      <Text className="text-[10px] text-richblack-400 mt-2">
        💡 Notes are auto-associated with this lecture and saved to your account.
      </Text>
    </View>
  );
}

