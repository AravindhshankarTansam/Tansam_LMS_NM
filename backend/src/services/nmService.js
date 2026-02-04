import axios from "axios";
import https from "https";

/* ⭐ FORCE IPv4 ONLY */
const agent = new https.Agent({
  family: 4
});

/* TOKEN */
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
      httpsAgent: agent,
      timeout: 30000
    }
  );

  console.log("✅ Token received");

  return res.data.token;
};

/* PUBLISH */
export const publishCourseToNM = async (payload) => {
  console.log("🔵 Publishing course...");

  const token = await getNMToken();

  return axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/course/publish/`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      httpsAgent: agent,
      timeout: 30000
    }
  );
};
