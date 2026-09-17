import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UploadCard from "../components/UploadCard";
const Upload = () => {
return (
<div>
<Navbar/>
<div style={{ display: "flex" }}>
<Sidebar/>
<div style={{ flex: 1, padding: "20px" }}>
<h2 className="upload-title">Upload Document</h2>
<p className="upload-description">
  Upload your PDF or Image document. AI will automatically
  analyze it and save the category, summary and important
  information.
</p>
<UploadCard/>
</div>
</div>
</div>
);
};
export default Upload;
