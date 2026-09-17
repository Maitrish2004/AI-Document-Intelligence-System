const axios = require("axios");
require("dotenv").config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// =====================================================
// ASK AI PROMPT
// =====================================================

const buildPrompt = (question, context) => `
You are an AI Document Intelligence Assistant.
Rules:
1. Answer ONLY from the uploaded document content.
2. Do NOT use your own knowledge.
3. If the answer is not present in the documents, return:

{
  "answer": "The answer is not available in the uploaded documents.",
  "source_file": ""
}

4. Return ONLY valid JSON.
5. Do NOT use markdown.
6. Do NOT use code fences.
7. "source_file" MUST be the exact uploaded file name.
8. If multiple documents contain the answer, choose the single most relevant document.

======================
UPLOADED DOCUMENTS
======================
${context}

======================
USER QUESTION
======================
${question}

Return exactly:

{
  "answer": "...",
  "source_file": "..."
}
`;

// =====================================================
// DOCUMENT ANALYSIS PROMPT
// =====================================================


const buildDocumentAnalysisPrompt = (fileName, extractedText) => `
You are an AI Document Intelligence system.

Analyze the uploaded document based ONLY on the document content provided below.

Your task is to generate:

1. category
   - Determine the most appropriate category based on the actual document content.
   - Do NOT choose a category only from the filename.
   - Use a short category name, preferably 1-3 words.
   - Examples: Resume, Result, Identity, Finance, Employment,
     Certificate, Educational Document, Technical Document,
     Legal Document, Medical Document, Project Report, Other.

2. summary
   - Write a VERY SHORT summary of the document.
   - The summary must describe only the main purpose or main topic of the document.
   - Write ONLY 1-2 short sentences.
   - Maximum 25 words.
   - Do NOT list sections, chapters, topics, features, definitions,
     activities, examples, or detailed contents.
   - Do NOT explain the document in detail.
   - Do NOT copy long sentences from the document.
   - Do NOT repeat the extracted text.
   - Include only the most important information needed to identify
     what the document is about.
   - The summary must be based ONLY on the actual document content.
   - Do NOT add information that is not present in the document.
   - Do NOT guess or hallucinate.

Important:
- If the document content is insufficient to determine a category,
  use "Other".
- If the document content is insufficient for a meaningful summary,
  write "Summary not available due to insufficient document content."
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT use code fences.

DOCUMENT FILE NAME:
${fileName}

========================
DOCUMENT CONTENT
========================
${extractedText}

Return exactly this JSON format:

{
  "category": "...",
  "summary": "..."
}
`;


// =====================================================
// ASK GEMINI
// =====================================================

async function askGemini(question, context) {
  const prompt = buildPrompt(question, context);

  try {
    console.log("Using Gemini...");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    );

    const text =
      response.data.candidates[0].content.parts[0].text.trim();

    let result;

    try {
      result = JSON.parse(text);
    } catch (e) {
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      result = JSON.parse(cleaned);
    }

    return result;

  } catch (error) {
    console.log("Gemini Failed");

    return await askGroq(prompt);
  }
}

// =====================================================
// ANALYZE DOCUMENT
// =====================================================

async function analyzeDocument(fileName, extractedText) {

  const prompt = buildDocumentAnalysisPrompt(
    fileName,
    extractedText
  );

  // If no text was extracted
  if (!extractedText || extractedText.trim().length < 10) {
    return {
      category: "Other",
      summary:
        "Summary not available due to insufficient document content."
    };
  }

  // ================= GEMINI =================

  try {
    console.log("Analyzing document with Gemini...");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }
    );

    const text =
      response.data.candidates[0].content.parts[0].text.trim();

    return parseAIResponse(text);

  } catch (error) {

    console.log(
      "Gemini Document Analysis Failed:",
      error.response?.data || error.message
    );

    // ================= GROQ FALLBACK =================

    try {
      return await analyzeWithGroq(prompt);

    } catch (groqError) {

      console.log(
        "Groq Document Analysis Failed:",
        groqError.response?.data || groqError.message
      );

      // ================= OPENROUTER FALLBACK =================

      try {
        return await analyzeWithOpenRouter(prompt);

      } catch (openRouterError) {

        console.log(
          "OpenRouter Document Analysis Failed:",
          openRouterError.response?.data ||
          openRouterError.message
        );

        return {
          category: "Other",
          summary: "AI analysis failed."
        };
      }
    }
  }
}

// =====================================================
// GROQ - DOCUMENT ANALYSIS
// =====================================================

async function analyzeWithGroq(prompt) {

  console.log("Analyzing document with Groq...");

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "user",
          content: prompt
        }
      ],

      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text =
    response.data.choices[0].message.content.trim();

  return parseAIResponse(text);
}

// =====================================================
// OPENROUTER - DOCUMENT ANALYSIS
// =====================================================

async function analyzeWithOpenRouter(prompt) {

  console.log("Analyzing document with OpenRouter...");

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "google/gemma-3-27b-it",

      messages: [
        {
          role: "user",
          content: prompt
        }
      ],

      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const text =
    response.data.choices[0].message.content.trim();

  return parseAIResponse(text);
}

// =====================================================
// PARSE AI JSON RESPONSE
// =====================================================

function parseAIResponse(text) {

  try {

    return JSON.parse(text);

  } catch (error) {

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {

      return JSON.parse(cleaned);

    } catch (parseError) {

      console.log(
        "AI JSON Parsing Failed:",
        parseError.message
      );

      return {
        category: "Other",
        summary: "AI analysis could not be completed."
      };
    }
  }
}

// =====================================================
// ASK GROQ - EXISTING ASK AI FALLBACK
// =====================================================

async function askGroq(prompt) {

  try {

    console.log("Using Groq...");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text =
      response.data.choices[0].message.content.trim();

    let result;

    try {

      result = JSON.parse(text);

    } catch (e) {

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      result = JSON.parse(cleaned);
    }

    return result;

  } catch (error) {

    console.log("Groq Failed");

    return await askOpenRouter(prompt);
  }
}

// =====================================================
// ASK OPENROUTER - EXISTING ASK AI FALLBACK
// =====================================================

async function askOpenRouter(prompt) {

  try {

    console.log("Using OpenRouter...");

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-3-27b-it",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text =
      response.data.choices[0].message.content.trim();

    let result;

    try {

      result = JSON.parse(text);

    } catch (e) {

      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      result = JSON.parse(cleaned);
    }

    return result;

  } catch (error) {

    console.log("OpenRouter Failed");

    return {
      answer: "AI service failed",
      source_file: ""
    };
  }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  askGemini,
  analyzeDocument
};
