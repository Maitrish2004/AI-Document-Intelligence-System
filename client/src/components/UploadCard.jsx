import React, { useState, useRef } from "react";
import axios from "axios";
const UploadCard = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
// AI Result States
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [isTyping, setIsTyping] = useState(false);
   const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
const typeText = async (text, setter) => {
let currentText = "";
for (let i = 0; i < text.length; i++) {
      currentText += text[i];
      setter(currentText);
    // 15ms character-by-character speed
      await new Promise((resolve) =>
        setTimeout(resolve, 15)
      );
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();

    formData.append("document", file);

    try {
      setLoading(true);

      // Clear previous AI result
      setCategory("");
      setSummary("");
      setIsTyping(false);

      const res = await axios.post(
        "http://localhost:5000/api/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setLoading(false);

      // Backend already generates and saves these
      const uploadedDocument = res.data.document;

      const aiCategory =
        uploadedDocument?.category || "Other";

      const aiSummary =
        uploadedDocument?.summary ||
        "Summary not available.";

      // Start character-by-character display
      setIsTyping(true);

      setCategory("");
      setSummary("");
      // Category first
      await typeText(aiCategory, setCategory);

      // Small gap before Summary
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      // Summary next
      await typeText(aiSummary, setSummary);

     // Dashboard immediately update
if (onUploadSuccess) {
  onUploadSuccess(res.data);
}

alert("Upload Successful");

// Typing finished
setIsTyping(false);

// Remove temporary AI result from Upload section
setCategory("");
setSummary("");
setFile(null);
if (fileInputRef.current) {
  fileInputRef.current.value = "";
}


    } catch (error) {

      setLoading(false);
      setIsTyping(false);

      console.log(error);

      alert("Upload Failed");
    }
  };

  return (
    <div className="upload-card">
     <h2>Upload Document</h2>

      <input
     type="file"
     ref={fileInputRef}
     onChange={handleFileChange}
     />

      <button
        onClick={handleUpload}
        disabled={loading || isTyping}
      >
        {loading
          ? "Uploading..."
          : isTyping
          ? "AI is analyzing..."
          : "Upload"}
      </button>


      {/* AI CATEGORY & SUMMARY */}

      {(category || summary) && (
        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            background: "#ffffff",
            color: "#1f2937",
            borderRadius: "10px",
            borderLeft: "5px solid #facc15",
            boxShadow:
              "0 6px 15px rgba(0, 0, 0, 0.12)",
          }}
        >

          {/* Category */}

          {category && (
            <div style={{ marginBottom: "12px" }}>

              <strong
                style={{
                  color: "#064e3b",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Category
              </strong>

              <span
                style={{
                  fontSize: "16px",
                }}
              >
                {category}

                {isTyping && !summary && (
                  <span
                    style={{
                      color: "#2563eb",
                      marginLeft: "3px",
                    }}
                  >
                    ▌
                  </span>
                )}
              </span>

            </div>
          )}


          {/* Summary */}

          {summary && (
            <div>

              <strong
                style={{
                  color: "#064e3b",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Summary
              </strong>

              <span
                style={{
                  fontSize: "16px",
                  lineHeight: "1.6",
                }}
              >
                {summary}

                {isTyping && (
                  <span
                    style={{
                      color: "#2563eb",
                      marginLeft: "3px",
                    }}
                  >
                    ▌
                  </span>
                )}
              </span>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
export default UploadCard;
