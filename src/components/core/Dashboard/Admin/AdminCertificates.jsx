import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiAward, FiUsers, FiBookOpen, FiSearch, FiCalendar, FiExternalLink, FiEye } from "react-icons/fi";
import { getAdminAllCertificates } from "../../../../services/operations/certificateAPI";
import CertificateModal from "../../Course/CertificateModal";

export default function AdminCertificates() {
  const { token } = useSelector((state) => state.auth);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const fetchAllCerts = async () => {
      setLoading(true);
      const res = await getAdminAllCertificates(token);
      if (res) {
        setData(res);
      }
      setLoading(false);
    };

    fetchAllCerts();
  }, [token]);

  const stats = data?.stats || {
    totalCertificates: 0,
    totalDistinctStudents: 0,
    totalDistinctCourses: 0,
  };
  const certificates = data?.certificates || [];

  const filteredCerts = certificates.filter((cert) => {
    const query = searchQuery.toLowerCase();
    return (
      `${cert.firstName} ${cert.lastName}`.toLowerCase().includes(query) ||
      cert.email?.toLowerCase().includes(query) ||
      cert.certificateId?.toLowerCase().includes(query) ||
      cert.courseName?.toLowerCase().includes(query) ||
      `${cert.instructorFirstName} ${cert.instructorLastName}`.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full text-richblack-5">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiAward className="text-yellow-50" /> Platform Certificates Ledger
          </h1>
          <p className="text-richblack-300 text-sm mt-1">
            Global audit log of all official certificates issued across StudyNotion.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[250px] grid place-items-center">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Platform Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Total Issued</span>
                <FiAward className="text-yellow-50 text-xl" />
              </div>
              <p className="text-3xl font-bold text-yellow-50">{stats.totalCertificates}</p>
            </div>

            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Certified Students</span>
                <FiUsers className="text-caribbeangreen-200 text-xl" />
              </div>
              <p className="text-3xl font-bold text-caribbeangreen-200">
                {stats.totalDistinctStudents}
              </p>
            </div>

            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Courses with Graduates</span>
                <FiBookOpen className="text-blue-200 text-xl" />
              </div>
              <p className="text-3xl font-bold text-blue-200">{stats.totalDistinctCourses}</p>
            </div>
          </div>

          {/* Certificates Table Container */}
          <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
              <h3 className="text-base font-bold text-richblack-100">
                All Certificates ({filteredCerts.length})
              </h3>
              <div className="relative w-full sm:w-80">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-richblack-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search student, course, ID, instructor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-richblack-700 bg-richblack-900 py-2 pl-9 pr-3 text-xs text-white placeholder-richblack-400 focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>

            {filteredCerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-richblack-700 bg-richblack-900/40 p-8 text-center text-richblack-400 text-sm">
                No certificate records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-richblack-700 text-xs uppercase text-richblack-400 bg-richblack-900/40">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-richblack-700/60">
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className="hover:bg-richblack-700/40 transition-colors">
                        {/* Student */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                cert.image ||
                                `https://api.dicebear.com/5.x/initials/svg?seed=${cert.firstName} ${cert.lastName}`
                              }
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold text-richblack-100">
                                {cert.firstName} {cert.lastName}
                              </p>
                              <p className="text-xs text-richblack-400">{cert.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="py-3 px-4 text-richblack-200 font-medium max-w-[200px] truncate">
                          {cert.courseName}
                        </td>

                        {/* Instructor */}
                        <td className="py-3 px-4 text-richblack-300 text-xs">
                          {cert.instructorFirstName} {cert.instructorLastName}
                        </td>

                        {/* Certificate ID */}
                        <td className="py-3 px-4 font-mono text-xs font-bold text-yellow-50">
                          {cert.certificateId}
                        </td>

                        {/* Issue Date */}
                        <td className="py-3 px-4 text-xs text-richblack-400">
                          {new Date(cert.issueDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCert(cert)}
                              className="inline-flex items-center gap-1 rounded bg-yellow-50/10 px-2.5 py-1 text-xs font-semibold text-yellow-50 hover:bg-yellow-50 hover:text-richblack-900 transition"
                            >
                              <FiEye /> View
                            </button>
                            <a
                              href={`/verify-certificate/${cert.certificateId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded border border-richblack-700 bg-richblack-900 p-1 text-richblack-400 hover:text-yellow-50"
                              title="Public Verification"
                            >
                              <FiExternalLink className="text-sm" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

