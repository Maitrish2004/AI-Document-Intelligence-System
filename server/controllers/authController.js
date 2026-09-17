const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Strong password rule
const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;


// =========================
// Register
// =========================
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Password validation
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(sql, [name, email, hashedPassword], (err) => {
      if (err) {

        // Duplicate email
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            message: "Email already registered. Please login.",
          });
        }

        return res.status(500).json({
          message: "Registration failed",
          error: err.message,
        });
      }

      res.json({
        message: "User Registered Successfully",
      });
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// =========================
// Login
// =========================
exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Login failed",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
};


// =========================
// Reset Password
// =========================
exports.resetPassword = async (req, res) => {
  try {

    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    // Check fields
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    // Check strong password
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    // Check email
    const findUserSql =
      "SELECT id FROM users WHERE email = ?";

    db.query(
      findUserSql,
      [email],
      async (err, result) => {

        if (err) {
          return res.status(500).json({
            message: "Failed to find account.",
            error: err.message,
          });
        }

        if (result.length === 0) {
          return res.status(404).json({
            message: "No account found with this email.",
          });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(
          newPassword,
          10
        );

        // Update password
        const updateSql =
          "UPDATE users SET password = ? WHERE email = ?";

        db.query(
          updateSql,
          [hashedPassword, email],
          (updateErr) => {

            if (updateErr) {
              return res.status(500).json({
                message: "Failed to reset password.",
                error: updateErr.message,
              });
            }

            return res.json({
              message:
                "Password reset successfully. Please login again.",
            });
          }
        );
      }
    );

  } catch (error) {
    return res.status(500).json({
      message: "Password reset failed.",
      error: error.message,
    });
  }
};


// =========================
// Profile
// =========================
exports.profile = (req, res) => {

  const userId = req.user.id;

  const sql =
    "SELECT id, name, email, created_at FROM users WHERE id = ?";

  db.query(sql, [userId], (err, result) => {

    if (err) {
      return res.status(500).json({
        message: "Failed to fetch profile",
        error: err.message,
      });
    }

    res.json(result[0]);
  });
};
