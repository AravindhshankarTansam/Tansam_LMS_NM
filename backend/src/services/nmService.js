import axios from "axios";

/* 🔐 Get NM Token */
export const getNMToken = async () => {
  const res = await axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/token/`,
    new URLSearchParams({
      client_key: process.env.NM_API_CLIENT_KEY,
      client_secret: process.env.NM_API_CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return res.data.token;
};

/* 📤 Publish Course */
export const publishCourseToNM = async (coursePayload) => {
  const token = await getNMToken();

  return axios.post(
    `${process.env.NM_API_BASE_URL}/lms/client/course/publish/`,
    coursePayload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};
