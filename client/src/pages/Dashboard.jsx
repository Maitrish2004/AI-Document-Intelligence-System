import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UploadCard from "../components/UploadCard";
import DocumentCard from "../components/DocumentCard";
import api from "../services/api";
const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");
    const res = await api.get("/documents/all");
    setDocuments(res.data);
    } catch (error) {
      console.log(error);
      setError("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDocuments();
  }, []);
return (
    <div>
      <Navbar />
      <div
        style={{
          display: "flex",
        }}
      >
      <Sidebar />
       <div
          style={{
            flex: 1,
            padding: "20px",
          }}
        >
          <h2 className="dashboard-title">Dashboard</h2>
         <UploadCard onUploadSuccess={fetchDocuments} />
         <hr />

          <h3 className="documents-title">My Documents</h3>

          {/* Loading State */}
          {loading ? (
            <p>Loading documents...</p>
          ) : error ? (
            /* Error State */
            <p>{error}</p>
          ) : documents.length === 0 ? (
            /* Empty State */
           <p className="documents-empty">No Documents Found</p>
          ) : (
            /* Documents */
            documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onDelete={(id) => {
                  setDocuments((prev) =>
                    prev.filter((doc) => doc.id !== id)
                  );
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
