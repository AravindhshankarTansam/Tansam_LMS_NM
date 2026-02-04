import axios from "axios";

const BASE = process.env.NM_API_base_url;

let cachedToken = null;
let tokenExpiry = 0;

/* =====================================================
   GET TOKEN
===================================================== */
export async function getNMToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log("$$$$ Getting NM token...");

  const res = await axios.post(
    `${BASE}/token`,
    {
      client_key: process.env.NM_API_client_key,
      client_secret: process.env.NM_API_client_secret
    },
    { timeout: 60000 }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + (50 * 60 * 1000);

  return cachedToken;
}

/* =====================================================
   PUBLISH COURSE
===================================================== */
export async function publishCourseToNM(payload) {
  const token = await getNMToken();

  return axios.post(
    `${BASE}/courses/publish`,
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
