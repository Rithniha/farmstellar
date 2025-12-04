import connectDb from "@/lib/db";
import User from "@/lib/models/User.js";

export async function GET(req) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit")) || 10;

    const topUsers = await User.find()
      .select("name xp xpLevel")
      .sort({ xpLevel: -1, xp: -1 })
      .limit(limit);

    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.xp,
      xpLevel: user.xpLevel,
      badges: 0,
    }));

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Leaderboard API error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
