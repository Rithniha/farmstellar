import connectDb from "@/lib/db";
import User from "@/lib/models/User.js";
import Farm from "@/lib/models/Farm.js";
import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return "dev_jwt_secret";
    throw new Error("JWT secret not configured");
  }
  return secret;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      phone,
      name,
      email,
      location,
      city,
      level,
      farmName,
      address,
      size,
      primaryCrop,
      soilType,
      waterSource,
      hasLand,
    } = body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: "Valid phone is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await connectDb();

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        name: name || "",
        phone,
        email: email || null,
        location: location || "",
        city: city || "",
        level: level || "beginner",
        xp: 0,
      });
      await user.save();
    } else {
      user.name = name || user.name;
      if (email) user.email = email;
      if (location) user.location = location;
      if (city) user.city = city || user.city;
      if (level) user.level = level;
      await user.save();
    }

    let farm = null;
    if (hasLand === false || hasLand === "false") {
      // skip
    } else {
      farm = new Farm({
        userId: user._id,
        name: farmName || `${user.name || "Farmer"}'s Farm`,
        address: address || location || "",
        size: size || 0,
        primaryCrop: primaryCrop || "",
      });
      await farm.save();
      user.farm = farm._id;
    }

    user.onboarded = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return new Response(
      JSON.stringify({
        success: true,
        token,
        message: "Profile completed",
        userId: user._id,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("complete-profile error", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to complete profile",
        error: err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
