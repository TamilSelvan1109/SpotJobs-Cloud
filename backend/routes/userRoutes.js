import express from "express";
import multer from "multer";
import {
  applyForJob,
  getUserData,
  getUserDataById,
  getUserJobApplications,
  isApplied,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
  updateUserResume,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Register a user
router.post("/register", upload.single("image"), registerUser);

// Login a user
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// Update user details
router.post(
  "/profile/update",
  isAuthenticated,
  upload.single("image"),
  updateUserProfile
);

// Update user resume
router.patch(
  "/profile/update-resume",
  isAuthenticated,
  upload.single("resume"),
  updateUserResume
);

router.get("/logout", isAuthenticated, logoutUser);

// Get a user data
router.get("/user", isAuthenticated, getUserData);

// Get a user data by Id
router.get("/user/:id", getUserDataById);

// Apply for a job
router.post("/apply", isAuthenticated, applyForJob);

// Get user applied jobs data
router.get("/applications", isAuthenticated, getUserJobApplications);

// To check the job is already applied or not
router.post("/check-applied", isAuthenticated, isApplied);

export default router;
