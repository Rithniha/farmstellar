import connectDb from "@/lib/db";
import jwt from "jsonwebtoken";
import User from "@/lib/models/User.js";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return "dev_jwt_secret";
    throw new Error("JWT secret not configured");
  }
  return secret;
}

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer "))
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing or invalid authorization header",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    const token = auth.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    await connectDb();
    const user = await User.findById(decoded.userId).populate("farm");
    if (!user)
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          city: user.city,
          level: user.level,
          xp: user.xp,
          xpLevel: user.xpLevel,
          onboarded: user.onboarded,
          farm: user.farm,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("me route error", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch user details",
        error: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
