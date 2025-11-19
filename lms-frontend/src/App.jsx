import React from "react";
import { Routes, Route } from "react-router-dom";

// Public Pages
import LandingPage from "./pages/Landingpage/LandingPage.jsx";
import LoginPage from "./pages/login/LoginPage.jsx";
import CourseDetails from "./pages/Landingpage/CourseDetails.jsx";

// Admin Pages
import Dashboard from "./pages/Admin_Dashboard/Dashboard.jsx";
import AdminProfile from "./pages/Admin_Dashboard/AdminProfile.jsx";
import AddUserPage from "./pages/Admin_Dashboard/UserCreation/AddUser.jsx";
import CourseCreatePage from "./pages/Admin_Dashboard/CourseCreation/CreateCoursePage.jsx";
import AddLessonPage from "./pages/Admin_Dashboard/CourseCreation/AddLessonPage.jsx";
import ModuleList from "./pages/Admin_Dashboard/CourseCreation/Module.jsx";
import CourseCategoryPage from "./pages/Admin_Dashboard/CourseCategory/Course_Category.jsx";


// User Pages
import UserDashboard from "./pages/User_dashboard/user.jsx";
import UserProfile from "./pages/User_dashboard/Userprofile/UserProfile.jsx";
import Course from "./pages/User_dashboard/course_page/course";
import CoursePlayer from "./pages/User_dashboard/course_player/CoursePlayer.jsx";
import QuizPage from "./pages/User_dashboard/Quiz/quiz";
import MyCourse from "./pages/User_dashboard/MyCourse/mycourse.jsx";

// import SignUpPage from "./pages/SignUpPage";
// import Courses from "./pages/Student_Dashboard/Courses.jsx";
// import Assignments from "./pages/Assignments.jsx";
// import Sidebar from "./pages/Student_Dashboard/Sidebar.jsx";

function App() {
  return (
    <div className="app-container">
      {/* Uncomment if using a sidebar */}
      {/* <Sidebar /> */}
      <main className="content">
        <Routes>

          {/* --- Public Routes --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/signup" element={<SignUpPage />} /> */}
          <Route path="/courseinfo/:id" element={<CourseDetails />} />

          {/* --- Admin Routes --- */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-profile" element={<AdminProfile />} />
          <Route path="/add-user" element={<AddUserPage />} />
          <Route path="/create-course" element={<CourseCreatePage />} />
          <Route path="/add-category" element={<CourseCategoryPage />} />
          <Route path="/admin/course/:courseId/modules" element={<ModuleList />} />
          <Route path="/admin/course/module/:moduleId/add-lesson" element={<AddLessonPage />} />

          {/* --- User Routes --- */}
          <Route path="/userdashboard" element={<UserDashboard />} />
          <Route path="/userprofile" element={<UserProfile />} />
          <Route path="/course" element={<Course />} />
          <Route path="/course-player" element={<CoursePlayer />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/mycourse" element={<MyCourse />} />

          {/* <Route path="/courses" element={<Courses />} /> */}
          {/* <Route path="/assignments" element={<Assignments />} /> */}

        </Routes>
      </main>
    </div>
  );
}

export default App;
