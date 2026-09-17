const db = require("../config/db");
const { askGemini } = require("../services/geminiService");
const path = require("path");
const { findAnswerPage } = require("../utils/answerLocator");
const { renderPdfPage } = require("../utils/pdfRenderer");
const { highlightPage } = require("../utils/pageHighlighter");
const { getRelevantContext } = require("../utils/similarityMatcher");
//Ask AI about documents
exports.askAI = async (req, res) => {
  let matchedDocument = "";
  let matchedPage = null;
  let highlightImagePath = "";
  // NEW:
  // Original source image/page
  let sourceImagePath = "";
  //NEW:
  // Exact highlight box for live frontend animation
  let highlightBox = null;
    try {
    const { question } = req.body;
    const userId = req.user.id;
    const sql = "SELECT * FROM documents WHERE user_id = ?";
    db.query(sql, [userId], async (err, docs) => {
      if (err) return res.status(500).json(err);
   const context = getRelevantContext(question, docs);
    if (context === "") {
        return res.json({
          answer:
            "No analyzed documents found. Please upload and analyze a document first.",
        });
      }
      console.log("========== CONTEXT ==========");
      console.log(context);
      console.log("Context Length:", context.length);
      console.log("=============================");
      const aiResult = await askGemini(question, context);
      const answer = aiResult.answer;
      const sourceFile = aiResult.source_file;

      for (const doc of docs) {
        if (
          sourceFile &&
          doc.file_name.toLowerCase().trim() !==
            sourceFile.toLowerCase().trim()
        ) {
          continue;
        }
       const ext = path.extname(doc.file_name).toLowerCase();
        //=========================================================
        // PDF
        // =========================================================
        if (ext === ".pdf") {
          const pdfPath = path.join(
            __dirname,
            "../uploads",
            doc.file_path
          );

          const result = await findAnswerPage(
            pdfPath,
            answer
          );

          if (!result.found) {
            continue;
          }
          matchedDocument = doc.file_name;
          matchedPage = result.page;
          const rendered = await renderPdfPage(
            pdfPath,
            result.page
          );

          if (!rendered.success) {
            matchedDocument = "";
            matchedPage = null;
            continue;
          }

          // Original rendered PDF page
          sourceImagePath =
            "/highlights/" + rendered.imageName;

          if (result.box) {
            // -----------------------------------------------------
            // EXISTING HIGHLIGHT LOGIC
            // -----------------------------------------------------
            const highlighted = await highlightPage(
              rendered.imagePath,
              {
                ...result.box,
                pageWidth: rendered.pageWidth,
                pageHeight: rendered.pageHeight,
                renderScale: rendered.renderScale,
              }
            );
           if(highlighted.success) {
              highlightImagePath =
                "/highlights/" +
                highlighted.imageName;
            } else {
              highlightImagePath =
                "/highlights/" +
                rendered.imageName;
            }

            // -----------------------------------------------------
            // NEW:
            // Convert EXACT same coordinates used by
            // pageHighlighter.js into rendered image coordinates.
            //
            // Existing highlight position is NOT changed.
            // -----------------------------------------------------

            const imgWidth = rendered.pageWidth;
            const imgHeight = rendered.pageHeight;
            const PDF_WIDTH =
              result.box.pageWidth || imgWidth;
             const PDF_HEIGHT =
              result.box.pageHeight || imgHeight;
            const scaleX =
              imgWidth / PDF_WIDTH;
             const scaleY =
              imgHeight / PDF_HEIGHT;

            const padding = 6;

            const x = Math.max(
              0,
              Math.floor(result.box.x * scaleX) -
                padding
            );

            const y = Math.max(
              0,
              Math.floor(
                imgHeight -
                  (result.box.y + result.box.height) *
                    scaleY
              ) - padding
            );

            const width = Math.min(
              imgWidth - x,
              Math.ceil(
                result.box.width * scaleX
              ) +
                padding * 2
            );

            const height = Math.min(
              imgHeight - y,
              Math.ceil(
                result.box.height * scaleY
              ) +
                padding * 2
            );

            highlightBox = {
              x,
              y,
              width,
              height,
              imageWidth: imgWidth,
              imageHeight: imgHeight,
            };
          } else {
            highlightImagePath =
              "/highlights/" +
              rendered.imageName;
          }

          break;
        }

        // =========================================================
        // JPG / JPEG / PNG
        // =========================================================
        else if (
          ext === ".jpg" ||
          ext === ".jpeg" ||
          ext === ".png"
        ) {
          const imagePath = path.join(
            __dirname,
            "../uploads",
            doc.file_path
          );
          let wordBoxes = [];
          try {
            wordBoxes = JSON.parse(
              doc.word_boxes || "[]"
            );
          } catch {
            wordBoxes = [];
          }

          console.log(
            "Word Count:",
            wordBoxes.length
          );

          console.log(
            JSON.stringify(
              wordBoxes.slice(0, 10),
              null,
              2
            )
          );

          matchedDocument = doc.file_name;
          matchedPage = "Image";

          // NEW:
          // Original image
          sourceImagePath =
            "/uploads/" + doc.file_path;

          const answerWords = answer
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter(
              (word) => word.length >= 3
            );
           const matchedWords =
            wordBoxes.filter((word) => {
              const text = (word.text || "")
                .toLowerCase()
                .replace(/[^\w]/g, "");

              return answerWords.includes(text);
            });

          console.log(
            "Answer Words:",
            answerWords
          );

          console.log(
            "Matched Words:",
            matchedWords.map(
              (w) => w.text
            )
          );

          let highlighted;

          // -------------------------------------------------------
          // MATCHED WORDS
          // -------------------------------------------------------
          if (matchedWords.length > 0) {
            const xs = matchedWords.map(
              (w) => w.bbox.x0
            );

            const ys = matchedWords.map(
              (w) => w.bbox.y0
            );

            const rights = matchedWords.map(
              (w) => w.bbox.x1
            );

            const bottoms = matchedWords.map(
              (w) => w.bbox.y1
            );

            const boxX = Math.min(...xs);
            const boxY = Math.min(...ys);

            const boxWidth =
              Math.max(...rights) - boxX;

            const boxHeight =
              Math.max(...bottoms) - boxY;

            const metadata =
              await require("sharp")(
                imagePath
              ).metadata();

            // Existing highlightPage() behavior
            highlighted = await highlightPage(
              imagePath,
              {
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                pageWidth: metadata.width,
                pageHeight: metadata.height,
              }
            );

            // NEW:
            // Same padding as pageHighlighter.js
            const padding = 6;

            const x = Math.max(
              0,
              boxX - padding
            );

            const y = Math.max(
              0,
              boxY - padding
            );

            const width = Math.min(
              metadata.width - x,
              boxWidth + padding * 2
            );

            const height = Math.min(
              metadata.height - y,
              boxHeight + padding * 2
            );

            highlightBox = {
              x,
              y,
              width,
              height,
              imageWidth: metadata.width,
              imageHeight: metadata.height,
            };
          }

          // -------------------------------------------------------
          // NO MATCHED WORDS
          // -------------------------------------------------------
          else {
            const metadata =
              await require("sharp")(
                imagePath
              ).metadata();

            const boxX = 20;
            const boxY = 20;
            const boxWidth = 350;
            const boxHeight = 50;

            highlighted = await highlightPage(
              imagePath,
              {
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                pageWidth: metadata.width,
                pageHeight: metadata.height,
              }
            );

            // Same existing padding
            const padding = 6;

            const x = Math.max(
              0,
              boxX - padding
            );

            const y = Math.max(
              0,
              boxY - padding
            );

            const width = Math.min(
              metadata.width - x,
              boxWidth + padding * 2
            );

            const height = Math.min(
              metadata.height - y,
              boxHeight + padding * 2
            );

            highlightBox = {
              x,
              y,
              width,
              height,
              imageWidth: metadata.width,
              imageHeight: metadata.height,
            };
          }

          // Existing behavior preserved
          if (highlighted.success) {
            highlightImagePath =
              "/highlights/" +
              highlighted.imageName;
          } else {
            highlightImagePath =
              "/uploads/" +
              doc.file_path;
          }

          break;
        }
      }

      if (!matchedDocument) {
        matchedDocument = "";
      }

      if (!matchedPage) {
        matchedPage = "";
      }

      if (!highlightImagePath) {
        highlightImagePath = "";
      }

      // =========================================================
      // FINAL RESPONSE
      // Existing fields are still present.
      // New fields are added for live animation.
      // =========================================================

      res.json({
        answer,
        document: matchedDocument,
        page: matchedPage,

        // Existing
        highlightImage: highlightImagePath,

        // NEW
        sourceImage: sourceImagePath,
        highlightBox: highlightBox,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};
