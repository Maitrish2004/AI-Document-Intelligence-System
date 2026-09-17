import React from "react";
const DocumentCard = ({ document, onDelete }) => {
const handleDelete = async () => {
   const confirmDelete = window.confirm(
    "Are you sure you want to delete this document?"
  );
  if (!confirmDelete) {
    return;
  }
  const token = localStorage.getItem("token");
   try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${document.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    const data = await response.json();
     if (!response.ok) {
        alert(data.message || "Failed to delete document");
        return;
      }
     alert("Document deleted successfully");
     // Remove document from Dashboard UI
      if (onDelete) {
        onDelete(document.id);
      }
   } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting the document");
    }
  };
  return(
    <div className="document-card">
     <h3>{document.file_name}</h3>
      <p>
        <strong>Category:</strong> {document.category}
      </p>
      <p>
        <strong>Summary:</strong> {document.summary}
      </p>
     <div className="actions">
      {/* Preview */}
        <a
          href={`http://localhost:5000/uploads/${document.file_path}`}
          target="_blank"
          rel="noreferrer"
        >
          👁 Preview
        </a>

        {/* Download */}
        <a
          href={`http://localhost:5000/uploads/${document.file_path}`}
          download
        >
          ⬇ Download
        </a>
    {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="delete-btn"
        >
          🗑 Delete
        </button>
</div>
</div>
  );
};
export default DocumentCard;
