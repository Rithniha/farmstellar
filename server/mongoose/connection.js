import mongoose from "mongoose";

// Simple mongoose connection helper. Call `connectDB(uri)` to connect.
export async function connectDB(uri) {
  if (!uri) throw new Error("MongoDB URI is required");
  // Mongoose v6+ uses sensible defaults; pass only the URI here.
  await mongoose.connect(uri);
  return mongoose;
}

export default mongoose;
