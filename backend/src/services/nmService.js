import axios from "axios";

/* -------------------------------------------------- */
/* TOKEN */
/* -------------------------------------------------- */
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
      timeout: 60000,
    }
  );

  console.log("✅ Token received");

  return res.data.token;
};

/* -------------------------------------------------- */
/* PUBLISH */
/* -------------------------------------------------- */
export const publishCourseToNM = async (payload) => {
  console.log("🔵 Publishing course...");

  const token = await getNMToken();

  const res = await axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/course/publish/`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  console.log("✅ Course publish success");

  return res;
};
