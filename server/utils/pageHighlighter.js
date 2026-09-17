const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function highlightPage(imagePath, box) {
  try {

    if (!fs.existsSync(imagePath)) {
      throw new Error("Image not found.");
    }
    if (!box) {
      throw new Error("Highlight box not found.");
    }
    const metadata = await sharp(imagePath).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // Safe coordinates
 // PDF -> Image coordinate conversion
const padding = 6;

let x, y, width, height;


if (box.renderScale) {

  const PDF_WIDTH = box.pageWidth || imgWidth;
  const PDF_HEIGHT = box.pageHeight || imgHeight;

  const scaleX = imgWidth / PDF_WIDTH;
  const scaleY = imgHeight / PDF_HEIGHT;

  x = Math.max(0, Math.floor(box.x * scaleX) - padding);

  y = Math.max(
    0,
    Math.floor(
      imgHeight -
      ((box.y + box.height) * scaleY)
    ) - padding
  );

  width = Math.min(
    imgWidth - x,
    Math.ceil(box.width * scaleX) + padding * 2
  );

  height = Math.min(
    imgHeight - y,
    Math.ceil(box.height * scaleY) + padding * 2
  );

} else {

  // JPG / PNG OCR box (Top-left origin)
  x = Math.max(0, box.x - padding);
  y = Math.max(0, box.y - padding);

  width = Math.min(
    imgWidth - x,
    box.width + padding * 2
  );

  height = Math.min(
    imgHeight - y,
    box.height + padding * 2
  );
}
console.log("Highlight Debug:", {
  imgWidth,
  imgHeight,
  box,
  x,
  y,
  width,
  height
});
    const outputDir = path.join(
      __dirname,
      "../uploads/highlights"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputImage = path.join(
      outputDir,
      `highlight_${Date.now()}.png`
    );

    const svg = `
<svg width="${imgWidth}" height="${imgHeight}">
  <rect
    x="${x}"
    y="${y}"
    width="${width}"
    height="${height}"
    fill="none"
    stroke="#00C853"
    stroke-width="3"
    rx="10"
    ry="10"
  />
</svg>`;

    await sharp(imagePath)
      .composite([
        {
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toFile(outputImage);

    return {
      success: true,
      imagePath: outputImage,
      imageName: path.basename(outputImage)
    };

  } catch (err) {

    console.error(err);

    return {
      success: false,
      imagePath: "",
      imageName: ""
    };

  }
}

module.exports = {
  highlightPage
};
