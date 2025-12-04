import express from "express";
import authRouter from "./routes/auth.js";
import leaderboardRouter from "./routes/leaderboard.js";
import questRoutes from "./routes/quests.js";
import submissionRoutes from "./routes/submissions.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/quests", questRoutes);
router.use("/submissions", submissionRoutes);

router.use("/", (req, res) => {
  res.json({ message: "Welcome to the Farmstellar API" });
});

export default router;
