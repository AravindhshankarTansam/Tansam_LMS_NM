// services/nmService.js
import axios from "axios";

const BASE = process.env.NM_API_BASE_URL;

let cachedToken = null;
let tokenExpiry = 0;


/* =====================================================
   AXIOS DEBUG (shows real NM errors)
===================================================== */
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response) {
      console.log("\n🚨 NM ERROR");
      console.log("STATUS:", err.response.status);
      console.log("DATA:", err.response.data);
    }
    return Promise.reject(err);
  }
);


/* =====================================================
   GET TOKEN (form-urlencoded + cache)
===================================================== */
export const getNMToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log("🔐 Getting NM token...");

  const res = await axios.post(
    `${BASE}/lms/client/token/`,
    new URLSearchParams({
      client_key: process.env.NM_API_CLIENT_KEY,
      client_secret: process.env.NM_API_CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 60000
    }
  );

  cachedToken = res.data.token; // from your curl
  tokenExpiry = Date.now() + 50 * 60 * 1000;

  console.log("✅ Token received");

  return cachedToken;
};


/* =====================================================
   PUBLISH COURSE
===================================================== */
export const publishCourseToNM = async (payload) => {
  try {
    const token = await getNMToken();

    const res = await axios.post(
      `${BASE}/lms/client/course/publish/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 120000
      }
    );

    return res.data;

  } catch (err) {
    // auto retry once if token expired
    if (err.response?.status === 401) {
      console.log("♻️ Token expired → retrying...");
      cachedToken = null;
      return publishCourseToNM(payload);
    }

    throw err;
  }
};
