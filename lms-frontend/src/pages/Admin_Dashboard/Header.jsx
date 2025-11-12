import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API } from "../../config/apiConfig";
import herologo from "../../assets/tansamoldlogo.png";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    fetch(`${AUTH_API}/me`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("user", JSON.stringify(data.user));
        setAdmin(data.user);
      })
      .catch(() => {
        localStorage.removeItem("user");
        setAdmin(null);
      });
  }, []);

  const IMAGE_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  const imagePath =
    admin?.profile?.image_path?.replace(/\\/g, "/")?.replace(/^\/+/, "") || "";

  const imageUrl = imagePath ? `${IMAGE_BASE}/${imagePath}` : null;

  const getInitial = () => {
    const name = admin?.profile?.full_name || admin?.username || "";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="topbar_1">
      {/* Left - Logo */}
      <div className="topbar-left">
        <img src={herologo} alt="TANSAM Logo" className="logo" />
      </div>

      {/* Center - Title */}
      <div className="topbar-center">
        <h1 className="title1">TANSAM - LMS</h1>
      </div>

      {/* Right - User Info */}
      <div className="topbar-right">
        <div className="user-info">
          <div className="user-name">
            {admin ? admin.profile?.full_name || admin.username : "Admin"}
          </div>

          {imageUrl ? (
            <img
              className="user-avatar"
              src={imageUrl}
              alt="avatar"
              onClick={() => navigate("/Adminprofile")}
            />
          ) : (
            <div
              className="user-initial"
              onClick={() => navigate("/Adminprofile")}
            >
              {getInitial()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
