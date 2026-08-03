-- PostgreSQL Schema generated for server-two database

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE "AccountType" AS ENUM ('Admin', 'Student', 'Instructor');
CREATE TYPE "CourseStatus" AS ENUM ('Draft', 'Published', 'Hold');

-- Profile Table
CREATE TABLE "Profile" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gender" TEXT,
  "dateOfBirth" TEXT,
  "about" TEXT,
  "contactNumber" TEXT
);

-- User Table
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "accountType" "AccountType" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "image" TEXT NOT NULL,
  "token" TEXT,
  "resetPasswordExpires" TIMESTAMP(3),
  "profileId" TEXT UNIQUE REFERENCES "Profile"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Category Table
CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT
);

-- Course Table
CREATE TABLE "Course" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseName" TEXT NOT NULL,
  "courseDescription" TEXT,
  "whatYouWillLearn" TEXT,
  "price" DOUBLE PRECISION,
  "thumbnail" TEXT,
  "tag" TEXT[],
  "instructions" TEXT[],
  "status" "CourseStatus" NOT NULL DEFAULT 'Draft',
  "instructorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Section Table
CREATE TABLE "Section" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectionName" TEXT NOT NULL,
  "courseId" TEXT REFERENCES "Course"("id") ON DELETE CASCADE
);

-- SubSection Table
CREATE TABLE "SubSection" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT,
  "timeDuration" TEXT,
  "description" TEXT,
  "videoUrl" TEXT,
  "sectionId" TEXT REFERENCES "Section"("id") ON DELETE CASCADE
);

-- RatingAndReview Table
CREATE TABLE "RatingAndReview" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "rating" DOUBLE PRECISION NOT NULL,
  "review" TEXT NOT NULL,
  "courseId" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE
);

-- OTP Table
CREATE TABLE "OTP" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "otp" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CourseProgress Table
CREATE TABLE "CourseProgress" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "courseID" TEXT REFERENCES "Course"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE
);

-- Implicit Many-to-Many Join Tables created by Prisma
-- _EnrolledStudents (User <-> Course)
CREATE TABLE "_EnrolledStudents" (
  "A" TEXT NOT NULL REFERENCES "Course"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

-- _CompletedSubSections (CourseProgress <-> SubSection)
CREATE TABLE "_CompletedSubSections" (
  "A" TEXT NOT NULL REFERENCES "CourseProgress"("id") ON DELETE CASCADE,
  "B" TEXT NOT NULL REFERENCES "SubSection"("id") ON DELETE CASCADE,
  PRIMARY KEY ("A", "B")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_course_instructorId" ON "Course"("instructorId");
CREATE INDEX IF NOT EXISTS "idx_course_categoryId" ON "Course"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_section_courseId" ON "Section"("courseId");
CREATE INDEX IF NOT EXISTS "idx_subsection_sectionId" ON "SubSection"("sectionId");
CREATE INDEX IF NOT EXISTS "idx_rating_courseId" ON "RatingAndReview"("courseId");
CREATE INDEX IF NOT EXISTS "idx_rating_userId" ON "RatingAndReview"("userId");

-- Exam Enums
CREATE TYPE "ExamType" AS ENUM ('MCQ', 'WRITTEN');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- Exam Table
CREATE TABLE "Exam" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "examType" "ExamType" NOT NULL,
  "totalMarks" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "courseId" TEXT REFERENCES "Course"("id") ON DELETE CASCADE,
  "sectionId" TEXT REFERENCES "Section"("id") ON DELETE CASCADE,
  "subSectionId" TEXT REFERENCES "SubSection"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Question Table
CREATE TABLE "Question" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE,
  "questionText" TEXT NOT NULL,
  "options" TEXT[] NOT NULL,
  "correctOption" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ExamSubmission Table
CREATE TABLE "ExamSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "examId" TEXT NOT NULL REFERENCES "Exam"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "submissionUrl" TEXT,
  "answers" JSONB,
  "obtainedMarks" DOUBLE PRECISION,
  "feedback" TEXT,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExamSubmission_examId_studentId_key" UNIQUE ("examId", "studentId")
);

-- Indexes for Exams
CREATE INDEX IF NOT EXISTS "idx_exam_courseId" ON "Exam"("courseId");
CREATE INDEX IF NOT EXISTS "idx_exam_sectionId" ON "Exam"("sectionId");
CREATE INDEX IF NOT EXISTS "idx_exam_subSectionId" ON "Exam"("subSectionId");
CREATE INDEX IF NOT EXISTS "idx_question_examId" ON "Question"("examId");
CREATE INDEX IF NOT EXISTS "idx_submission_examId" ON "ExamSubmission"("examId");
CREATE INDEX IF NOT EXISTS "idx_submission_studentId" ON "ExamSubmission"("studentId");

