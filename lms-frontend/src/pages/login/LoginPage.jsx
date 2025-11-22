import React, { useState } from "react";
import "./LoginPage.css";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_API } from "../../config/apiConfig";
import doctorImage from "../../assets/background.png";
import logoImage from "../../assets/tansamoldlogo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();

  const fromEnroll = location.state?.fromEnroll;
  const courseId = location.state?.courseId;

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

      if (!res.ok) {
      // Custom error message for invalid/non-existent users
      if (data.error === "User not found" || data.error === "Invalid credentials") {
        setError("You are not allowed to access this portal. Please register first. Kindly contact admin.");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
      return;
    }

    const user = data.user;
    const role = user.role;

    // ------------------------------------------------
    // 1️⃣ LOGIN FROM ENROLL BUTTON (SPECIAL RULES)
    // ------------------------------------------------
    if (fromEnroll && courseId) {
      if (role !== "student") {
        setError("Please check your email or password.");
        return;
      }

      try {
        const enrollRes = await fetch(
          "http://localhost:5000/api/dashboard/enrollments",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              custom_id: user.profile.custom_id,
              course_id: courseId,
            }),
          }
        );

        const enrollData = await enrollRes.json();

        // -----------------------------------------
        // ⭐ FIXED ENROLLMENT LOGIC
        // -----------------------------------------
        if (enrollRes.status === 400 || enrollRes.status === 409) {
          setError("Already enrolled");
          navigate("/course-player");
          return;
        }

        if (!enrollRes.ok) {
          setError(enrollData.error || "Enrollment failed");
          return;
        }

        navigate("/course-player");
        return;
      } catch (err) {
        console.error("Enrollment error:", err);
        setError("Enrollment failed");
        return;
      }
    }

    // ------------------------------------------------
    // 2️⃣ NORMAL LOGIN (WORKS EXACTLY AS BEFORE)
    // ------------------------------------------------
    if (role === "superadmin" || role === "admin") {
      navigate("/dashboard");
      return;
    }

    if (role === "student") {
      navigate("/userdashboard");
      return;
    }

    navigate("/");

  } catch (err) {
    console.error(err);
    setError("Server error. Please try again later.");
    setLoading(false);
  }
};


  return (
    <div className="signin-container">
      <div className="signin-left">
        <h1 className="signin-title">
          Welcome to <span>TANSAM - LMS</span>
        </h1>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <div className="input-box">
            <Mail className="icon" size={18} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="input-box">
            <Lock className="icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="eye-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <button type="button" className="cta" onClick={() => navigate("/")}>
          <span className="span">BACK TO HOME</span>
          <span className="second">
            <svg width="50px" height="20px" viewBox="0 0 66 43">
              <g fill="none" fillRule="evenodd">
                <path className="one" fill="#fff" d="M40.15..." />
                <path className="two" fill="#fff" d="M20.15..." />
                <path className="three" fill="#fff" d="M0.15..." />
              </g>
            </svg>
          </span>
        </button>
      </div>

      <div className="signin-right">
        <img className="fluid-image" src={doctorImage} alt="logo" />
        <div className="overlay-card">
          <img src={logoImage} alt="DPH Logo" className="overlay-logo" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;