import React, {
  useEffect,
  useState,
} from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
const AskAI = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
// Source information
  const [sourceDocument, setSourceDocument] =
    useState("");
const [pageNumber, setPageNumber] =
    useState("");
// Existing highlighted image
  const [highlightImage, setHighlightImage] =
    useState("");
// NEW:
  // Original image/page
  const [sourceImage, setSourceImage] =
    useState("");
 // NEW:
  // Exact backend highlight coordinates
  const [highlightBox, setHighlightBox] =
    useState(null);
// Processing state
  const [isProcessing, setIsProcessing] =
    useState(false);
// Typing state
  const [isTyping, setIsTyping] =
    useState(false);
// NEW:
  // Controls source animation
  const [showSource, setShowSource] =
    useState(false);
  //NEW:
  // Controls live green highlight animation
  const [showHighlight, setShowHighlight] =
    useState(false);
  //NEW:
  // Wait until source image is loaded
  const [imageLoaded, setImageLoaded] =
    useState(false);
// ---------------------------------------------------------
  // Start highlight animation after image appears
  // ---------------------------------------------------------
  useEffect(() => {
    if (
      !showSource ||
      !imageLoaded ||
      !highlightBox
    ) {
      return;
    }

    setShowHighlight(false);

    const timer = setTimeout(() => {
      setShowHighlight(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [
    showSource,
    imageLoaded,
    highlightBox,
  ]);

  // ---------------------------------------------------------
  // ASK AI
  // ---------------------------------------------------------
  const askAI = async () => {
    if (question.trim() === "") {
      alert("Please enter your question");
      return;
    }
   try {
      const token =
        localStorage.getItem("token");
    // Start processing
      setIsProcessing(true);
  // Clear previous answer
      setAnswer("");
// Clear previous source
      setSourceDocument("");
      setPageNumber("");
//Clear previous images
      setHighlightImage("");
      setSourceImage("");
      setHighlightBox(null);
  // Reset animation
      setShowSource(false);
      setShowHighlight(false);
      setImageLoaded(false);
      setIsTyping(false);
  const res = await axios.post(
        "http://localhost:5000/api/ai/ask",
        {
          question: question.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // -------------------------------------------------------
      // Get exact answer from backend
      // -------------------------------------------------------
      const fullAnswer =
        res.data.answer || "";

      // -------------------------------------------------------
      // Source information
      // -------------------------------------------------------
      setSourceDocument(
        res.data.document || ""
      );

      setPageNumber(
        res.data.page || ""
      );

      // -------------------------------------------------------
      // Existing highlight image
      // -------------------------------------------------------
      if (res.data.highlightImage) {
        setHighlightImage(
          `http://localhost:5000${res.data.highlightImage}`
        );
      } else {
        setHighlightImage("");
      }

      // -------------------------------------------------------
      // NEW: Original source image
      // -------------------------------------------------------
      if (res.data.sourceImage) {
        setSourceImage(
          `http://localhost:5000${res.data.sourceImage}`
        );
      } else {
        setSourceImage("");
      }

      // -------------------------------------------------------
      // NEW: Exact highlight box
      // -------------------------------------------------------
      if (res.data.highlightBox) {
        setHighlightBox(
          res.data.highlightBox
        );
      } else {
        setHighlightBox(null);
      }

      // Backend processing finished
      setIsProcessing(false);

      // -------------------------------------------------------
      // CHATGPT STYLE ANSWER TYPING
      // -------------------------------------------------------
      setIsTyping(true);
      setAnswer("");
     let currentText = "";
    for (
        let i = 0;
        i < fullAnswer.length;
        i++
      ) {
        currentText += fullAnswer[i];
        setAnswer(currentText);
        await new Promise((resolve) =>
          setTimeout(resolve, 5)
        );
      }

      // Typing finished
      setIsTyping(false);

      // -------------------------------------------------------
      // IMPORTANT:
      // Source section appears ONLY after answer finishes.
      // -------------------------------------------------------
      setShowSource(true);
    } catch (error) {
      console.log(error);

      setIsProcessing(false);
      setIsTyping(false);

      setAnswer("AI failed to answer");
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div
          style={{
            flex: 1,
            padding: "20px",
          }}
        >
          {/* =====================================================
              HEADING
          ====================================================== */}
          <h2
            style={{
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Ask AI About Your Documents
          </h2>

          {/* =====================================================
              QUESTION BOX
          ====================================================== */}
          <textarea
            rows="5"
            placeholder={`Example:
What is my Aadhaar Number?
What percentage did I get in Madhyamik?
Show my Passport details.`}
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
            }}
          />

          <br />
          <br />

          {/* =====================================================
              ASK AI BUTTON
          ====================================================== */}
          <button
            onClick={askAI}
            disabled={
              isProcessing || isTyping
            }
            style={{
              background:
                isProcessing || isTyping
                  ? "#9ca3af"
                  : "#facc15",

              color: "#022c22",

              fontSize: "16px",

              fontWeight: "700",

              padding: "10px 24px",

              border: "none",

              borderRadius: "7px",

              cursor:
                isProcessing || isTyping
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isProcessing
              ? "Processing..."
              : isTyping
              ? "AI is writing..."
              : "Ask AI"}
          </button>

          <hr />

          {/* =====================================================
              AI ANSWER CARD
          ====================================================== */}
          <div
            style={{
              marginTop: "25px",

              padding: "20px",

              background: "#ffffff",

              color: "#1f2937",

              borderRadius: "12px",

              borderLeft:
                "5px solid #facc15",

              boxShadow:
                "0 8px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Answer Heading */}
            <h3
              style={{
                color: "#064e3b",
                marginBottom: "12px",
              }}
            >
              AI Answer

              {isTyping && (
                <span
                  style={{
                    color: "#2563eb",
                    marginLeft: "8px",
                  }}
                >
                  ●
                </span>
              )}
            </h3>

            {/* Character-by-character answer */}
            <p
              style={{
                color: "#1f2937",
                lineHeight: "1.7",
                fontSize: "16px",
              whiteSpace: "pre-wrap",
              minHeight: "30px",
              }}
            >
            {answer ||
                "Your answer will appear here."}
           {/* Typing Cursor */}
              {isTyping && (
                <span
                  style={{
                    color: "#2563eb",

                    fontWeight: "700",

                    marginLeft: "3px",
                  }}
                >
                  |
                </span>
              )}
            </p>
          </div>

          {/* =====================================================
              SOURCE PREVIEW SECTION
              Appears AFTER AI typing finishes
          ====================================================== */}
          {sourceDocument &&
            showSource && (
              <div
                style={{
                  marginTop: "25px",

                  padding: "15px",

                  border:
                    "1px solid #ddd",

                  borderRadius: "10px",

                  background: "#fafafa",

                  overflow: "hidden",
                }}
              >
                {/* =================================================
                    SOURCE HEADING
                ================================================== */}
                <h3>
                  Source Document
                </h3>

                <p>
                  <strong>
                    Document :
                  </strong>{" "}
                  {sourceDocument}
                </p>

                <p>
                  <strong>
                    Page :
                  </strong>{" "}
                  {pageNumber}
                </p>

                {/* =================================================
                    SOURCE IMAGE
                ================================================== */}
                {sourceImage &&
                  highlightBox && (
                    <div
                      style={{
                        position:
                          "relative",

                        width: "100%",

                        maxWidth: "800px",

                        marginTop: "15px",

                        borderRadius: "10px",

                        overflow: "hidden",

                        border:
                          "1px solid #ccc",

                        animation:
                          "sourceImageAppear 2.2s ease-out forwards",
                      }}
                    >
                      {/* =================================================
                          ORIGINAL IMAGE
                      ================================================== */}
                      <img
                        src={sourceImage}
                        alt="Source Page"
                        onLoad={() =>
                          setImageLoaded(
                            true
                          )
                        }
                        style={{
                          display: "block",

                          width: "100%",

                          height: "auto",
                        }}
                      />

                      {/* =================================================
                          LIVE GREEN HIGHLIGHT
                      ================================================== */}
                      {showHighlight && (
                        <svg
                          viewBox={`0 0 ${highlightBox.imageWidth} ${highlightBox.imageHeight}`}
                          preserveAspectRatio="none"
                          style={{
                            position:
                              "absolute",

                            top: 0,

                            left: 0,

                            width: "100%",

                            height: "100%",

                            pointerEvents:
                              "none",
                          }}
                        >
                          <rect
                            x={
                              highlightBox.x
                            }
                            y={
                              highlightBox.y
                            }
                            width={
                              highlightBox.width
                            }
                            height={
                              highlightBox.height
                            }
                            rx="10"
                            ry="10"
                            fill="none"
                            stroke="#00C853"
                            strokeWidth="3"
                            pathLength="1"
                            strokeDasharray="1"
                            strokeDashoffset="1"
                            style={{
                              animation:
                                "drawHighlight 3.5s ease-out forwards",
                            }}
                          />
                        </svg>
                      )}
                    </div>
                  )}

                {/* =================================================
                    FALLBACK
                    Existing highlighted image remains available
                    if live animation data is unavailable.
                ================================================== */}
                {(!sourceImage ||
                  !highlightBox) &&
                  highlightImage && (
                    <div>
                      <img
                        src={highlightImage}
                        alt="Highlighted Page"
                        style={{
                          width: "100%",

                          maxWidth: "800px",

                          borderRadius:
                            "10px",

                          border:
                            "1px solid #ccc",

                          marginTop: "10px",
                        }}
                      />
                    </div>
                  )}
              </div>
            )}

          {/* =====================================================
              ANIMATION CSS
          ====================================================== */}
          <style>
            {`
              @keyframes sourceImageAppear {
                0% {
                  opacity: 0;
                  transform: translateY(25px) scale(0.97);
                }

                60% {
                  opacity: 0.8;
                }

                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              @keyframes drawHighlight {
                0% {
                  stroke-dashoffset: 1;
                }

                100% {
                  stroke-dashoffset: 0;
                }
              }
            `}
          </style>
        </div>
      </div>
    </div>
  );
};

export default AskAI;

