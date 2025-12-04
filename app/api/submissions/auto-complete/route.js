import connectDb from "@/lib/db";
import User from "@/lib/models/User.js";
import { getUserIdFromRequest } from "@/lib/serverAuth.js";

const QUEST_XP_REWARDS = {
  soil_scout: 10,
  crop_quest: 75,
  compost_kickoff: 40,
  zero_waste: 85,
  mini_garden: 100,
  mulch_master: 60,
  boll_keeper: 150,
  coconut_basin: 140,
  coconut_bioenzyme: 180,
  rust_shield: 160,
  biodiversity_strip: 190,
  rainwater_hero: 185,
  biochar_maker: 200,
  jeevamrutham: 150,
  crops: 75,
  soil: 10,
  compost: 40,
};

export async function POST(req) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId)
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    const { questId } = await req.json();
    if (!questId)
      return new Response(JSON.stringify({ message: "Quest ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const xpReward = QUEST_XP_REWARDS[questId] || 0;
    if (xpReward === 0)
      return new Response(
        JSON.stringify({
          message: "Invalid quest ID or quest has no XP reward",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    await connectDb();
    const user = await User.findById(userId);
    if (!user)
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });

    const existingProgress = user.questsProgress.find(
      (p) =>
        (p.questId === questId || p.questId.toString() === questId) &&
        p.status === "completed"
    );
    if (existingProgress)
      return new Response(
        JSON.stringify({ message: "Quest already completed" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );

    const questProgress = user.questsProgress.find(
      (p) => p.questId === questId || p.questId.toString() === questId
    );
    if (questProgress) {
      questProgress.status = "completed";
    } else {
      user.questsProgress.push({
        questId: questId,
        stageIndex: 0,
        status: "completed",
      });
    }

    user.xp += xpReward;
    const newLevel = Math.floor(user.xp / 100) + 1;
    const leveledUp = newLevel > (user.xpLevel || 0);
    if (leveledUp) user.xpLevel = newLevel;

    await user.save();

    return new Response(
      JSON.stringify({
        message: "Quest completed successfully",
        questId,
        xpAwarded: xpReward,
        updatedXP: user.xp,
        updatedLevel: user.xpLevel,
        leveledUp,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Auto-complete quest error:", err);
    return new Response(
      JSON.stringify({ message: "Server error", error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
