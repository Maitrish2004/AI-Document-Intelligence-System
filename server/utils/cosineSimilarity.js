// server/utils/cosineSimilarity.js

function cosineSimilarity(vectorA, vectorB) {

    
    const words = new Set([
        ...Object.keys(vectorA),
        ...Object.keys(vectorB)
    ]);
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    words.forEach(word => {

        const a = vectorA[word] || 0;
        const b = vectorB[word] || 0;

        // Dot Product
        dotProduct += a * b;

        // Magnitude
        magnitudeA += a * a;
        magnitudeB += b * b;

    });

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

module.exports = {
    cosineSimilarity
};
