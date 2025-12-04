import connectDb from "@/lib/db";
import Quest from "@/lib/models/Quest.js";

export async function GET(req) {
  try {
    await connectDb();
    const quests = await Quest.find({ active: true });
    return new Response(JSON.stringify(quests), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Get quests error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
