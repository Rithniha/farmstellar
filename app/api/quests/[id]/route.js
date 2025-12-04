import connectDb from "@/lib/db";
import Quest from "@/lib/models/Quest.js";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    await connectDb();
    const quest = await Quest.findById(id);
    if (!quest)
      return new Response(JSON.stringify({ message: "Quest not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    return new Response(JSON.stringify(quest), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Get quest by id error", err);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
