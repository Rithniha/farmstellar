import connectDb from "@/lib/db";
import Submission from "@/lib/models/Submission.js";
import { getUserIdFromRequest } from "@/lib/serverAuth.js";

export async function GET(req, { params }) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId)
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });

    const questId = params.id;
    await connectDb();
    const submissions = await Submission.find({ questId, userId });
    return new Response(JSON.stringify(submissions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Get submissions for quest error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
