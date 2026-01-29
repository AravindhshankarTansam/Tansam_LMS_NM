import { subscribeKP, accessKP, progressKP, } from "../services/kpService.js";

// Subscribe
export const subscribeCourse = async (req, res) => {
  try {
    const payload = {
      user_id: req.user.custom_id, // ✅ from JWT
      course_id: req.body.course_id,
      ...req.body,
    };

    const { data } = await subscribeKP(payload);

    res.json(data);
  } catch (err) {
    console.error(err.response?.data);
    res.json({ subscription_registration_status: false });
  }
};

// Access
export const accessCourse = async (req, res) => {
  try {
    const payload = {
      user_id: req.user.custom_id,
      course_id: req.body.course_id,
    };

    const { data } = await accessKP(payload);

    res.json(data);
  } catch {
    res.json({ access_status: false });
  }
};

// Progress
export const getProgress = async (req, res) => {
  try {
    const payload = {
      user_id: req.user.custom_id,
      course_id: req.body.course_id,
    };

    const { data } = await progressKP(payload);

    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};
