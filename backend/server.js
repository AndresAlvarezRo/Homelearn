// server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

// Evita respuestas 304 por ETag
app.set("etag", false);

// --- CORS dinámico (LAN + env) ---
// FRONTEND_ORIGINS puede ser coma-separado, ej: "http://localhost:3000,http://192.168.0.6:3000"
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];
// Acepta http/https y rangos 10.x, 172.16-31.x, 192.168.x
const LAN_REGEX =
  /^https?:\/\/(?:(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})|(?:172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}))(?::\d{2,5})?$/;

const ALLOWED_ORIGINS = [...DEFAULT_ORIGINS, ...FRONTEND_ORIGINS];

// ---------- Config ----------
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "homelearn_super_secret_key_2024";

// ---------- DB ----------
const pool = new Pool({
  user: process.env.DB_USER || "homelearn_user",
  host: process.env.DB_HOST || "database", // por docker-compose
  database: process.env.DB_NAME || "homelearn",
  password: process.env.DB_PASSWORD || "homelearn_pass",
  port: Number(process.env.DB_PORT || 5432),
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

// ---------- Socket.IO ----------
const io = socketIo(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (ALLOWED_ORIGINS.includes(origin) || LAN_REGEX.test(origin)) return cb(null, true);
      return cb(null, true); // relajado en LAN
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// ---------- Middlewares ----------
app.disable("x-powered-by");
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(morgan("combined"));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin) || LAN_REGEX.test(origin)) return cb(null, true);
      return cb(null, true); // relajado en LAN
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// No-cache para /api (evita 304 y problemas con tokens)
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Vary", "Authorization, Origin");
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use("/api/", limiter);

// Servir archivos subidos
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// ---------- Multer ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "courseFile") {
      if (file.mimetype === "application/json") return cb(null, true);
      return cb(new Error("Only JSON files are allowed for courses"));
    } else if (file.fieldname === "profilePic") {
      if (file.mimetype.startsWith("image/")) return cb(null, true);
      return cb(new Error("Only image files are allowed for profile pictures"));
    }
    cb(null, true);
  },
});

// ---------- Auth helpers ----------
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      "SELECT id, username, email, user_code, is_admin, profile_pic, biography, created_at FROM users WHERE id = $1",
      [decoded.userId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid token" });
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ error: "Invalid token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin access required" });
  next();
};

const generateUserCode = () => "USER" + Math.random().toString(36).substr(2, 6).toUpperCase();
const hashPassword = (p) => bcrypt.hash(p, 12);
const comparePassword = (p, h) => bcrypt.compare(p, h);

// ---------- Socket.IO rooms ----------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-course", (courseId) => {
    socket.join(`course-${courseId}`);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ---------- Routes ----------

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "User already exists" });

    const hashed = await hashPassword(password);
    const userCode = generateUserCode();
    const ins = await pool.query(
      "INSERT INTO users (username, email, password_hash, user_code) VALUES ($1, $2, $3, $4) RETURNING id, username, email, user_code, is_admin, created_at",
      [username, email, hashed, userCode]
    );
    const user = ins.rows[0];

    console.log("✅ User registered:", user.username);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userCode: user.user_code,
        isAdmin: user.is_admin,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    console.log("🔐 Login attempt for:", email);
    const r = await pool.query(
      "SELECT id, username, email, password_hash, user_code, is_admin, profile_pic, biography, created_at FROM users WHERE email = $1",
      [email]
    );
    if (r.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = r.rows[0];
    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    console.log("✅ Login successful:", user.username, "Admin:", user.is_admin);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userCode: user.user_code,
        isAdmin: user.is_admin,
        profilePic: user.profile_pic,
        biography: user.biography,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Profile
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    userCode: req.user.user_code,
    isAdmin: req.user.is_admin,
    profilePic: req.user.profile_pic,
    biography: req.user.biography,
    createdAt: req.user.created_at,
  });
});

app.put("/api/profile", authenticateToken, upload.single("profilePic"), async (req, res) => {
  try {
    const { username, biography } = req.body || {};
    let profilePicPath = req.user.profile_pic;

    const finalUsername = username && username.trim() ? username.trim() : req.user.username || `User_${req.user.id}`;

    if (req.file) {
      const processedImagePath = path.join(UPLOAD_DIR, `profile-${req.user.id}-${Date.now()}.jpg`);
      await sharp(req.file.path).resize(200, 200).jpeg({ quality: 80 }).toFile(processedImagePath);
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
      // Guardamos ruta relativa "uploads/xxx.jpg" para que el cliente la anteponga a /uploads
      profilePicPath = path.relative(__dirname, processedImagePath).replace(/\\/g, "/");
    }

    const upd = await pool.query(
      "UPDATE users SET username = $1, biography = $2, profile_pic = $3 WHERE id = $4 RETURNING username, biography, profile_pic",
      [finalUsername, biography || null, profilePicPath, req.user.id]
    );

    res.json({
      message: "Profile updated successfully",
      username: upd.rows[0].username,
      biography: upd.rows[0].biography,
      profile_pic: upd.rows[0].profile_pic,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Courses (list & mine)
app.get("/api/courses", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query || {};
    let query = `
      SELECT c.*, u.username as created_by_username,
             COUNT(cl.id) as level_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN course_levels cl ON c.id = cl.course_id
    `;
    const params = [];
    if (search) {
      query += " WHERE c.title ILIKE $1 OR c.description ILIKE $1";
      params.push(`%${search}%`);
    }
    query += " GROUP BY c.id, u.username ORDER BY c.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Courses fetch error:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

app.get("/api/my-courses", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT c.*, u.username as created_by_username,
             COUNT(cl.id) as total_levels,
             COUNT(up.id) as completed_levels,
             ue.enrolled_at
      FROM courses c
      JOIN user_enrollments ue ON c.id = ue.course_id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN course_levels cl ON c.id = cl.course_id
      LEFT JOIN user_progress up ON cl.id = up.level_id AND up.user_id = $1
      WHERE ue.user_id = $1
      GROUP BY c.id, u.username, ue.enrolled_at
      ORDER BY ue.enrolled_at DESC
    `,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("My courses fetch error:", err);
    res.status(500).json({ error: "Failed to fetch enrolled courses" });
  }
});

// ✅ Create course (JSON en body, sin archivo)
app.post("/api/courses", authenticateToken, async (req, res) => {
  try {
    const payload = req.body || {};
    let courseTitle = "";
    let courseDescription = "";
    let levels = [];

    if (payload.title && Array.isArray(payload.levels)) {
      courseTitle = String(payload.title).trim();
      courseDescription = (payload.description || "").trim();
      levels = payload.levels;
    } else if (typeof payload === "object" && !Array.isArray(payload) && Object.keys(payload).length > 0) {
      // formato "ruta_xxx": []
      const courseKey = Object.keys(payload)[0];
      const mapNames = {
        ruta_aprendizaje_ciberseguridad: "Ruta de Aprendizaje en Ciberseguridad",
        ruta_aprendizaje_crochet: "Ruta de Aprendizaje en Crochet",
        ruta_ia_en_administracion_y_contaduria: "Ruta de IA en Administración y Contaduría",
        leverage_crypto: "Leverage Crypto Trading",
        hipertrofia_fat_loss: "Hipertrofia y Pérdida de Grasa",
      };
      courseTitle = mapNames[courseKey] || courseKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      courseDescription = `Curso completo de ${courseTitle.toLowerCase()}`;
      levels = payload[courseKey];
    }

    if (!courseTitle) return res.status(400).json({ error: "Title is required" });
    if (!Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({ error: "Levels array is required" });
    }

    const courseIns = await pool.query(
      "INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING id",
      [courseTitle, courseDescription, req.user.id]
    );
    const courseId = courseIns.rows[0].id;

    for (let i = 0; i < levels.length; i++) {
      const lv = levels[i] || {};
      const levelTitle = lv.nivel || lv.level || lv.title || `Level ${i + 1}`;
      const topics = lv.temas || lv.topics || [];
      const objectives = lv.objetivos || lv.objectives || [];
      const tools = lv.herramientas || lv.tools || [];
      const resources = lv.recursos || lv.resources || [];

      await pool.query(
        "INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, content, level_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          courseId,
          i + 1,
          levelTitle,
          topics,
          objectives,
          tools,
          resources,
          JSON.stringify({ topics, objectives, tools, resources }),
          i + 1,
        ]
      );
    }

    res.status(201).json({
      message: "Course created successfully",
      courseId,
      title: courseTitle,
      levelsCount: levels.length,
    });
  } catch (err) {
    console.error("Course create error:", err);
    res.status(500).json({ error: "Failed to create course: " + err.message });
  }
});

// Enroll / Unsubscribe
app.post("/api/courses/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const existing = await pool.query("SELECT id FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [
      req.user.id,
      courseId,
    ]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Already enrolled in this course" });

    await pool.query("INSERT INTO user_enrollments (user_id, course_id) VALUES ($1, $2)", [req.user.id, courseId]);
    res.json({ message: "Enrolled successfully" });
  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ error: "Failed to enroll" });
  }
});

app.delete("/api/courses/:id/unsubscribe", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    await pool.query("DELETE FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [req.user.id, courseId]);
    res.json({ message: "Unsubscribed successfully" });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

// Course detail & progress
app.get("/api/course/:id", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;

    const courseResult = await pool.query(
      `
      SELECT c.*, u.username as created_by_username
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `,
      [courseId]
    );
    if (courseResult.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    const levelsResult = await pool.query(
      `
      SELECT cl.*,
             CASE WHEN up.id IS NOT NULL THEN true ELSE false END as completed
      FROM course_levels cl
      LEFT JOIN user_progress up ON cl.id = up.level_id AND up.user_id = $1
      WHERE cl.course_id = $2
      ORDER BY cl.level_order
    `,
      [req.user.id, courseId]
    );

    const enrollment = await pool.query("SELECT id FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [
      req.user.id,
      courseId,
    ]);

    const course = courseResult.rows[0];
    course.levels = levelsResult.rows;
    course.isEnrolled = enrollment.rows.length > 0;

    res.json(course);
  } catch (err) {
    console.error("Course detail error:", err);
    res.status(500).json({ error: "Failed to fetch course details" });
  }
});

app.post("/api/course/:courseId/level/:levelId/complete", authenticateToken, async (req, res) => {
  try {
    const { courseId, levelId } = req.params;
    const existing = await pool.query("SELECT id FROM user_progress WHERE user_id = $1 AND level_id = $2", [
      req.user.id,
      levelId,
    ]);
    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO user_progress (user_id, level_id, completed_at) VALUES ($1, $2, NOW())", [
        req.user.id,
        levelId,
      ]);
    }

    io.to(`course-${courseId}`).emit("level-completed", {
      userId: req.user.id,
      levelId,
      username: req.user.username,
    });

    res.json({ message: "Level completed" });
  } catch (err) {
    console.error("Level completion error:", err);
    res.status(500).json({ error: "Failed to mark level as complete" });
  }
});

// Upload course (JSON file)
app.post("/api/courses/upload", authenticateToken, upload.single("courseFile"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const raw = fs.readFileSync(req.file.path, "utf8");
    let courseData;
    try {
      courseData = JSON.parse(raw);
    } catch {
      return res.status(400).json({ error: "Invalid JSON file" });
    }

    let courseTitle = "";
    let courseDescription = "";
    let levels = [];

    const courseKey = Object.keys(courseData)[0];
    if (courseKey && Array.isArray(courseData[courseKey])) {
      const courseNames = {
        ruta_aprendizaje_ciberseguridad: "Ruta de Aprendizaje en Ciberseguridad",
        ruta_aprendizaje_crochet: "Ruta de Aprendizaje en Crochet",
        ruta_ia_en_administracion_y_contaduria: "Ruta de IA en Administración y Contaduría",
        leverage_crypto: "Leverage Crypto Trading",
        hipertrofia_fat_loss: "Hipertrofia y Pérdida de Grasa",
      };
      courseTitle = courseNames[courseKey] || courseKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      courseDescription = `Curso completo de ${courseTitle.toLowerCase()}`;
      levels = courseData[courseKey];
    } else if (courseData.title && courseData.levels) {
      courseTitle = courseData.title;
      courseDescription = courseData.description || "";
      levels = courseData.levels;
    } else {
      return res
        .status(400)
        .json({ error: "Invalid course format. Expect array or { title, description?, levels }" });
    }

    if (!levels || levels.length === 0) {
      return res.status(400).json({ error: "No levels found in course data" });
    }

    const courseIns = await pool.query(
      "INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING id",
      [courseTitle, courseDescription, req.user.id]
    );
    const courseId = courseIns.rows[0].id;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i] || {};
      const levelTitle = level.nivel || level.level || level.title || `Level ${i + 1}`;
      const topics = level.temas || level.topics || [];
      const objectives = level.objetivos || level.objectives || [];
      const tools = level.herramientas || level.tools || [];
      const resources = level.recursos || level.resources || [];

      await pool.query(
        "INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, content, level_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          courseId,
          i + 1,
          levelTitle,
          topics,
          objectives,
          tools,
          resources,
          JSON.stringify({ topics, objectives, tools, resources }),
          i + 1,
        ]
      );
    }

    try {
      fs.unlinkSync(req.file.path);
    } catch {}

    res.json({
      message: "Course uploaded successfully",
      courseId,
      title: courseTitle,
      levelsCount: levels.length,
    });
  } catch (err) {
    console.error("Course upload error:", err);
    res.status(500).json({ error: "Failed to upload course: " + err.message });
  }
});

// Delete course (owner or admin)
app.delete("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const courseRes = await pool.query("SELECT created_by FROM courses WHERE id = $1", [courseId]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    const isOwner = courseRes.rows[0].created_by === req.user.id;
    const isAdmin = !!req.user.is_admin;
    if (!isAdmin && !isOwner) return res.status(403).json({ error: "You can only delete courses you created" });

    await pool.query(
      "DELETE FROM user_progress WHERE level_id IN (SELECT id FROM course_levels WHERE course_id = $1)",
      [courseId]
    );
    await pool.query("DELETE FROM user_enrollments WHERE course_id = $1", [courseId]);
    await pool.query("DELETE FROM course_levels WHERE course_id = $1", [courseId]);
    await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Course deletion error:", err);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Admin
app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.user_code, u.is_admin, u.created_at,
             COUNT(DISTINCT ue.course_id) as enrolled_courses,
             COUNT(DISTINCT up.id) as completed_levels
      FROM users u
      LEFT JOIN user_enrollments ue ON u.id = ue.user_id
      LEFT JOIN user_progress up ON u.id = up.user_id
      GROUP BY u.id, u.username, u.email, u.user_code, u.is_admin, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Admin users fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/admin/logs", authenticateToken, requireAdmin, (req, res) => {
  try {
    const logs = [
      { timestamp: new Date().toISOString(), level: "INFO", message: "System started successfully" },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: "INFO", message: "User logged in" },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: "WARN", message: "High memory usage detected" },
    ];
    res.json(logs);
  } catch (err) {
    console.error("Logs fetch error:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Errors
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ---------- Start ----------
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Advanced Homelearn Server running on port ${PORT}`);
  console.log(`📚 Features: Auth, Courses, Social, Admin, Real-time`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log("Shutdown signal received, closing gracefully…");
  server.close(() => {
    pool.end(() => process.exit(0));
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
