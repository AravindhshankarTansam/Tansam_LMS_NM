import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API } from "../../config/apiConfig";

export default function Header() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    // ✅ Use cookie-based session (no localStorage token)
    fetch(`${AUTH_API}/me`, {
      method: "GET",
      credentials: "include", // include cookies with request
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("user", JSON.stringify(data.user));
        setAdmin(data.user);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        localStorage.removeItem("user");
        setAdmin(null);
      });
  }, []);

  // ✅ Handle both local & production URLs
  const IMAGE_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:5000";

  const imagePath =
    admin?.profile?.image_path?.replace(/\\/g, "/")?.replace(/^\/+/, "") || "";

  const imageUrl = imagePath ? `${IMAGE_BASE}/${imagePath}` : null;

  // ✅ Extract first letter of full_name or username
  const getInitial = () => {
    const name = admin?.profile?.full_name || admin?.username || "";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="topbar">
      <div className="top-left"></div>
      <div className="top-right">
        <div className="search-placeholder"></div>
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
              style={{
                cursor: "pointer",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              onClick={() => navigate("/Adminprofile")}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#1976d2",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              {getInitial()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
