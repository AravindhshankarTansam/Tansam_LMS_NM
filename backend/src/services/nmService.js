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
   GET TOKEN  ✅ FIXED
===================================================== */
export const getNMToken = async () => {
  try {
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    console.log("🔐 Getting NM token...");

    const body = new URLSearchParams();
    body.append("client_key", process.env.NM_API_CLIENT_KEY);
    body.append("client_secret", process.env.NM_API_CLIENT_SECRET);

    const res = await axios.post(
      `${BASE}/lms/client/token/`,
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 60000
      }
    );

    console.log("🔑 TOKEN RESPONSE:", res.data);

    // ✅ CORRECT KEY FROM YOUR CURL
    cachedToken = res.data.token;

    tokenExpiry = Date.now() + 50 * 60 * 1000;

    console.log("✅ Token cached successfully");

    return cachedToken;

  } catch (err) {
    console.log("❌ Token fetch failed:", err.response?.data || err.message);
    throw err;
  }
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
    // auto retry if token expired
    if (err.response?.status === 401) {
      console.log("♻️ Token expired → retrying...");
      cachedToken = null;
      return publishCourseToNM(payload);
    }

    throw err;
  }
};
