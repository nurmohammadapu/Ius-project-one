import React, { useRef } from "react";
import { FiAward, FiDownload, FiX, FiCheckCircle, FiShare2 } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function CertificateModal({ certificate, onClose }) {
  const certRef = useRef(null);

  if (!certificate) return null;

  const verifyUrl = `${window.location.origin}/verify-certificate/${certificate.certificateId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    verifyUrl
  )}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    toast.success("Certificate verification link copied to clipboard!");
  };

  const formattedDate = new Date(certificate.issueDate || Date.now()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-auto bg-white/10 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="w-11/12 max-w-[850px] rounded-2xl border border-richblack-700 bg-richblack-900 p-6 text-white shadow-2xl print:border-none print:shadow-none print:w-full print:p-0">
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-richblack-700 print:hidden">
          <div className="flex items-center gap-2">
            <FiAward className="text-2xl text-yellow-50" />
            <h2 className="text-lg font-bold text-richblack-5">Official Course Certificate</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-richblack-800 px-3 py-1.5 text-xs font-semibold text-richblack-200 hover:bg-richblack-700 transition"
              title="Copy verification link"
            >
              <FiShare2 /> Share
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3.5 py-1.5 text-xs font-bold text-richblack-900 hover:bg-yellow-100 transition shadow"
            >
              <FiDownload /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-richblack-400 hover:bg-richblack-700 hover:text-richblack-5 transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* The Printable Certificate Container */}
        <div
          ref={certRef}
          className="relative rounded-xl border-4 border-double border-yellow-500/70 bg-gradient-to-b from-[#0f172a] via-[#020617] to-[#0f172a] p-8 text-center shadow-inner print:border-8 print:border-black print:text-black print:bg-white"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 h-10 w-10 border-t-2 border-l-2 border-yellow-500/80"></div>
          <div className="absolute top-3 right-3 h-10 w-10 border-t-2 border-r-2 border-yellow-500/80"></div>
          <div className="absolute bottom-3 left-3 h-10 w-10 border-b-2 border-l-2 border-yellow-500/80"></div>
          <div className="absolute bottom-3 right-3 h-10 w-10 border-b-2 border-r-2 border-yellow-500/80"></div>

          {/* Platform Branding */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center text-richblack-900 font-extrabold text-lg">
              SN
            </div>
            <span className="text-xl font-black tracking-widest text-richblack-5 uppercase">
              STUDY<span className="text-yellow-50">NOTION</span>
            </span>
          </div>

          <h4 className="text-xs uppercase tracking-[0.3em] text-yellow-500/90 font-semibold mb-6">
            Verified Academic Certificate
          </h4>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-richblack-5 tracking-wide mb-4">
            Certificate of Completion
          </h1>

          <p className="text-xs text-richblack-300 italic mb-2">
            This is proudly and officially presented to
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-yellow-50 underline decoration-yellow-500/40 underline-offset-8 mb-6">
            {certificate.firstName} {certificate.lastName}
          </h2>

          <p className="text-xs md:text-sm text-richblack-200 max-w-[550px] mx-auto leading-relaxed mb-6">
            for successfully completing all lectures, practical exercises, and examination requirements for the comprehensive course:
          </p>

          <div className="inline-block rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-6 py-2 mb-8">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">
              {certificate.courseName}
            </h3>
          </div>

          {/* Footer details: Date, Signature, QR Code */}
          <div className="grid grid-cols-3 items-end pt-6 border-t border-richblack-700/80 mt-6">
            {/* Issue Date */}
            <div className="text-left">
              <span className="text-[10px] text-richblack-400 uppercase tracking-wider block">
                Date of Issue
              </span>
              <span className="text-xs font-semibold text-richblack-100">
                {formattedDate}
              </span>
              <span className="text-[9px] text-richblack-500 block mt-1">
                ID: {certificate.certificateId}
              </span>
            </div>

            {/* QR Code Verification */}
            <div className="flex flex-col items-center">
              <div className="rounded-md bg-white p-1 shadow-md">
                <img src={qrCodeUrl} alt="Certificate QR Code" className="h-16 w-16" />
              </div>
              <span className="text-[9px] text-richblack-400 mt-1">
                Scan to Verify Authenticity
              </span>
            </div>

            {/* Instructor Signature */}
            <div className="text-right">
              <div className="font-serif italic text-base text-yellow-50 border-b border-richblack-600 pb-0.5 inline-block">
                {certificate.instructorFirstName
                  ? `${certificate.instructorFirstName} ${certificate.instructorLastName}`
                  : "Course Instructor"}
              </div>
              <span className="text-[10px] text-richblack-400 uppercase tracking-wider block mt-1">
                Authorized Instructor
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

