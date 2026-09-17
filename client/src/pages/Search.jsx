import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DocumentCard from "../components/DocumentCard";
const Search = () => {
const [keyword, setKeyword] = useState("");
const [documents, setDocuments] = useState([]);
const [hasSearched, setHasSearched] = useState(false);
const handleSearch = async () => {
if (keyword.trim() === "") {
      alert("Enter a keyword");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:5000/api/documents/search?keyword=${keyword}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocuments(res.data);
      setHasSearched(true);
    } catch (error) {
      console.log(error);
      alert("Search Failed");
    }
  };

  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div className="search-page">
          <h2 className="search-title">Search Documents</h2>

          <p className="search-description">
            Search your uploaded documents by name or content.
          </p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search documents..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />

            <button onClick={handleSearch}>
              Search
            </button>
          </div>

          {hasSearched && (
            <>
              <div className="search-divider"></div>

              {documents.length === 0 ? (
                <p className="no-results">
                  No documents found for "{keyword}"
                </p>
              ) : (
                <>
                  <p className="results-count">
                    {documents.length} document
                    {documents.length > 1 ? "s" : ""} found
                  </p>

                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {!hasSearched && (
            <div className="search-empty">
              <h3>Find your documents</h3>
              <p>
                Enter a keyword to search through your uploaded documents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
