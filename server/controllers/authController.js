import { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Farm from "../models/Farm.js";
import { sendOTPService, verifyOTPService } from "../services/twilioService.js";
import Otp from "../models/Otp.js";

const { sign } = jwt;

// Helper: generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper to obtain JWT secret. In development a fallback secret is provided
// to avoid runtime crashes, but in production the env var must be set.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠ JWT_SECRET not set — using development fallback secret. Do NOT use in production."
      );
      return "dev_jwt_secret";
    }
    throw new Error("JWT secret is not configured (process.env.JWT_SECRET)");
  }
  return secret;
}

export async function signup(req, res) {
  try {
    const { name, email, password, location, phone, city } = req.body;

    // Check if user exists by email or phone
    const existingUser = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await hash(password, 10);

    const user = new User({ name, email, phone, passwordHash, location, city });
    await user.save();
    console.log("User created:", user._id);

    const farm = new Farm({ userId: user._id, name: `${name}'s Farm` });
    await farm.save();
    console.log("Farm created:", farm._id);

    user.farm = farm._id;
    await user.save();
    console.log("User updated with farm ID.");

    const token = sign({ userId: user._id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function login(req, res) {
  try {
    // Phone-only login: trigger OTP send
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone is required" });
    }

    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number format" });
    }

    // Create OTP and persist in DB (so verification works across processes/restarts)
    const otp =
      process.env.NODE_ENV === "development" ? "123456" : generateOtp();
    const expiresAt = new Date(Date.now() + DEFAULT_OTP_TTL_MS);

    // Upsert OTP document for this phone
    await Otp.findOneAndUpdate(
      { phone },
      { phone, otp, expiresAt, consumed: false, attempts: 0 },
      { upsert: true, new: true }
    );

    console.log("Generated OTP for", phone);

    // Send OTP via service (pass the generated otp so the service can deliver it)
    const sendResult = await sendOTPService(phone, otp);

    const response = { success: true, message: "OTP generated" };

    if (process.env.NODE_ENV === "development") {
      // For dev convenience return the sample OTP to clients
      response.sampleOtp = otp;
      if (sendResult && sendResult.otp) response.sampleOtp = sendResult.otp;
    }
    return res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// Send OTP for phone verification
export async function sendOTP(req, res) {
  try {
    const { phone } = req.body;

    console.log("Send OTP request:", { phone });

    if (!phone) {
      console.log("Error: Phone number missing");
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    // Validate phone format (10 digits)
    if (!/^\d{10}$/.test(phone)) {
      console.log("Error: Invalid phone format:", phone);
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number format" });
    }

    console.log("Sending OTP to:", phone);

    const otp =
      process.env.NODE_ENV === "development" ? "123456" : generateOtp();
    const expiresAt = new Date(Date.now() + DEFAULT_OTP_TTL_MS);

    // Persist OTP in DB
    await Otp.findOneAndUpdate(
      { phone },
      { phone, otp, expiresAt, consumed: false, attempts: 0 },
      { upsert: true, new: true }
    );

    // Send via service (pass otp so that SMS service sends the exact code)
    const sendResult = await sendOTPService(phone, otp);
    console.log("Send OTP result:", sendResult);

    const response = { success: true, message: "OTP sent" };
    if (
      process.env.NODE_ENV === "development" &&
      sendResult &&
      sendResult.otp
    ) {
      response.sampleOtp = sendResult.otp;
    } else if (process.env.NODE_ENV === "development") {
      response.sampleOtp = otp;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
}

// Verify OTP
export async function verifyOTP(req, res) {
  try {
    const { phone, otp } = req.body;

    console.log("Verify OTP request:", { phone, otp });

    if (!phone || !otp) {
      console.log("Missing phone or OTP");
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP are required" });
    }

    // Validate phone format
    if (!/^\d{10}$/.test(phone)) {
      console.log("Invalid phone format:", phone);
      return res
        .status(400)
        .json({ success: false, message: "Invalid phone number format" });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      console.log("Invalid OTP format:", otp);
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP format" });
    }
    // Check DB-backed OTP first (works for dev and prod when we persisted OTP)
    const otpEntry = await Otp.findOne({ phone, consumed: false }).sort({
      createdAt: -1,
    });

    let verified = false;
    let reason = "Invalid OTP";

    if (otpEntry) {
      if (Date.now() > new Date(otpEntry.expiresAt).getTime()) {
        reason = "OTP expired";
      } else if (otpEntry.otp === otp) {
        verified = true;
      } else {
        // increment attempts
        otpEntry.attempts = (otpEntry.attempts || 0) + 1;
        await otpEntry.save();
        if (otpEntry.attempts >= 3) reason = "Too many failed attempts";
      }
    } else {
      // Fall back to external verification if DB entry not found (legacy path)
      const external = await verifyOTPService(phone, otp);
      if (external && external.success) verified = true;
      else
        reason =
          external && external.message
            ? external.message
            : "OTP not found or expired";
    }

    if (verified) {
      // mark consumed if there was an entry
      if (otpEntry) {
        otpEntry.consumed = true;
        await otpEntry.save();
      }
      // Check if user exists
      const user = await User.findOne({ phone });

      if (user) {
        // Existing user - generate token
        const token = sign({ userId: user._id }, getJwtSecret(), {
          expiresIn: "7d",
        });
        console.log("Existing user logged in:", user._id);
        return res.status(200).json({
          success: true,
          token,
          isNewUser: false,
          message: "OTP verified successfully",
        });
      } else {
        // New user - return success but no token (they need to complete signup)
        console.log("New user verified:", phone);
        return res.status(200).json({
          success: true,
          isNewUser: true,
          message: "OTP verified. Please complete your profile.",
        });
      }
    } else {
      console.log("OTP verification failed:", reason);
      return res.status(400).json({ success: false, message: reason });
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
}

// Complete profile and onboard user (create User & Farm, return token)
export async function completeProfile(req, res) {
  try {
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
    } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid phone is required" });
    }

    // If user exists, update profile and create farm if missing
    let user = await User.findOne({ phone });

    if (!user) {
      // Create user record (passwordHash left empty for OTP users)
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
      console.log("Created new user during onboarding:", user._id);
    } else {
      // Update user fields
      user.name = name || user.name;
      if (email) user.email = email;
      if (location) user.location = location;
      if (city) user.city = city || user.city;
      if (level) user.level = level;
      await user.save();
      console.log("Updated existing user during onboarding:", user._id);
    }

    // Create farm if details provided
    let farm = null;
    if (hasLand === false || hasLand === "false") {
      // user has no farm; skip creating
      console.log("User reported no farm during onboarding");
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
      console.log("Created farm for user:", farm._id);
    }

    user.onboarded = true;
    await user.save();

    // Issue JWT
    const token = sign({ userId: user._id }, getJwtSecret(), {
      expiresIn: "7d",
    });

    return res.status(200).json({
      success: true,
      token,
      message: "Profile completed",
      userId: user._id,
    });
  } catch (error) {
    console.error("Complete profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete profile",
      error: error.message,
    });
  }
}

// Get current user details (requires JWT token in Authorization header)
export async function getMe(req, res) {
  try {
    // Extract token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token payload" });
    }

    // Fetch user from database
    const user = await User.findById(userId).populate("farm");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
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
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user details",
      error: error.message,
    });
  }
}

// Logout endpoint (server-side cleanup, audit logging, etc.)
export async function logout(req, res) {
  try {
    // Extract token from Authorization header for audit logging
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, getJwtSecret());
        userId = decoded.userId;
        console.log("User logged out:", userId);
      } catch (err) {
        console.warn("Failed to decode logout token for audit", err);
      }
    }

    // In a production app, you might:
    // - Invalidate the token in a blacklist/cache
    // - Log the logout event for audit purposes
    // - Update user's last_logout timestamp
    // For now, we just confirm the logout

    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
      userId,
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
      error: error.message,
    });
  }
}
