import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
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
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      // these options are the defaults in modern mongoose, kept for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
});

// Example resource: Crops
const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  plantedAt: { type: Date, default: Date.now },
  notes: String,
});
const Crop = mongoose.models.Crop || mongoose.model("Crop", cropSchema);

app.get("/api/crops", async (req, res, next) => {
  try {
    const crops = await Crop.find().lean();
    res.json(crops);
  } catch (err) {
    next(err);
  }
});

app.post("/api/crops", async (req, res, next) => {
  try {
    const crop = new Crop(req.body);
    await crop.save();
    res.status(201).json(crop);
  } catch (err) {
    next(err);
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Server error" });
});

// Start server after DB connects
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

// Start unless we're in a test runner that handles app lifecycle
if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
