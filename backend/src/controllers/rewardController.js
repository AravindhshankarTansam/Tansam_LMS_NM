import { connectDB } from "../config/db.js";

/**
 * ✅ Get all rewards for a user (by custom_id)
 */
export const getRewards = async (req, res) => {
  const db = await connectDB();
  const { custom_id } = req.params;

  try {
    const rewards = await db.all(
      `SELECT * FROM rewards WHERE custom_id = ? ORDER BY achieved_percent ASC`,
      [custom_id]
    );
    res.json(rewards);
  } catch (error) {
    console.error("Error fetching rewards:", error.message);
    res.status(500).json({ message: "Error fetching rewards" });
  }
};

/**
 * ✅ Update a reward manually (optional for admin)
 */
export const updateReward = async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  const { reward_name, reward_points, achieved_percent } = req.body;

  try {
    await db.run(
      `UPDATE rewards 
       SET reward_name = ?, reward_points = ?, achieved_percent = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reward_name, reward_points, achieved_percent, id]
    );

    res.json({ message: "🎯 Reward updated successfully" });
  } catch (error) {
    console.error("Error updating reward:", error.message);
    res.status(500).json({ message: "Error updating reward" });
  }
};
