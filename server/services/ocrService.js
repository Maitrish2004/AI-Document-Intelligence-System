const fs = require("fs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");


const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);

    const data = await pdfParse(dataBuffer);

    return data.text;

  } catch (error) {
    console.log("PDF OCR Error:", error.message);
    return "";
  }
};


const extractTextFromImage = async (filePath) => {
  try {
    const result = await Tesseract.recognize(
      filePath,
      "eng",
      {
        logger: (m) => console.log(m),
      }
    );

    return result.data.text;

  } catch (error) {
    console.log("Image OCR Error:", error.message);
    return "";
  }
};


const extractText = async (file) => {
  const filePath = file.path;

  if (file.mimetype === "application/pdf") {
    return await extractTextFromPDF(filePath);
  }

  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    return await extractTextFromImage(filePath);
  }

  return "";
};

module.exports = {
  extractTextFromPDF,
  extractTextFromImage,
  extractText,
};
