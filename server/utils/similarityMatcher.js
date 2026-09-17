// server/utils/similarityMatcher.js

const { chunkText } = require("./textChunker");
const {
    calculateIDF,
    calculateTFIDF
} = require("./tfidf");
const { cosineSimilarity } = require("./cosineSimilarity");

function getRelevantContext(question, docs, topK = 3) {

    const allChunks = [];

    
    docs.forEach(doc => {

        if (!doc.extracted_text || doc.extracted_text.trim() === "")
            return;

        const chunks = chunkText(doc.extracted_text);

        chunks.forEach(chunk => {

            allChunks.push({
                file: doc.file_name,
                chunk
            });

        });

    });

    if (allChunks.length === 0)
        return "";

    
    const documents = allChunks.map(item => item.chunk);

    const idf = calculateIDF(documents);

    // Question vector
    const questionVector = calculateTFIDF(question, idf);

    // Similarity score 
    const scores = allChunks.map(item => {

        const chunkVector = calculateTFIDF(item.chunk, idf);

        const score = cosineSimilarity(
            questionVector,
            chunkVector
        );

        return {
            file: item.file,
            chunk: item.chunk,
            score
        };

    });


    scores.sort((a, b) => b.score - a.score);

    
    const selected = scores.slice(0, topK);

    let context = "";

    selected.forEach(item => {

        context += `File: ${item.file}\n`;
        context += `Content:\n${item.chunk}\n\n`;

    });

    return context;
}

module.exports = {
    getRelevantContext
};
