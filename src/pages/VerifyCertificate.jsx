import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { verifyCertificate } from "../services/operations/certificateAPI";
import { FiCheckCircle, FiXCircle, FiAward, FiArrowLeft, FiCalendar, FiUser, FiBook } from "react-icons/fi";

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      const res = await verifyCertificate(certificateId);
      setResult(res);
      setLoading(false);
    };

    if (certificateId) {
      fetchVerification();
    }
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-richblack-900 py-16 px-4 font-inter text-white flex flex-col justify-center items-center">
      <div className="w-full max-w-[620px] rounded-2xl border border-richblack-700 bg-richblack-800 p-8 shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-richblack-700 pb-4 mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-yellow-50 hover:underline font-semibold"
          >
            <FiArrowLeft /> Back to Home
          </Link>
          <span className="text-xs uppercase tracking-widest text-richblack-400 font-bold">
            StudyNotion Credential Verification
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-richblack-300">
            <div className="spinner">Verifying Certificate...</div>
          </div>
        ) : result?.isValid ? (
          <div className="text-center space-y-6">
            {/* Success Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400">
              <FiCheckCircle className="text-3xl" />
            </div>

            <div>
              <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Authentic & Verified
              </span>
              <h1 className="text-2xl font-bold text-richblack-5">
                Official Certificate of Completion
              </h1>
              <p className="text-xs text-richblack-300 mt-1">
                Certificate ID: <span className="font-mono text-yellow-50 font-bold">{result.data.certificateId}</span>
              </p>
            </div>

            {/* Verification Detail Card */}
            <div className="rounded-xl border border-richblack-700 bg-richblack-900/80 p-5 text-left space-y-4">
              <div className="flex items-start gap-3">
                <FiUser className="text-yellow-50 text-xl mt-1 shrink-0" />
                <div>
                  <span className="text-[11px] text-richblack-400 uppercase tracking-wider block">
                    Awarded To
                  </span>
                  <span className="text-base font-bold text-richblack-5">
                    {result.data.firstName} {result.data.lastName}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-richblack-800 pt-3">
                <FiBook className="text-yellow-50 text-xl mt-1 shrink-0" />
                <div>
                  <span className="text-[11px] text-richblack-400 uppercase tracking-wider block">
                    Completed Course
                  </span>
                  <span className="text-base font-bold text-richblack-5">
                    {result.data.courseName}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-richblack-800 pt-3">
                <FiCalendar className="text-yellow-50 text-xl mt-1 shrink-0" />
                <div>
                  <span className="text-[11px] text-richblack-400 uppercase tracking-wider block">
                    Date Issued
                  </span>
                  <span className="text-sm font-semibold text-richblack-100">
                    {new Date(result.data.issueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {result.data.instructorFirstName && (
                <div className="flex items-start gap-3 border-t border-richblack-800 pt-3">
                  <FiAward className="text-yellow-50 text-xl mt-1 shrink-0" />
                  <div>
                    <span className="text-[11px] text-richblack-400 uppercase tracking-wider block">
                      Course Instructor
                    </span>
                    <span className="text-sm font-semibold text-richblack-100">
                      {result.data.instructorFirstName} {result.data.instructorLastName}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-richblack-400 italic">
              This credential was verified directly against the StudyNotion academic database records.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-900/20 border-2 border-pink-500/30 text-pink-400">
              <FiXCircle className="text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-richblack-5">Certificate Not Found</h2>
            <p className="text-xs text-richblack-300 max-w-[400px] mx-auto">
              The certificate ID <span className="font-mono text-pink-300">"{certificateId}"</span> could not be verified or does not exist in our academic registry.
            </p>
            <Link
              to="/"
              className="inline-block mt-4 rounded-lg bg-yellow-50 px-5 py-2 text-xs font-bold text-richblack-900 hover:bg-yellow-100 transition"
            >
              Explore Certified Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

