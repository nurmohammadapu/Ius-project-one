import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiEdit3, FiSave, FiCheck } from "react-icons/fi";
import { getLectureNote, saveLectureNote } from "../../../services/operations/notesAPI";

export default function LectureNotes({ subSectionId }) {
  const { token } = useSelector((state) => state.auth);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!subSectionId || !token) return;

    let isMounted = true;
    const fetchNote = async () => {
      setLoading(true);
      const res = await getLectureNote(subSectionId, token);
      if (isMounted) {
        setNotes(res || "");
        setSaved(false);
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
    const success = await saveLectureNote(subSectionId, notes, token);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow-lg my-6">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-richblack-700">
        <div className="flex items-center gap-2">
          <FiEdit3 className="text-yellow-50 text-lg" />
          <h3 className="text-base font-bold text-richblack-5">Personal Lecture Notes</h3>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-4 py-1.5 text-xs font-bold text-richblack-900 hover:bg-yellow-100 transition shadow disabled:opacity-50"
        >
          {saved ? (
            <>
              <FiCheck className="text-sm text-richblack-900" /> Saved!
            </>
          ) : (
            <>
              <FiSave className="text-sm" /> {saving ? "Saving..." : "Save Notes"}
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center text-xs text-richblack-400">
          Loading your notes...
        </div>
      ) : (
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Jot down formulas, code snippets, questions, or key takeaways for this lecture..."
          className="w-full rounded-xl border border-richblack-700 bg-richblack-900/80 p-3.5 text-sm text-richblack-100 placeholder-richblack-500 focus:outline-none focus:border-yellow-500/70 focus:ring-1 focus:ring-yellow-500/40 resize-y"
        />
      )}
      <p className="text-[11px] text-richblack-400 mt-2">
        💡 These notes are personal to you and will stay saved whenever you return to this lecture.
      </p>
    </div>
  );
}

