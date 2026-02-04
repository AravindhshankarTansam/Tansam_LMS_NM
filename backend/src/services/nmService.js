import axios from "axios";
import FormData from "form-data";
import https from "https";

const BASE = process.env.NM_API_BASE_URL;

let cachedToken = null;
let tokenExpiry = 0;


/* =====================================================
   HTTPS AGENT (prevents socket hang up with govt APIs)
===================================================== */
const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false
});


/* =====================================================
   AXIOS DEBUG
===================================================== */
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response) {
      console.log("\n🚨 NM ERROR RESPONSE");
      console.log("STATUS:", err.response.status);
      console.log("DATA:", err.response.data);
    }
    return Promise.reject(err);
  }
);


/* =====================================================
   GET TOKEN  ⭐ FINAL (multipart/form-data like curl)
===================================================== */
export const getNMToken = async () => {
  try {
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    console.log("🔐 Getting NM token...");

    const form = new FormData();
    form.append("client_key", process.env.NM_API_CLIENT_KEY);
    form.append("client_secret", process.env.NM_API_CLIENT_SECRET);

    const res = await axios.post(
      `${BASE}/lms/client/token/`,
      form,
      {
        httpsAgent,
        headers: form.getHeaders(),
        timeout: 60000
      }
    );

    console.log("🔑 TOKEN RESPONSE:", res.data);

    cachedToken = res.data.token;
    tokenExpiry = Date.now() + 50 * 60 * 1000;

    console.log("✅ Token cached");

    return cachedToken;

  } catch (err) {
    console.log("❌ Token fetch failed:", err.message);
    throw err;
  }
};


/* =====================================================
   PUBLISH COURSE
===================================================== */
export const publishCourseToNM = async (payload) => {
  const token = await getNMToken();

  const res = await axios.post(
    `${BASE}/lms/client/course/publish/`,
    payload,
    {
      httpsAgent,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      timeout: 120000
    }
  );

  return res.data;
};
