const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const { analyzeDocument } = require("../services/geminiService");
// =====================================================
// SAFE FILE DELETE
// =====================================================
const deleteUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Uploaded file cleaned up:", filePath);
    }
  } catch (error) {
    console.log("File cleanup error:", error);
  }
};

// =====================================================
// UPLOAD DOCUMENT
// =====================================================

exports.uploadDocument = async (req, res) => {
  let uploadedFilePath = "";

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    uploadedFilePath = file.path;

    let extractedText = "";
    let wordBoxes = [];

    const ext = path.extname(file.originalname).toLowerCase();

    // =================================================
    // PDF
    // =================================================

    if (ext === ".pdf") {
      try {
        const fileBuffer = fs.readFileSync(file.path);

        const data = await pdfParse(fileBuffer);

        extractedText = data.text.trim();

        console.log(
          "PDF Text Length:",
          extractedText.length
        );

        // If PDF text is not available, use OCR
        if (extractedText.length < 10) {
          console.log(
            "Using OCR for scanned PDF..."
          );

          const result = await Tesseract.recognize(
            file.path,
            "eng"
          );

          extractedText = result.data.text.trim();

          wordBoxes = (result.data.words || []).map(
            (word) => ({
              text: word.text,
              bbox: word.bbox,
            })
          );
        }
      } catch (err) {
        console.log(
          "PDF Parse Failed. OCR Started..."
        );

        const result = await Tesseract.recognize(
          file.path,
          "eng"
        );

        extractedText = result.data.text.trim();

        wordBoxes = (result.data.words || []).map(
          (word) => ({
            text: word.text,
            bbox: word.bbox,
          })
        );
      }
    }

    // =================================================
    // IMAGE
    // =================================================

    else if (
      ext === ".jpg" ||
      ext === ".jpeg" ||
      ext === ".png"
    ) {
      console.log(
        "Reading Image with OCR..."
      );

      const result = await Tesseract.recognize(
        file.path,
        "eng"
      );

      extractedText = result.data.text.trim();

      wordBoxes = (result.data.words || []).map(
        (word) => ({
          text: word.text,
          bbox: word.bbox,
        })
      );
    }

    // =================================================
    // UNSUPPORTED FILE
    // =================================================

    else {
      deleteUploadedFile(uploadedFilePath);

      return res.status(400).json({
        message:
          "Unsupported file type. Only PDF, JPG, JPEG and PNG are supported.",
      });
    }

    // =================================================
    // CHECK EXTRACTED TEXT
    // =================================================

    console.log(
      "Extracted Text:",
      extractedText.substring(0, 300)
    );

    // If no readable text was found
    if (!extractedText.trim()) {
      deleteUploadedFile(uploadedFilePath);

      return res.status(400).json({
        message:
          "No readable text found in the document.",
      });
    }

    // =================================================
    // AI DOCUMENT ANALYSIS
    // =================================================

    console.log(
      "Generating AI category and summary..."
    );

    let aiResult;

    try {
      aiResult = await analyzeDocument(
        file.originalname,
        extractedText
      );
    } catch (error) {
      console.log(
        "AI Document Analysis Error:",
        error
      );

      deleteUploadedFile(uploadedFilePath);

      return res.status(500).json({
        message:
          "Document analysis failed. Please try again.",
      });
    }

    const category =
      aiResult?.category || "Other";

    const summary =
      aiResult?.summary ||
      "Summary not available.";

    console.log(
      "AI Category:",
      category
    );

    console.log(
      "AI Summary:",
      summary
    );

    // =================================================
    // SAVE TO DATABASE
    // =================================================

    const sql = `
      INSERT INTO documents
      (
        file_name,
        file_path,
        extracted_text,
        category,
        summary,
        tags,
        word_boxes,
        user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        file.originalname,
        file.filename,
        extractedText,
        category,
        summary,
        "",
        JSON.stringify(wordBoxes),
        req.user.id,
      ],
      (err, result) => {
        if (err) {
          console.log(
            "Database Insert Error:",
            err
          );

          // Remove uploaded file if DB save fails
          deleteUploadedFile(uploadedFilePath);

          return res.status(500).json({
            message:
              "Failed to save document.",
          });
        }

        // =================================================
        // SUCCESS
        // =================================================

        res.json({
          message:
            "File uploaded and analyzed successfully",

          document: {
            id: result.insertId,
            file_name: file.originalname,
            category: category,
            summary: summary,
          },
        });
      }
    );
  } catch (error) {
    console.log(
      "Upload Error:",
      error
    );

    // Cleanup uploaded file if unexpected error occurs
    deleteUploadedFile(uploadedFilePath);

    res.status(500).json({
      message:
        "Failed to process the document. Please try again.",
    });
  }
};

// =====================================================
// GET ALL DOCUMENTS
// =====================================================

exports.getAllDocuments = (req, res) => {
  const sql =
    "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC";

  db.query(
    sql,
    [req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message:
            "Failed to fetch documents",
          error: err.message,
        });
      }

      res.json(result);
    }
  );
};

// =====================================================
// SEARCH DOCUMENTS
// =====================================================

exports.searchDocuments = (req, res) => {
  const keyword =
    req.query.keyword || "";

  const searchKeyword =
    `%${keyword}%`;

  const sql = `
    SELECT *
    FROM documents
    WHERE user_id = ?
    AND (
      file_name LIKE ?
      OR extracted_text LIKE ?
      OR category LIKE ?
      OR summary LIKE ?
    )
    ORDER BY created_at DESC
  `;

  db.query(
    sql,
    [
      req.user.id,
      searchKeyword,
      searchKeyword,
      searchKeyword,
      searchKeyword,
    ],
    (err, result) => {
      if (err) {
        console.log(
          "Search Error:",
          err
        );

        return res.status(500).json({
          message:
            "Search failed",
          error: err.message,
        });
      }

      res.json(result);
    }
  );
};

// =====================================================
// DELETE DOCUMENT
// =====================================================

exports.deleteDocument = (req, res) => {
  const documentId =
    req.params.id;

  const userId =
    req.user.id;

  // =================================================
  // FIND DOCUMENT
  // =================================================

  const selectSql = `
    SELECT file_path
    FROM documents
    WHERE id = ?
    AND user_id = ?
  `;

  db.query(
    selectSql,
    [documentId, userId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message:
            "Database error",
        });
      }

      // Document not found
      if (result.length === 0) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const fileName =
        result[0].file_path;

      // =================================================
      // DELETE DATABASE RECORD
      // =================================================

      const deleteSql = `
        DELETE FROM documents
        WHERE id = ?
        AND user_id = ?
      `;

      db.query(
        deleteSql,
        [documentId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({
              message:
                "Failed to delete document",
            });
          }

          // =================================================
          // DELETE PHYSICAL FILE
          // =================================================

          const filePath =
            path.join(
              __dirname,
              "../uploads",
              fileName
            );

          if (fs.existsSync(filePath)) {
            fs.unlink(
              filePath,
              (err) => {
                if (err) {
                  console.log(
                    "File deletion error:",
                    err
                  );
                }
              }
            );
          }

          res.json({
            message:
              "Document deleted successfully",
          });
        }
      );
    }
  );
};
