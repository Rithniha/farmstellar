import express from "express";
import { getCrops, createCrop } from "../controllers/cropsController.js";

const router = express.Router();

router.get("/", getCrops);
router.post("/", createCrop);

export default router;
