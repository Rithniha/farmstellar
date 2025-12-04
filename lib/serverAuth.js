import jwt from "jsonwebtoken";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return "dev_jwt_secret";
    throw new Error("JWT secret not configured");
  }
  return secret;
}

export function getUserIdFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded.userId || null;
  } catch (e) {
    return null;
  }
}
