import User from "../../lib/models/User.js";

export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get top users by xpLevel, then by xp
    const topUsers = await User.find()
      .select("name xp xpLevel")
      .sort({ xpLevel: -1, xp: -1 })
      .limit(limit);

    // Format the response
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.xp,
      xpLevel: user.xpLevel,
      badges: 0, // TODO: Add badges count when badge system is implemented
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
