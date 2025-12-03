import mongoose from "mongoose";

// Simple mongoose connection helper. Call `connectDB(uri)` to connect.
export async function connectDB(uri) {
  if (!uri) throw new Error("MongoDB URI is required");
  // Mongoose v6+ uses sensible defaults; pass only the URI here.
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
  return mongoose;
}

export default mongoose;
