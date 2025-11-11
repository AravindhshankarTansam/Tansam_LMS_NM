import React, { useState } from "react";
import "./LoginPage.css";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_API } from "../../config/apiConfig";
import doctorImage from "../../assets/a.png";
import logoImage from "../../assets/DPH LOGO.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Allow sending/receiving cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      // ✅ Handle redirect if user came from "Enroll" button
      const fromEnroll = location.state?.fromEnroll;
      const courseId = location.state?.courseId;

      if (fromEnroll && courseId) {
        localStorage.setItem("enrolledCourse", courseId);
        navigate("/course-player");
      } else {
        const role = data.user.role;
        if (role === "superadmin" || role === "admin") {
          navigate("/dashboard");
        } else if (role === "student") {
          navigate("/userdashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-left">
        <h1 className="signin-title">
          Welcome to <span>DPH LMS</span>
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
      </div>

      <div className="signin-right">
        <img className="fluid-image" src={doctorImage} alt="Doctor" />
        <div className="overlay-card">
          <img src={logoImage} alt="DPH Logo" className="overlay-logo" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
