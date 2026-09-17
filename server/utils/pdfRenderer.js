const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const { createCanvas } = require("canvas");
async function renderPdfPage(pdfPath, pageNumber) {
  try {
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF not found");
    }
   const outputDir = path.join(__dirname, "../uploads/highlights");
   if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
const loadingTask = pdfjsLib.getDocument({
  data: pdfData,
  standardFontDataUrl: path.join(
    __dirname,
    "../node_modules/pdfjs-dist/standard_fonts/"
  )
});
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({
      scale: 1
    });

    const canvas = createCanvas(
      viewport.width,
      viewport.height
    );

    const context = canvas.getContext("2d");

    await page.render({
  canvasContext: context,
  viewport,
  intent: "display"
}).promise;

    const imageName = `page_${pageNumber}_${Date.now()}.png`;

    const imagePath = path.join(
      outputDir,
      imageName
    );

    const buffer = canvas.toBuffer("image/png");

    fs.writeFileSync(imagePath, buffer);

    return {
      success: true,
      page: pageNumber,
      imagePath,
      imageName,
      pageWidth: viewport.width,
      pageHeight: viewport.height,
     renderScale: 1
    };

  } catch (err) {
  console.error("PDF Render Error:", err);

    return {
  success: false,
  
};

  }
}

module.exports = {
  renderPdfPage
};
