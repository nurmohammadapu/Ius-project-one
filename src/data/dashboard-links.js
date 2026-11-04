import { ACCOUNT_TYPE } from "../utils/constants"

export const sidebarLinks = [
  {
    id: 1,
    name: "My Profile",
    path: "/dashboard/my-profile",
    icon: "VscAccount",
  },
  {
    id: 22,
    name: "Doubt Forum",
    path: "/dashboard/doubt-forum",
    icon: "VscCommentDiscussion",
  },

  // INSTRUCTOR LINKS
  {
    id: 2,
    name: "Dashboard",
    path: "/dashboard/instructor",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscDashboard",
  },
  {
    id: 3,
    name: "My Courses",
    path: "/dashboard/my-courses",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscVm",
  },
  {
    id: 4,
    name: "Add Course",
    path: "/dashboard/add-course",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscAdd",
  },
  {
    id: 13,
    name: "Evaluate Exams",
    path: "/dashboard/evaluate-exams",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscPass",
  },
  {
    id: 16,
    name: "Certificates",
    path: "/dashboard/instructor-certificates",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscWorkspaceTrusted",
  },
  {
    id: 17,
    name: "Leaderboard",
    path: "/dashboard/instructor-leaderboard",
    type: ACCOUNT_TYPE.INSTRUCTOR,
    icon: "VscFlame",
  },

  // STUDENT LINKS
  {
    id: 5,
    name: "Enrolled Courses",
    path: "/dashboard/enrolled-courses",
    type: ACCOUNT_TYPE.STUDENT,
    icon: "VscMortarBoard",
  },
  {
    id: 7,
    name: "Cart",
    path: "/dashboard/cart",
    type: ACCOUNT_TYPE.STUDENT,
    icon: "VscArchive",
  },
  {
    id: 14,
    name: "My Exams",
    path: "/dashboard/my-exams",
    type: ACCOUNT_TYPE.STUDENT,
    icon: "VscTasklist",
  },
  {
    id: 18,
    name: "My Certificates",
    path: "/dashboard/my-certificates",
    type: ACCOUNT_TYPE.STUDENT,
    icon: "VscWorkspaceTrusted",
  },
  {
    id: 19,
    name: "Leaderboard",
    path: "/dashboard/leaderboard",
    type: ACCOUNT_TYPE.STUDENT,
    icon: "VscFlame",
  },

  // ADMIN LINKS
  {
    id: 8,
    name: "All Students",
    path: "/dashboard/all-students",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscOrganization",
  },
  {
    id: 9,
    name: "All Instructors",
    path: "/dashboard/all-instructors",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscFeedback",
  },
  {
    id: 10,
    name: "Pending Approvals",
    path: "/dashboard/pending-approvals",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscVerified",
  },
  {
    id: 11,
    name: "All Courses",
    path: "/dashboard/all-courses",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscBook",
  },
  {
    id: 12,
    name: "Financial Report",
    path: "/dashboard/financial-report",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscGraph",
  },
  {
    id: 15,
    name: "Manage Categories",
    path: "/dashboard/categories",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscFolder",
  },
  {
    id: 20,
    name: "All Certificates",
    path: "/dashboard/all-certificates",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscWorkspaceTrusted",
  },
  {
    id: 21,
    name: "Leaderboard",
    path: "/dashboard/admin-leaderboard",
    type: ACCOUNT_TYPE.ADMIN,
    icon: "VscFlame",
  },
]
