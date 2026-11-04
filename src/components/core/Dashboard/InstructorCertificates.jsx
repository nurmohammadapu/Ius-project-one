import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiAward, FiUsers, FiBookOpen, FiSearch, FiCalendar, FiExternalLink, FiEye } from "react-icons/fi";
import { getInstructorCertificates } from "../../../services/operations/certificateAPI";
import CertificateModal from "../Course/CertificateModal";

export default function InstructorCertificates() {
  const { token, user } = useSelector((state) => state.auth);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const fetchCerts = async () => {
      setLoading(true);
      const res = await getInstructorCertificates(token);
      if (res) {
        setData(res);
      }
      setLoading(false);
    };

    fetchCerts();
  }, [token]);

  const stats = data?.stats || { totalCourses: 0, totalStudentsEnrolled: 0, totalCertificatesIssued: 0 };
  const courses = data?.courses || [];
  const certificates = data?.certificates || [];

  const filteredCerts = certificates.filter((cert) => {
    const matchesCourse = selectedCourseFilter === "ALL" || cert.courseId === selectedCourseFilter;
    const matchesSearch =
      `${cert.firstName} ${cert.lastName} ${cert.email} ${cert.certificateId}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const overallRate =
    stats.totalStudentsEnrolled > 0
      ? Math.round((stats.totalCertificatesIssued / stats.totalStudentsEnrolled) * 100)
      : 0;

  return (
    <div className="w-full text-richblack-5">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiAward className="text-yellow-50" /> Course Certificates Overview
          </h1>
          <p className="text-richblack-300 text-sm mt-1">
            Monitor course completion, total enrolled students, and issued student credentials.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[250px] grid place-items-center">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Total Courses</span>
                <FiBookOpen className="text-yellow-50 text-xl" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-richblack-5">{stats.totalCourses}</p>
            </div>

            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Enrolled Students</span>
                <FiUsers className="text-caribbeangreen-200 text-xl" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-caribbeangreen-200">
                {stats.totalStudentsEnrolled}
              </p>
            </div>

            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Certificates Issued</span>
                <FiAward className="text-yellow-50 text-xl" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-yellow-50">
                {stats.totalCertificatesIssued}
              </p>
            </div>

            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-richblack-400 font-semibold uppercase">Completion Rate</span>
                <span className="text-xs font-bold text-blue-200">{overallRate}%</span>
              </div>
              <div className="w-full bg-richblack-700 h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-caribbeangreen-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(overallRate, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Courses Summary Breakdown */}
          {courses.length > 0 && (
            <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6 shadow-lg">
              <h2 className="text-lg font-bold text-richblack-100 mb-4 flex items-center gap-2">
                <FiBookOpen className="text-yellow-50" /> Courses Completion Progress
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => {
                  const enrolled = Number(course.enrolledCount) || 0;
                  const certified = Number(course.certifiedCount) || 0;
                  const percent = enrolled > 0 ? Math.round((certified / enrolled) * 100) : 0;

                  return (
                    <div
                      key={course.id}
                      className="rounded-xl border border-richblack-700/80 bg-richblack-900/60 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-richblack-100 line-clamp-1 mb-2">
                          {course.courseName}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-richblack-400 mb-2">
                          <span>
                            Enrolled: <strong className="text-richblack-200">{enrolled}</strong>
                          </span>
                          <span>
                            Certified: <strong className="text-yellow-50">{certified}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-richblack-700 h-2 rounded-full overflow-hidden mb-1">
                          <div
                            className="bg-yellow-50 h-full rounded-full"
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-right text-richblack-400 font-medium">
                          {percent}% Completed
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certified Students List */}
          <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-richblack-100 flex items-center gap-2">
                <FiAward className="text-yellow-50" /> Certified Students Directory
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                {/* Course Filter Dropdown */}
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="rounded-lg border border-richblack-700 bg-richblack-900 px-3 py-1.5 text-xs text-richblack-200 focus:outline-none focus:border-yellow-500 cursor-pointer"
                >
                  <option value="ALL">All Courses ({certificates.length})</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseName}
                    </option>
                  ))}
                </select>

                {/* Search Bar */}
                <div className="relative min-w-[200px]">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-richblack-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search student or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-richblack-700 bg-richblack-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder-richblack-400 focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>
            </div>

            {filteredCerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-richblack-700 bg-richblack-900/40 p-8 text-center text-richblack-400 text-sm">
                No certified students found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-richblack-700 text-xs uppercase text-richblack-400 bg-richblack-900/40">
                    <tr>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-richblack-700/60">
                    {filteredCerts.map((cert) => (
                      <tr key={cert.id} className="hover:bg-richblack-700/40 transition-colors">
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
                        <td className="py-3 px-4 text-richblack-200 font-medium">
                          {cert.courseName}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-yellow-50">
                          {cert.certificateId}
                        </td>
                        <td className="py-3 px-4 text-xs text-richblack-300">
                          {new Date(cert.issueDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setSelectedCert({
                                  ...cert,
                                  instructorFirstName: user?.firstName,
                                  instructorLastName: user?.lastName,
                                })
                              }
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

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <CertificateModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

