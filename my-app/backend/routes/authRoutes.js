import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateSecuritySettings,
  getSecuritySettings,
  verifyOTP,
  sendSecurityOTP,
  verifyPin,
  uploadProfilePhoto,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/profile/photo", protect, uploadProfilePhoto);
router.post("/change-password", protect, changePassword);
router.post("/security-settings", protect, updateSecuritySettings);
router.get("/security-settings", protect, getSecuritySettings);
router.post("/security-settings/send-otp", protect, sendSecurityOTP);
router.post("/security-settings/verify-pin", protect, verifyPin);
router.post("/verify-otp", verifyOTP);

export default router;
