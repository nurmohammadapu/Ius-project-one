import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiAward, FiDownload, FiExternalLink, FiCalendar, FiBookOpen, FiUser, FiCheckCircle } from "react-icons/fi";
import { getMyCertificates } from "../../../services/operations/certificateAPI";
import CertificateModal from "../Course/CertificateModal";

export default function MyCertificates() {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const fetchCerts = async () => {
      setLoading(true);
      const res = await getMyCertificates(token);
      if (res) {
        setCertificates(res);
      }
      setLoading(false);
    };

    fetchCerts();
  }, [token]);

  return (
    <div className="w-full text-richblack-5">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiAward className="text-yellow-50" /> My Certificates
          </h1>
          <p className="text-richblack-300 text-sm mt-1">
            Official verifiable credentials issued upon 100% course lecture completion.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-richblack-700 bg-richblack-800 px-4 py-2 text-center">
            <p className="text-xs text-richblack-400">Total Earned</p>
            <p className="text-xl font-bold text-yellow-50">{certificates.length}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-[250px] grid place-items-center">
          <div className="spinner"></div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-900/50 p-12 text-center max-w-xl mx-auto my-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-richblack-800 text-yellow-50 text-3xl">
            <FiAward />
          </div>
          <h3 className="text-xl font-bold text-richblack-100">No Certificates Earned Yet</h3>
          <p className="text-sm text-richblack-400 mt-2 leading-relaxed">
            Certificates are automatically generated once you watch and complete 100% of all lectures in your enrolled courses.
          </p>
          <button
            onClick={() => navigate("/dashboard/enrolled-courses")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-5 py-2.5 text-sm font-semibold text-richblack-900 hover:bg-yellow-100 transition shadow"
          >
            <FiBookOpen /> Go to Enrolled Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-2xl border border-richblack-700 bg-richblack-800/80 p-5 flex flex-col justify-between hover:border-yellow-500/50 transition-all duration-300 shadow-lg group"
            >
              <div>
                {/* Course Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-richblack-900 mb-4">
                  {cert.thumbnail ? (
                    <img
                      src={cert.thumbnail}
                      alt={cert.courseName}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-richblack-600">
                      <FiBookOpen className="text-4xl" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 rounded-full bg-richblack-900/90 border border-yellow-500/60 px-2.5 py-1 flex items-center gap-1 text-[11px] font-bold text-yellow-50 shadow">
                    <FiCheckCircle className="text-caribbeangreen-200" /> Completed
                  </div>
                </div>

                {/* Course Name */}
                <h3 className="text-lg font-bold text-richblack-5 line-clamp-1 mb-1">
                  {cert.courseName}
                </h3>

                {/* Instructor */}
                <p className="text-xs text-richblack-400 flex items-center gap-1.5 mb-3">
                  <FiUser className="text-yellow-50/70" /> Instructor:{" "}
                  <span className="text-richblack-200 font-medium">
                    {cert.instructorFirstName} {cert.instructorLastName}
                  </span>
                </p>

                {/* Certificate Meta Details */}
                <div className="rounded-xl bg-richblack-900/70 p-3 border border-richblack-700/60 mb-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-richblack-300">
                    <span>Certificate ID:</span>
                    <span className="font-mono font-semibold text-yellow-50">
                      {cert.certificateId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-richblack-300">
                    <span className="flex items-center gap-1">
                      <FiCalendar /> Issue Date:
                    </span>
                    <span className="text-richblack-200">
                      {new Date(cert.issueDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-richblack-700/60">
                <button
                  onClick={() =>
                    setSelectedCert({
                      ...cert,
                      firstName: cert.firstName || user?.firstName,
                      lastName: cert.lastName || user?.lastName,
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-yellow-50 py-2 px-3 text-xs font-bold text-richblack-900 hover:bg-yellow-100 transition shadow"
                >
                  <FiAward className="text-sm" /> View / Download
                </button>
                <a
                  href={`/verify-certificate/${cert.certificateId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-lg border border-richblack-700 bg-richblack-900 p-2 text-richblack-300 hover:text-yellow-50 hover:border-yellow-500/40 transition"
                  title="Open Public Verification Link"
                >
                  <FiExternalLink className="text-base" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

