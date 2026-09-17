// server/utils/textChunker.js

function chunkText(text, chunkSize = 300, overlap = 50) {
  if (!text || typeof text !== "string") {
    return [];
  }

  
  text = text.replace(/\s+/g, " ").trim();

  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {

    const chunk = words
      .slice(i, i + chunkSize)
      .join(" ")
      .trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    
    if (i + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}

module.exports = {
  chunkText
};
