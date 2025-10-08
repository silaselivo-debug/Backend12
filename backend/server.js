require("dotenv").config()

const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || "development"
const MONGODB_URI = process.env.MONGODB_URI

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // In development, allow common localhost origins
    if (NODE_ENV === "development") {
      const allowedDevOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost:5000',
        'http://127.0.0.1:5000'
      ]
      
      if (allowedDevOrigins.indexOf(origin) !== -1 || origin.includes('://localhost') || origin.includes('://127.0.0.1')) {
        return callback(null, true)
      }
    }
    
    // In production, you would add your specific domains here
    // For now, allowing all origins in development for testing
    if (NODE_ENV === "development") {
      callback(null, true)
    } else {
      // Production - restrict to specific domains
      const allowedProdOrigins = [
        'https://yourdomain.com',
        'https://www.yourdomain.com'
        // Add your production domains here
      ]
      
      if (allowedProdOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        console.log('Blocked by CORS:', origin)
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range'
  ],
  maxAge: 86400,
  optionsSuccessStatus: 204
}

// Middleware - Apply CORS to all routes
app.use(cors(corsOptions))

// No need for separate app.options('*') - cors middleware handles preflight automatically

app.use(bodyParser.json())

// Add security headers middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

// MongoDB connection with better error handling
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected')
})

// Your existing schemas and routes remain the same...
const timetableSchema = new mongoose.Schema({
  program: { type: String, required: true },
  level: String,
  year: String,
  semester: { type: String, required: true },
  week: { type: Number, required: true },
  day: { type: String, required: true },
  time: { type: String, required: true },
  course: { type: String, required: true },
  lecturer: { type: String, required: true },
  code: String,
  createdAt: { type: Date, default: Date.now },
})

const studentChallengeSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: String,
  challenge: { type: String, required: true },
  program: String,
  level: String,
  semester: String,
  status: { type: String, default: "pending" },
  submittedAt: { type: Date, default: Date.now },
})

const studentRatingSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: String,
  lecturerName: { type: String, required: true },
  courseName: { type: String, required: true },
  rating: { type: Number, required: true },
  program: String,
  level: String,
  semester: String,
  submittedAt: { type: Date, default: Date.now },
})

const lecturerReportSchema = new mongoose.Schema({
  lecturerId: { type: String, required: true },
  lecturerName: String,
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, default: "medium" },
  type: { type: String, default: "general" },
  status: { type: String, default: "sent" },
  submittedAt: { type: Date, default: Date.now },
})

const programLeaderFeedbackSchema = new mongoose.Schema({
  programLeaderId: { type: String, required: true },
  programLeaderName: String,
  recipient: { type: String, required: true },
  subject: String,
  category: String,
  priority: { type: String, default: "medium" },
  message: { type: String, required: true },
  lecturer: String,
  course: String,
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, default: "submitted" },
  submittedAt: { type: Date, default: Date.now },
})

const principalLecturerFeedbackSchema = new mongoose.Schema({
  principalId: { type: String, required: true },
  principalName: String,
  recipient: { type: String, required: true },
  name: { type: String, required: true },
  program: String,
  course: String,
  feedback: { type: String, required: true },
  rating: Number,
  status: { type: String, default: "sent" },
  submittedAt: { type: Date, default: Date.now },
})

const Timetable = mongoose.model("Timetable", timetableSchema)
const StudentChallenge = mongoose.model("StudentChallenge", studentChallengeSchema)
const StudentRating = mongoose.model("StudentRating", studentRatingSchema)
const LecturerReport = mongoose.model("LecturerReport", lecturerReportSchema)
const ProgramLeaderFeedback = mongoose.model("ProgramLeaderFeedback", programLeaderFeedbackSchema)
const PrincipalLecturerFeedback = mongoose.model("PrincipalLecturerFeedback", principalLecturerFeedbackSchema)

// Your existing API routes remain exactly the same...
app.post("/api/timetables", async (req, res) => {
  try {
    const { program, level, year, semester, week, day, time, course, lecturer, code } = req.body

    // Validate required fields
    if (!program || !day || !time || !course || !lecturer || !week || !semester) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Check if timetable entry already exists
    const existingEntry = await Timetable.findOne({
      program,
      level,
      year,
      semester,
      week,
      day,
      time,
    })

    if (existingEntry) {
      // Update existing entry
      existingEntry.course = course
      existingEntry.lecturer = lecturer
      existingEntry.code = code
      existingEntry.createdAt = new Date()
      await existingEntry.save()

      res.status(200).json({
        message: "Timetable updated successfully",
        timetable: existingEntry,
      })
    } else {
      // Create new entry
      const newTimetable = new Timetable({
        program,
        level,
        year,
        semester,
        week,
        day,
        time,
        course,
        lecturer,
        code,
      })
      await newTimetable.save()

      res.status(200).json({
        message: "Timetable saved successfully",
        timetable: newTimetable,
      })
    }
  } catch (error) {
    console.error("Error saving timetable:", error)
    res.status(500).json({ error: "Failed to save timetable" })
  }
})

app.get("/api/timetables", async (req, res) => {
  try {
    const { program, level, year, semester, week } = req.query

    // Build query filter
    const filter = {}
    if (program) filter.program = program
    if (level) filter.level = level
    if (year) filter.year = year
    if (semester) filter.semester = semester
    if (week) filter.week = Number.parseInt(week)

    const timetables = await Timetable.find(filter).sort({ day: 1, time: 1 })

    res.status(200).json({
      timetables,
      count: timetables.length,
    })
  } catch (error) {
    console.error("Error fetching timetables:", error)
    res.status(500).json({ error: "Failed to fetch timetables" })
  }
})

app.delete("/api/timetables/:id", async (req, res) => {
  try {
    const { program, level, year, semester, week, day, time } = req.query

    const result = await Timetable.deleteOne({
      program,
      level,
      year,
      semester,
      week: Number.parseInt(week),
      day,
      time,
    })

    if (result.deletedCount > 0) {
      res.status(200).json({ message: "Timetable entry deleted successfully" })
    } else {
      res.status(404).json({ error: "Timetable entry not found" })
    }
  } catch (error) {
    console.error("Error deleting timetable:", error)
    res.status(500).json({ error: "Failed to delete timetable" })
  }
})

app.get("/api/timetables/all", async (req, res) => {
  try {
    const timetables = await Timetable.find()
    res.status(200).json({
      timetables,
      count: timetables.length,
    })
  } catch (error) {
    console.error("Error fetching all timetables:", error)
    res.status(500).json({ error: "Failed to fetch timetables" })
  }
})

app.post("/api/student/challenges", async (req, res) => {
  try {
    const { studentId, studentName, challenge, program, level, semester } = req.body

    if (!studentId || !challenge) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newChallenge = new StudentChallenge({
      studentId,
      studentName,
      challenge,
      program,
      level,
      semester,
    })
    await newChallenge.save()

    res.status(200).json({
      message: "Challenge submitted successfully to Principal Lecturer",
      challenge: newChallenge,
    })
  } catch (error) {
    console.error("Error submitting challenge:", error)
    res.status(500).json({ error: "Failed to submit challenge" })
  }
})

app.post("/api/student/ratings", async (req, res) => {
  try {
    const { studentId, studentName, lecturerName, courseName, rating, program, level, semester } = req.body

    if (!studentId || !lecturerName || !courseName || !rating) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newRating = new StudentRating({
      studentId,
      studentName,
      lecturerName,
      courseName,
      rating,
      program,
      level,
      semester,
    })
    await newRating.save()

    res.status(200).json({
      message: "Rating submitted successfully",
      rating: newRating,
    })
  } catch (error) {
    console.error("Error submitting rating:", error)
    res.status(500).json({ error: "Failed to submit rating" })
  }
})

app.post("/api/lecturer/reports", async (req, res) => {
  try {
    const { lecturerId, lecturerName, title, content, priority, type } = req.body

    if (!lecturerId || !title || !content) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newReport = new LecturerReport({
      lecturerId,
      lecturerName,
      title,
      content,
      priority,
      type,
    })
    await newReport.save()

    res.status(200).json({
      message: "Report sent to Program Leader successfully",
      report: newReport,
    })
  } catch (error) {
    console.error("Error submitting lecturer report:", error)
    res.status(500).json({ error: "Failed to submit report" })
  }
})

app.post("/api/program-leader/feedback", async (req, res) => {
  try {
    const {
      programLeaderId,
      programLeaderName,
      recipient,
      subject,
      category,
      priority,
      message,
      lecturer,
      course,
      isAnonymous,
    } = req.body

    if (!programLeaderId || !recipient || !message) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newFeedback = new ProgramLeaderFeedback({
      programLeaderId,
      programLeaderName,
      recipient,
      subject,
      category,
      priority,
      message,
      lecturer,
      course,
      isAnonymous,
    })
    await newFeedback.save()

    res.status(200).json({
      message: `Feedback sent to ${recipient} successfully`,
      feedback: newFeedback,
    })
  } catch (error) {
    console.error("Error submitting program leader feedback:", error)
    res.status(500).json({ error: "Failed to submit feedback" })
  }
})

app.post("/api/principal-lecturer/feedback", async (req, res) => {
  try {
    const { principalId, principalName, recipient, name, program, course, feedback, rating } = req.body

    if (!principalId || !recipient || !name || !feedback) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const newFeedback = new PrincipalLecturerFeedback({
      principalId,
      principalName,
      recipient,
      name,
      program,
      course,
      feedback,
      rating,
    })
    await newFeedback.save()

    res.status(200).json({
      message: `Feedback sent to ${recipient} portal successfully`,
      feedback: newFeedback,
    })
  } catch (error) {
    console.error("Error submitting principal lecturer feedback:", error)
    res.status(500).json({ error: "Failed to submit feedback" })
  }
})

app.get("/api/student/challenges", async (req, res) => {
  try {
    const { studentId } = req.query
    const filter = studentId ? { studentId } : {}

    const challenges = await StudentChallenge.find(filter).sort({ submittedAt: -1 })

    res.status(200).json({
      challenges,
      count: challenges.length,
    })
  } catch (error) {
    console.error("Error fetching challenges:", error)
    res.status(500).json({ error: "Failed to fetch challenges" })
  }
})

app.get("/api/student/ratings", async (req, res) => {
  try {
    const { studentId, lecturerName } = req.query
    const filter = {}
    if (studentId) filter.studentId = studentId
    if (lecturerName) filter.lecturerName = lecturerName

    const ratings = await StudentRating.find(filter).sort({ submittedAt: -1 })

    res.status(200).json({
      ratings,
      count: ratings.length,
    })
  } catch (error) {
    console.error("Error fetching ratings:", error)
    res.status(500).json({ error: "Failed to fetch ratings" })
  }
})

app.get("/api/lecturer/reports", async (req, res) => {
  try {
    const { lecturerId } = req.query
    const filter = lecturerId ? { lecturerId } : {}

    const reports = await LecturerReport.find(filter).sort({ submittedAt: -1 })

    res.status(200).json({
      reports,
      count: reports.length,
    })
  } catch (error) {
    console.error("Error fetching lecturer reports:", error)
    res.status(500).json({ error: "Failed to fetch reports" })
  }
})

app.get("/api/program-leader/feedback", async (req, res) => {
  try {
    const { programLeaderId, recipient } = req.query
    const filter = {}
    if (programLeaderId) filter.programLeaderId = programLeaderId
    if (recipient) filter.recipient = recipient

    const feedback = await ProgramLeaderFeedback.find(filter).sort({ submittedAt: -1 })

    res.status(200).json({
      feedback,
      count: feedback.length,
    })
  } catch (error) {
    console.error("Error fetching program leader feedback:", error)
    res.status(500).json({ error: "Failed to fetch feedback" })
  }
})

app.get("/api/principal-lecturer/feedback", async (req, res) => {
  try {
    const { principalId, recipient } = req.query
    const filter = {}
    if (principalId) filter.principalId = principalId
    if (recipient) filter.recipient = recipient

    const feedback = await PrincipalLecturerFeedback.find(filter).sort({ submittedAt: -1 })

    res.status(200).json({
      feedback,
      count: feedback.length,
    })
  } catch (error) {
    console.error("Error fetching principal lecturer feedback:", error)
    res.status(500).json({ error: "Failed to fetch feedback" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "Server is running",
    environment: NODE_ENV,
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)
  console.log(`MongoDB URI: ${MONGODB_URI ? 'Connected to MongoDB Atlas' : 'Not configured'}`)
  console.log(`CORS Configuration:`)
  console.log(`  - Environment: ${NODE_ENV}`)
  console.log(`  - Allowed Origins: ${NODE_ENV === 'development' ? 'All origins (development mode)' : 'Production domains only'}`)
  console.log(`  - Credentials: Enabled`)
  console.log(`  - Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`)
  console.log(`API endpoints:`)
  console.log(`  Timetables:`)
  console.log(`    POST   http://localhost:${PORT}/api/timetables`)
  console.log(`    GET    http://localhost:${PORT}/api/timetables`)
  console.log(`    DELETE http://localhost:${PORT}/api/timetables/:id`)
  console.log(`    GET    http://localhost:${PORT}/api/timetables/all`)
  console.log(`  Student:`)
  console.log(`    POST   http://localhost:${PORT}/api/student/challenges`)
  console.log(`    POST   http://localhost:${PORT}/api/student/ratings`)
  console.log(`    GET    http://localhost:${PORT}/api/student/challenges`)
  console.log(`    GET    http://localhost:${PORT}/api/student/ratings`)
  console.log(`  Lecturer:`)
  console.log(`    POST   http://localhost:${PORT}/api/lecturer/reports`)
  console.log(`    GET    http://localhost:${PORT}/api/lecturer/reports`)
  console.log(`  Program Leader:`)
  console.log(`    POST   http://localhost:${PORT}/api/program-leader/feedback`)
  console.log(`    GET    http://localhost:${PORT}/api/program-leader/feedback`)
  console.log(`  Principal Lecturer:`)
  console.log(`    POST   http://localhost:${PORT}/api/principal-lecturer/feedback`)
  console.log(`    GET    http://localhost:${PORT}/api/principal-lecturer/feedback`)
  console.log(`  Health:`)
  console.log(`    GET    http://localhost:${PORT}/api/health`)
})

module.exports = app