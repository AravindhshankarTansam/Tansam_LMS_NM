import axios from "axios";
import { getNMToken } from "../services/nmService.js";

export const subscribeCourse = async (req, res) => {
  try {
    const token = await getNMToken();

    const response = await axios.post(
      `${process.env.NM_API_BASE_URL}/nm/api/course/subscribe/`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("Subscribe error:", err.message);
    res.json({ subscription_registration_status: false });
  }
};


export const checkSubscriptionStatus = async (req, res) => {
  try {
    const token = await getNMToken();
    const { course_unique_code, user_email } = req.query;

    const response = await axios.get(
      `${process.env.NM_API_BASE_URL}/nm/api/course/subscription/status/`,
      {
        params: { course_unique_code, user_email },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("Check subscription status error:", err.message);
    res.status(500).json({ error: "Failed to check subscription status" });
  } 
};