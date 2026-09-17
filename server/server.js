const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, ".env"),
});
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_NAME =", process.env.DB_NAME);
const app = express();

// ================= Middleware =================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= Static Folders =================

// Existing Upload Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// NEW (Highlighted Images)
app.use(
  "/highlights",
  express.static(path.join(__dirname, "uploads/highlights"))
);

// ================= Routes =================

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/ai", aiRoutes);

// ================= Home =================

app.get("/", (req, res) => {
  res.send("AI Document Intelligence System API Running...");
});

// ================= Server =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
