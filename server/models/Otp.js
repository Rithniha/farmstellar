import mongoose, { Schema, model } from "mongoose";

const OtpSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index could be added in Mongo for automatic expiry, but we'll check expiresAt in code.
export default model("Otp", OtpSchema);
