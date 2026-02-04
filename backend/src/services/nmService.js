import axios from "axios";
import https from "https";

/* 🔥 GOV API TLS FIX */
const httpsAgent = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false,   // important for gov cert chains
});

/* ---------------------------------------------------- */
/* 🔐 Get NM Token */
/* ---------------------------------------------------- */
export const getNMToken = async () => {
  console.log("🔵 Getting NM token...");

  const res = await axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/token/`,
    new URLSearchParams({
      client_key: process.env.NM_API_CLIENT_KEY,
      client_secret: process.env.NM_API_CLIENT_SECRET,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      httpsAgent,
      timeout: 20000,
      maxRedirects: 0,
      httpAgent: httpsAgent,
    }
  );

  console.log("✅ Token received");

  return res.data.token;
};

/* ---------------------------------------------------- */
/* 📤 Publish Course */
/* ---------------------------------------------------- */
export const publishCourseToNM = async (coursePayload) => {
  console.log("🔵 Publishing course to NM...");

  const token = await getNMToken();

  const res = await axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/course/publish/`,
    coursePayload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      httpsAgent,
      timeout: 30000,
      httpAgent: httpsAgent,
    }
  );

  console.log("✅ Course publish success");

  return res;
};
