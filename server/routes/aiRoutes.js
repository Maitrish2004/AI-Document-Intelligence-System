const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

// Ask AI about documents
router.post(
  "/ask",
  authMiddleware,
  aiController.askAI
);

module.exports = router;
