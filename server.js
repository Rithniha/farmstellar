import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./server/mongoose/connection.js";
import serverRouter from "./server/index.js";
import mongoose from "mongoose";

// Load environment variables from .env when present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/farmstellar";

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Mongoose connection
mongoose.set("strictQuery", true);

// Health check (mounted under /api)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Mount modular server routes under /api
app.use("/api", serverRouter);

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

// Start server after DB connects
async function start() {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

// Start unless we're in a test runner that handles app lifecycle
if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
