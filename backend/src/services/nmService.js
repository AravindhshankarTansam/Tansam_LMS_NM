import axios from "axios";
import https from "https";

/* 🔥 FORCE HTTP/1.1 + STABLE TLS */
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 1,
  rejectUnauthorized: false,
  ALPNProtocols: ["http/1.1"], // ⭐ VERY IMPORTANT
});

/* -------------------------------------------------- */
/* TOKEN */
/* -------------------------------------------------- */
export const getNMToken = async () => {
  console.log("🔵 Getting NM token...");

  const res = await axios({
    method: "post",
    url: `${process.env.NM_API_BASE_URL}/lms/client/token/`,
    data: new URLSearchParams({
      client_key: process.env.NM_API_CLIENT_KEY,
      client_secret: process.env.NM_API_CLIENT_SECRET,
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    httpsAgent,
    timeout: 60000, // increase
    httpAgent: httpsAgent,
    maxRedirects: 0,
  });

  console.log("✅ Token received");

  return res.data.token;
};

/* -------------------------------------------------- */
/* PUBLISH */
/* -------------------------------------------------- */
export const publishCourseToNM = async (payload) => {
  console.log("🔵 Publishing course...");

  const token = await getNMToken();

  const res = await axios({
    method: "post",
    url: `${process.env.NM_API_BASE_URL}/lms/client/course/publish/`,
    data: payload,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    httpsAgent,
    timeout: 60000,
    httpAgent: httpsAgent,
  });

  console.log("✅ Course publish success");

  return res;
};
