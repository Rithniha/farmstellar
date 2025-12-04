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
    const submissionId = params.submissionId;
    await connectDb();
    const submission = await Submission.findOne({ _id: submissionId, userId });
    if (!submission)
      return new Response(JSON.stringify({ message: "Submission not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    return new Response(JSON.stringify(submission), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Get submission by id error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
