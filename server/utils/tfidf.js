// server/utils/tfidf.js

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 1);
}

// Term Frequency (TF)
function calculateTF(words) {
    const tf = {};

    words.forEach(word => {
        tf[word] = (tf[word] || 0) + 1;
    });

    const totalWords = words.length;

    Object.keys(tf).forEach(word => {
        tf[word] = tf[word] / totalWords;
    });

    return tf;
}

// Inverse Document Frequency (IDF)
function calculateIDF(documents) {
    const idf = {};
    const totalDocs = documents.length;

    const vocabulary = new Set();

    documents.forEach(doc => {
        tokenize(doc).forEach(word => vocabulary.add(word));
    });

    vocabulary.forEach(word => {

        let docsContainingWord = 0;

        documents.forEach(doc => {

            const words = new Set(tokenize(doc));

            if (words.has(word)) {
                docsContainingWord++;
            }

        });

        idf[word] =
            Math.log(totalDocs / (1 + docsContainingWord)) + 1;

    });

    return idf;
}

// TF-IDF Vector
function calculateTFIDF(document, idf) {

    const words = tokenize(document);

    const tf = calculateTF(words);

    const vector = {};

    Object.keys(idf).forEach(word => {

        vector[word] = (tf[word] || 0) * idf[word];

    });

    return vector;
}

module.exports = {
    tokenize,
    calculateTF,
    calculateIDF,
    calculateTFIDF
};
