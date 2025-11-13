// src/config/apiConfig.js

// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://lms.tansam.org/api";

export const DASHBOARD_API = `${API_BASE}/dashboard`;
// Export endpoints
export const ADMIN_API = `${API_BASE}/admin`;
export const AUTH_API = `${API_BASE}/auth`;
export const USER_API = `${API_BASE}/user`;
export const COURSE_CATEGORY_API = `${API_BASE}/dashboard/course-categories`;
export const  COURSE_API = `${API_BASE}/dashboard/courses`;
export const MODULE_API = `${DASHBOARD_API}/modules`;
export const CHAPTER_API = `${DASHBOARD_API}/chapters`; 
export const QUIZ_API = `${DASHBOARD_API}/quizzes`; 
// User Dashboard Endpoints
export const USER_DASHBOARD_API = `${DASHBOARD_API}/userdashboard`;


// Other Dashboard Modules
export const TEST_API = `${USER_DASHBOARD_API}/tests`;
export const CLASS_API = `${USER_DASHBOARD_API}/classes`;
export const MENTOR_API = `${USER_DASHBOARD_API}/mentors`;
export const TIMETABLE_API = `${USER_DASHBOARD_API}/timetable`;
[]