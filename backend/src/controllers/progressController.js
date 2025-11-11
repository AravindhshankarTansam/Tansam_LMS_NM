import { connectDB } from "../config/db.js";
import { calculateReward } from "../utils/rewardCalculator.js";
/**
 * ✅ Update or insert user progress
 * Tracks completion percentage and last visited chapter/module
 */


export const updateProgress = async (req, res) => {
  const db = await connectDB();
  const {
    custom_id,
    user_email,
    course_id,
    module_id,
    chapter_id,
    progress_percent,
  } = req.body;

  try {
    if (!custom_id || !course_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Update or insert progress
    await db.run(
      `INSERT OR REPLACE INTO user_progress (custom_id, user_email, course_id, module_id, chapter_id, progress_percent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        custom_id,
        user_email || null,
        course_id,
        module_id,
        chapter_id,
        progress_percent || 0,
      ]
    );

    // 2️⃣ Calculate if a reward should be assigned
    const reward = calculateReward(progress_percent);

    if (reward) {
      const existing = await db.get(
        `SELECT * FROM rewards WHERE custom_id = ? AND course_id = ? AND reward_name = ?`,
        [custom_id, course_id, reward.reward_name]
      );

      if (!existing) {
        await db.run(
          `INSERT INTO rewards (custom_id, user_email, course_id, reward_name, reward_points, achieved_percent, created_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            custom_id,
            user_email || null,
            course_id,
            reward.reward_name,
            reward.points,
            progress_percent,
          ]
        );
      }
    }

    res.json({
      message: "✅ Progress updated successfully",
      reward: reward
        ? `🏅 ${reward.reward_name} unlocked!`
        : "ℹ️ No new reward yet",
    });
  } catch (error) {
    console.error("Error updating progress:", error.message);
    res.status(500).json({ message: "Error updating progress" });
  }
};


/**
 * ✅ Get user progress by custom_id
 */
export const getUserProgress = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;

  try {
    const progress = await db.all(
      `SELECT * FROM user_progress WHERE custom_id = ? ORDER BY updated_at DESC`,
      [custom_id]
    );

    if (!progress || progress.length === 0) {
      return res.json({ message: "No progress found for this user" });
    }

    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error.message);
    res.status(500).json({ message: "Error fetching progress" });
  }
};
