import axios from "axios";

const kp = axios.create({
  baseURL: process.env.KP_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.KP_TOKEN}`,
    "Content-Type": "application/json",
  },
});

export const subscribeKP = (payload) =>
  kp.post("/course/subscribe/", payload);

export const accessKP = (payload) =>
  kp.post("/course/access/", payload);

export const progressKP = (payload) =>
  kp.post("/student/progress", payload);


