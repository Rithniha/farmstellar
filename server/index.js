import express from "express";
import cropsRouter from "./routes/crops.js";

const router = express.Router();

router.use("/crops", cropsRouter);

export default router;
