import connectDb from "@/lib/db";
import User from "@/lib/models/User.js";
import { getUserIdFromRequest } from "@/lib/serverAuth.js";

export async function POST(req, { params }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId)
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    const { stageIndex, status } = await req.json();
    const questId = params.id;

    await connectDb();
    const user = await User.findById(userId);
    if (!user)
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });

    const questProgress = user.questsProgress.find(
      (p) => p.questId.toString() === questId || p.questId === questId
    );
    if (questProgress) {
      questProgress.stageIndex = stageIndex;
      questProgress.status = status;
    } else {
      user.questsProgress.push({ questId, stageIndex, status });
    }

    await user.save();
    return new Response(JSON.stringify(user.questsProgress), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Update quest progress error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
