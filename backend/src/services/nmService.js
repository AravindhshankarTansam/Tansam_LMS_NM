import axios from "axios";

const BASE = process.env.NM_API_BASE_URL;

let cachedToken = null;
let tokenExpiry = 0;


/* =====================================================
   AXIOS DEBUG INTERCEPTOR (🔥 shows real NM errors)
===================================================== */
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response) {
      console.log("\n🚨 AXIOS ERROR INTERCEPTOR");
      console.log("STATUS:", err.response.status);
      console.log("DATA:", err.response.data);
    }
    return Promise.reject(err);
  }
);


/* =====================================================
   GET TOKEN
===================================================== */
export async function getNMToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log("🔐 Getting NM token...");

  const res = await axios.post(
    `${BASE}/lms/client/token/`,
    {
      client_key: process.env.NM_API_CLIENT_KEY,
      client_secret: process.env.NM_API_CLIENT_SECRET
    },
    { timeout: 60000 }
  );

  cachedToken = res.data.access_token;

  // cache 50 mins
  tokenExpiry = Date.now() + 50 * 60 * 1000;

  return cachedToken;
}


/* =====================================================
   PUBLISH COURSE
===================================================== */
export async function publishCourseToNM(payload) {
  const token = await getNMToken();

  return axios.post(
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
}
