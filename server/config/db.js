const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});
// MySQL connection pool create
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
// Test connection
db.getConnection((err, connection) => {
  if (err) {
  console.log(" Database connection failed:", err.message);
  } else {
  console.log(" MySQL Connected Successfully");
  connection.release();
  }
});
module.exports = db;
