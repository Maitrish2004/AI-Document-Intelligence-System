const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Reset Password
router.post("/reset-password", authController.resetPassword);

// Profile (protected)
router.get("/profile", authMiddleware, authController.profile);

module.exports = router;
