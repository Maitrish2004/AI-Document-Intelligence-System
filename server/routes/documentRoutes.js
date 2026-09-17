const express = require("express");
const router = express.Router();

const documentController = require("../controllers/documentController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload document
router.post(
  "/upload",
  authMiddleware,
  upload.single("document"),
  documentController.uploadDocument
);

// Get all documents
router.get(
  "/all",
  authMiddleware,
  documentController.getAllDocuments
);

// Search documents
router.get(
  "/search",
  authMiddleware,
  documentController.searchDocuments
);
// Delete document
router.delete(
  "/:id",
  authMiddleware,
  documentController.deleteDocument
);
module.exports = router;
