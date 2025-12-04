import { Router } from "express";
const router = Router();
import {
  getQuests,
  getQuestById,
  updateQuestProgress,
} from "../controllers/questController";
import {
  createSubmission,
  getSubmissionsForQuest,
} from "../controllers/submissionController";
import authMiddleware from "../middleware/authMiddleware";

router.get("/", authMiddleware, getQuests);
router.get("/:id", authMiddleware, getQuestById);
router.post("/:id/progress", authMiddleware, updateQuestProgress);

router.post("/:id/submissions", authMiddleware, createSubmission);
router.get("/:id/submissions", authMiddleware, getSubmissionsForQuest);

export default router;
