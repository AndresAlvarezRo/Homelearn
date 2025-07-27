const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { Pool } = require("pg")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const compression = require("compression")
const morgan = require("morgan")
const { v4: uuidv4 } = require("uuid")
const sharp = require("sharp")
const http = require("http")
const socketIo = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
})

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || "homelearn_super_secret_key_2024"

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || "homelearn_user",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "homelearn_db",
  password: process.env.DB_PASSWORD || "homelearn_password",
  port: process.env.DB_PORT || 5432,
})

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)
app.use(compression())
app.use(morgan("combined"))
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use("/api/", limiter)

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "courseFile") {
      if (file.mimetype === "application/json") {
        cb(null, true)
      } else {
        cb(new Error("Only JSON files are allowed for courses"))
      }
    } else if (file.fieldname === "profilePic") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true)
      } else {
        cb(new Error("Only image files are allowed for profile pictures"))
      }
    } else {
      cb(null, true)
    }
  },
})

// Serve uploaded files
app.use("/uploads", express.static("uploads"))

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const result = await pool.query(
      "SELECT id, username, email, user_code, is_admin, profile_pic, biography, created_at FROM users WHERE id = $1",
      [decoded.userId],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token" })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    console.error("Auth error:", error)
    return res.status(403).json({ error: "Invalid token" })
  }
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// Utility functions
const generateUserCode = () => {
  return "USER" + Math.random().toString(36).substr(2, 6).toUpperCase()
}

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// Socket.io for real-time features
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-course", (courseId) => {
    socket.join(`course-${courseId}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  })
})

// Authentication routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" })
    }

    const hashedPassword = await hashPassword(password)
    const userCode = generateUserCode()

    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, user_code) VALUES ($1, $2, $3, $4) RETURNING id, username, email, user_code, is_admin, created_at",
      [username, email, hashedPassword, userCode],
    )

    const user = result.rows[0]

    console.log("✅ User registered:", user.username)

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
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Registration failed" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    console.log("🔐 Login attempt for:", email)

    const result = await pool.query(
      "SELECT id, username, email, password_hash, user_code, is_admin, profile_pic, biography, created_at FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      console.log("❌ User not found:", email)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = result.rows[0]
    const isValidPassword = await comparePassword(password, user.password_hash)

    if (!isValidPassword) {
      console.log("❌ Invalid password for:", email)
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" })

    console.log("✅ Login successful:", user.username, "Admin:", user.is_admin)

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
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

// Profile routes
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
  })
})

app.put("/api/profile", authenticateToken, upload.single("profilePic"), async (req, res) => {
  try {
    const { username, biography } = req.body
    let profilePicPath = req.user.profile_pic

    // Ensure username is not null or empty
    const finalUsername = username && username.trim() ? username.trim() : req.user.username || `User_${req.user.id}`

    if (req.file) {
      // Process and resize image
      const processedImagePath = `uploads/profile-${req.user.id}-${Date.now()}.jpg`
      await sharp(req.file.path).resize(200, 200).jpeg({ quality: 80 }).toFile(processedImagePath)

      // Delete original uploaded file
      fs.unlinkSync(req.file.path)
      profilePicPath = processedImagePath
    }

    const result = await pool.query(
      "UPDATE users SET username = $1, biography = $2, profile_pic = $3 WHERE id = $4 RETURNING username, biography, profile_pic",
      [finalUsername, biography || null, profilePicPath, req.user.id],
    )

    res.json({
      message: "Profile updated successfully",
      username: result.rows[0].username,
      biography: result.rows[0].biography,
      profile_pic: result.rows[0].profile_pic,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// Course routes
app.get("/api/courses", authenticateToken, async (req, res) => {
  try {
    const { search } = req.query
    let query = `
      SELECT c.*, u.username as created_by_username,
             COUNT(cl.id) as level_count
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN course_levels cl ON c.id = cl.course_id
    `
    const params = []

    if (search) {
      query += " WHERE c.title ILIKE $1 OR c.description ILIKE $1"
      params.push(`%${search}%`)
    }

    query += " GROUP BY c.id, u.username ORDER BY c.created_at DESC"

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error("Courses fetch error:", error)
    res.status(500).json({ error: "Failed to fetch courses" })
  }
})

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
      [req.user.id],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("My courses fetch error:", error)
    res.status(500).json({ error: "Failed to fetch enrolled courses" })
  }
})

app.post("/api/courses/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id

    // Check if already enrolled
    const existing = await pool.query("SELECT id FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [
      req.user.id,
      courseId,
    ])

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Already enrolled in this course" })
    }

    await pool.query("INSERT INTO user_enrollments (user_id, course_id) VALUES ($1, $2)", [req.user.id, courseId])

    res.json({ message: "Enrolled successfully" })
  } catch (error) {
    console.error("Enrollment error:", error)
    res.status(500).json({ error: "Failed to enroll" })
  }
})

app.delete("/api/courses/:id/unsubscribe", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id

    await pool.query("DELETE FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [req.user.id, courseId])

    res.json({ message: "Unsubscribed successfully" })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    res.status(500).json({ error: "Failed to unsubscribe" })
  }
})

app.get("/api/course/:id", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id

    // Get course details
    const courseResult = await pool.query(
      `
      SELECT c.*, u.username as created_by_username
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `,
      [courseId],
    )

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" })
    }

    // Get course levels
    const levelsResult = await pool.query(
      `
      SELECT cl.*, 
             CASE WHEN up.id IS NOT NULL THEN true ELSE false END as completed
      FROM course_levels cl
      LEFT JOIN user_progress up ON cl.id = up.level_id AND up.user_id = $1
      WHERE cl.course_id = $2
      ORDER BY cl.level_order
    `,
      [req.user.id, courseId],
    )

    // Check enrollment
    const enrollmentResult = await pool.query("SELECT id FROM user_enrollments WHERE user_id = $1 AND course_id = $2", [
      req.user.id,
      courseId,
    ])

    const course = courseResult.rows[0]
    course.levels = levelsResult.rows
    course.isEnrolled = enrollmentResult.rows.length > 0

    res.json(course)
  } catch (error) {
    console.error("Course detail error:", error)
    res.status(500).json({ error: "Failed to fetch course details" })
  }
})

app.post("/api/course/:courseId/level/:levelId/complete", authenticateToken, async (req, res) => {
  try {
    const { courseId, levelId } = req.params

    // Check if already completed
    const existing = await pool.query("SELECT id FROM user_progress WHERE user_id = $1 AND level_id = $2", [
      req.user.id,
      levelId,
    ])

    if (existing.rows.length === 0) {
      await pool.query("INSERT INTO user_progress (user_id, level_id, completed_at) VALUES ($1, $2, NOW())", [
        req.user.id,
        levelId,
      ])
    }

    // Emit real-time update
    io.to(`course-${courseId}`).emit("level-completed", {
      userId: req.user.id,
      levelId,
      username: req.user.username,
    })

    res.json({ message: "Level completed" })
  } catch (error) {
    console.error("Level completion error:", error)
    res.status(500).json({ error: "Failed to mark level as complete" })
  }
})

// Course upload - UPDATED TO HANDLE ALL JSON FORMATS
app.post("/api/courses/upload", authenticateToken, upload.single("courseFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    console.log("📁 Processing course file:", req.file.filename)

    const courseData = JSON.parse(fs.readFileSync(req.file.path, "utf8"))
    console.log("📋 Course data structure:", Object.keys(courseData))

    // Handle ANY JSON format with your structure
    let courseTitle = ""
    let courseDescription = ""
    let levels = []

    // Get the first key from the JSON (this will be the course type)
    const courseKey = Object.keys(courseData)[0]

    if (courseKey && Array.isArray(courseData[courseKey])) {
      // Map course names to readable titles
      const courseNames = {
        ruta_aprendizaje_ciberseguridad: "Ruta de Aprendizaje en Ciberseguridad",
        ruta_aprendizaje_crochet: "Ruta de Aprendizaje en Crochet",
        ruta_ia_en_administracion_y_contaduria: "Ruta de IA en Administración y Contaduría",
        leverage_crypto: "Leverage Crypto Trading",
        hipertrofia_fat_loss: "Hipertrofia y Pérdida de Grasa",
      }

      courseTitle = courseNames[courseKey] || courseKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      courseDescription = `Curso completo de ${courseTitle.toLowerCase()}`
      levels = courseData[courseKey]
    } else if (courseData.title && courseData.levels) {
      // Handle the old format too
      courseTitle = courseData.title
      courseDescription = courseData.description || ""
      levels = courseData.levels
    } else {
      return res.status(400).json({
        error: "Invalid course format. Expected an object with a course array or 'title' and 'levels'",
      })
    }

    if (!levels || levels.length === 0) {
      return res.status(400).json({ error: "No levels found in course data" })
    }

    console.log("📚 Creating course:", courseTitle, "with", levels.length, "levels")

    // Create course
    const courseResult = await pool.query(
      "INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING id",
      [courseTitle, courseDescription, req.user.id],
    )

    const courseId = courseResult.rows[0].id
    console.log("✅ Course created with ID:", courseId)

    // Create levels
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i]

      // Handle both formats
      const levelTitle = level.nivel || level.level || `Level ${i + 1}`
      const topics = level.temas || level.topics || []
      const objectives = level.objetivos || level.objectives || []
      const tools = level.herramientas || level.tools || []
      const resources = level.recursos || level.resources || []

      console.log(`📝 Creating level ${i + 1}:`, levelTitle)

      await pool.query(
        "INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, content, level_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [
          courseId,
          i + 1,
          levelTitle,
          topics,
          objectives,
          tools,
          resources,
          JSON.stringify({
            topics,
            objectives,
            tools,
            resources,
          }),
          i + 1,
        ],
      )
    }

    // Delete uploaded file
    fs.unlinkSync(req.file.path)

    console.log("🎉 Course upload completed successfully")

    res.json({
      message: "Course uploaded successfully",
      courseId,
      title: courseTitle,
      levelsCount: levels.length,
    })
  } catch (error) {
    console.error("Course upload error:", error)
    res.status(500).json({ error: "Failed to upload course: " + error.message })
  }
})

// UPDATED: Allow course creators to delete their own courses
app.delete("/api/courses/:id", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id

    // Check if user is admin OR the course creator
    const courseResult = await pool.query("SELECT created_by FROM courses WHERE id = $1", [courseId])

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" })
    }

    const course = courseResult.rows[0]
    const isOwner = course.created_by === req.user.id
    const isAdmin = req.user.is_admin

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "You can only delete courses you created" })
    }

    console.log(`🗑️ Deleting course ${courseId} by user ${req.user.username} (Admin: ${isAdmin}, Owner: ${isOwner})`)

    // Delete in correct order due to foreign key constraints
    await pool.query(
      "DELETE FROM user_progress WHERE level_id IN (SELECT id FROM course_levels WHERE course_id = $1)",
      [courseId],
    )
    await pool.query("DELETE FROM user_enrollments WHERE course_id = $1", [courseId])
    await pool.query("DELETE FROM course_levels WHERE course_id = $1", [courseId])
    await pool.query("DELETE FROM courses WHERE id = $1", [courseId])

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Course deletion error:", error)
    res.status(500).json({ error: "Failed to delete course" })
  }
})

// Social features
app.get("/api/friends", authenticateToken, async (req, res) => {
  try {
    const friendsResult = await pool.query(
      `
      SELECT f.*, 
             u.username as friend_username,
             u.user_code as friend_user_code,
             u.profile_pic as friend_profile_pic
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = $1 THEN f.friend_id = u.id
          ELSE f.user_id = u.id
        END
      )
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'
      ORDER BY f.created_at DESC
    `,
      [req.user.id],
    )

    const pendingResult = await pool.query(
      `
      SELECT f.*, 
             u.username as friend_username,
             u.user_code as friend_user_code,
             u.profile_pic as friend_profile_pic,
             CASE 
               WHEN f.user_id = $1 THEN 'sent'
               ELSE 'received'
             END as request_type
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = $1 THEN f.friend_id = u.id
          ELSE f.user_id = u.id
        END
      )
      WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `,
      [req.user.id],
    )

    res.json({
      friends: friendsResult.rows,
      pendingRequests: pendingResult.rows,
    })
  } catch (error) {
    console.error("Friends fetch error:", error)
    res.status(500).json({ error: "Failed to fetch friends" })
  }
})

app.post("/api/friends/request", authenticateToken, async (req, res) => {
  try {
    const { userCode } = req.body

    if (!userCode) {
      return res.status(400).json({ error: "User code is required" })
    }

    // Find user by code
    const userResult = await pool.query("SELECT id FROM users WHERE user_code = $1 AND id != $2", [
      userCode,
      req.user.id,
    ])

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const friendId = userResult.rows[0].id

    // Check if friendship already exists
    const existingResult = await pool.query(
      "SELECT id FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
      [req.user.id, friendId],
    )

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: "Friend request already exists" })
    }

    await pool.query("INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)", [
      req.user.id,
      friendId,
      "pending",
    ])

    res.json({ message: "Friend request sent" })
  } catch (error) {
    console.error("Friend request error:", error)
    res.status(500).json({ error: "Failed to send friend request" })
  }
})

app.put("/api/friends/:id", authenticateToken, async (req, res) => {
  try {
    const friendshipId = req.params.id
    const { action } = req.body

    if (action === "accept") {
      await pool.query("UPDATE friendships SET status = $1 WHERE id = $2 AND friend_id = $3", [
        "accepted",
        friendshipId,
        req.user.id,
      ])
      res.json({ message: "Friend request accepted" })
    } else if (action === "reject") {
      await pool.query("DELETE FROM friendships WHERE id = $1 AND friend_id = $2", [friendshipId, req.user.id])
      res.json({ message: "Friend request rejected" })
    } else {
      res.status(400).json({ error: "Invalid action" })
    }
  } catch (error) {
    console.error("Friend response error:", error)
    res.status(500).json({ error: "Failed to respond to friend request" })
  }
})

app.get("/api/users/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json([])
    }

    const result = await pool.query(
      `
      SELECT u.id, u.username, u.user_code, u.profile_pic,
             COUNT(DISTINCT ue.course_id) as enrolled_courses,
             COUNT(DISTINCT up.id) as completed_levels
      FROM users u
      LEFT JOIN user_enrollments ue ON u.id = ue.user_id
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.username ILIKE $1 AND u.id != $2
      GROUP BY u.id, u.username, u.user_code, u.profile_pic
      LIMIT 10
    `,
      [`%${q}%`, req.user.id],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("User search error:", error)
    res.status(500).json({ error: "Failed to search users" })
  }
})

// Admin user management
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
    `)

    res.json(result.rows)
  } catch (error) {
    console.error("Admin users fetch error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// System logs
app.get("/api/admin/logs", authenticateToken, requireAdmin, (req, res) => {
  try {
    // In a real app, you'd read from log files or a logging service
    const logs = [
      { timestamp: new Date().toISOString(), level: "INFO", message: "System started successfully" },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: "INFO", message: "User logged in" },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: "WARN", message: "High memory usage detected" },
    ]

    res.json(logs)
  } catch (error) {
    console.error("Logs fetch error:", error)
    res.status(500).json({ error: "Failed to fetch logs" })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)
  res.status(500).json({ error: "Internal server error" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Advanced Homelearn Server running on port ${PORT}`)
  console.log(`📚 Features: Auth, Courses, Social, Admin, Real-time`)
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    pool.end()
    process.exit(0)
  })
})
