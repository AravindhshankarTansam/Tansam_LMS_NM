import React, { useState } from "react";
import "./LoginPage.css";
import { Mail, Lock, Eye, EyeOff, User, Phone, ImagePlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_API } from "../../config/apiConfig";
import doctorImage from "../../assets/background.png";
import logoImage from "../../assets/tansamoldlogo.png";

const LoginPage = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Convert file to Base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ----------------- LOGIN -----------------
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
        setError(data.error || "Invalid credentials");
        return;
      }

      toast.success("Login successful!");

      // Redirect logic
      const fromEnroll = location.state?.fromEnroll;
      const courseId = location.state?.courseId;

      if (fromEnroll && courseId) {
        localStorage.setItem("enrolledCourse", courseId);
        return navigate("/course-player");
      }

      const role = data.user.role;
      if (role === "superadmin" || role === "admin") navigate("/dashboard");
      else if (role === "user") navigate("/userdashboard");
      else navigate("/");
    } catch (err) {
      setError("Server error");
      setLoading(false);
    }
  };

  // ----------------- REGISTER - SEND OTP -----------------
  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    let image_base64 = "";
    if (profileImage) {
      image_base64 = await getBase64(profileImage);
    }

    const body = {
      full_name: fullName,
      email,
      mobile_number: mobile,
      image_base64,
    };

    try {
      const res = await fetch(`${AUTH_API}/register-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return toast.error(data.message);

      toast.success("OTP sent to your email");
      setServerOtp(data.otp);
      setMode("verifyOtp");
    } catch (err) {
      toast.error("Server error");
      setLoading(false);
    }
  };

  // ----------------- VERIFY OTP -----------------
  const verifyOtpFunc = () => {
    if (otp === serverOtp) {
      toast.success("OTP Verified!");
      setMode("setPassword");
    } else {
      toast.error("Invalid OTP");
    }
  };

  // ----------------- SET PASSWORD -----------------
  const handleSetPassword = async () => {
    if (password !== confirmPass) return toast.error("Passwords do not match");

    try {
      setLoading(true);
      const res = await fetch(`${AUTH_API}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return toast.error(data.message);

      toast.success("Account created successfully!");
      setMode("login");
    } catch (err) {
      toast.error("Server error");
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-left">
        {/* LOGIN */}
        {mode === "login" && (
          <>
            <h1 className="signin-title">Welcome to <span>TANSAM - LMS</span></h1>
            <form className="signin-form" onSubmit={handleSubmit}>
              <label>Email</label>
              <div className="input-box">
                <Mail className="icon" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <label>Password</label>
              <div className="input-box">
                <Lock className="icon" size={18} />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              {error && <p className="error-text">{error}</p>}
              <button type="submit" className="login-btn" disabled={loading}>{loading ? "Logging in..." : "Log In"}</button>
            </form>

            <p className="switch-text">
              Don’t have an account? <span onClick={() => setMode("register")} className="switch-link">Register</span>
            </p>
          </>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <>
            <h1 className="signin-title">Create Account <span>TANSAM - LMS</span></h1>
            <form className="signin-form" onSubmit={handleRegisterRequest}>
              <label>Full Name</label>
              <div className="input-box"><User size={18} /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>

              <label>Email</label>
              <div className="input-box"><Mail size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>

              <label>Mobile Number</label>
              <div className="input-box"><Phone size={18} /><input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} required /></div>

              <label>Profile Image</label>
              <div className="input-box"><ImagePlus size={18} /><input type="file" onChange={(e) => setProfileImage(e.target.files[0])} /></div>

              <button className="login-btn" type="submit" disabled={loading}>{loading ? "Sending OTP..." : "Register"}</button>
            </form>

            <p className="switch-text">
              Already have an account? <span onClick={() => setMode("login")} className="switch-link">Login</span>
            </p>
          </>
        )}

        {/* VERIFY OTP */}
        {mode === "verifyOtp" && (
          <>
            <h1 className="signin-title">Verify OTP</h1>
            <div className="signin-form">
              <label>Enter 6-digit OTP</label>
              <div className="input-box"><input maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} /></div>
              <button onClick={verifyOtpFunc} className="login-btn">Verify OTP</button>
            </div>
          </>
        )}

        {/* SET PASSWORD */}
        {mode === "setPassword" && (
          <>
            <h1 className="signin-title">Set Your Password</h1>
            <div className="signin-form">
              <label>Password</label>
              <div className="input-box"><Lock size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <label>Confirm Password</label>
              <div className="input-box"><Lock size={18} /><input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} /></div>
              <button className="login-btn" onClick={handleSetPassword}>Create Account</button>
            </div>
          </>
        )}
      </div>

      <div className="signin-right">
        <img className="fluid-image" src={doctorImage} alt="background" />
        <div className="overlay-card"><img src={logoImage} alt="logo" className="overlay-logo" /></div>
      </div>
    </div>
  );
};

export default LoginPage;