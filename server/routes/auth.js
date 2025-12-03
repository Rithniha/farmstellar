import express from "express";
const router = express.Router();
import * as authController from "../controllers/authController.js";

// router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/complete-profile", authController.completeProfile);
router.get("/me", authController.getMe);
router.post("/logout", authController.logout);

export default router;
