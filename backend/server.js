const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luct-college';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// MongoDB Schemas and Models

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'lecturer', 'principal'] },
  studentId: String,
  employeeId: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Lecturer Schema
const lecturerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  courses: [String],
  overallRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  contact: String,
  office: String
});

const Lecturer = mongoose.model('Lecturer', lecturerSchema);

// Challenge Schema
const challengeSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  program: String,
  level: String,
  semester: String,
  course: String,
  lecturer: String,
  challenge: { type: String, required: true },
  status: { type: String, default: 'submitted' },
  priority: { type: String, default: 'medium' },
  submittedDate: { type: Date, default: Date.now },
  reviewedBy: String,
  reviewedDate: Date,
  response: String,
  resolution: String
});

const Challenge = mongoose.model('Challenge', challengeSchema);

// Rating Schema
const ratingSchema = new mongoose.Schema({
  studentId: String,
  studentName: String,
  lecturerName: { type: String, required: true },
  courseName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  ratingLabel: String,
  comments: String,
  submittedDate: { type: Date, default: Date.now },
  isAnonymous: { type: Boolean, default: false }
});

const Rating = mongoose.model('Rating', ratingSchema);

// Assigned Course Schema
const assignedCourseSchema = new mongoose.Schema({
  program: { type: String, required: true },
  course: { type: String, required: true },
  code: { type: String, required: true },
  lecturer: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String, required: true },
  week: { type: Number, default: 1 },
  semester: { type: String, default: 'semester1' },
  year: { type: String, default: 'certificate' },
  assignedDate: { type: Date, default: Date.now }
});

const AssignedCourse = mongoose.model('AssignedCourse', assignedCourseSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
  type: { type: String, required: true },
  program: { type: String, required: true },
  period: { type: String, required: true },
  date: String,
  status: { type: String, default: 'Compiled' },
  data: Object,
  createdDate: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Principal Report Schema
const principalReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, required: true },
  from: { type: String, required: true },
  date: String,
  dueDate: String,
  subject: String,
  keyConcerns: [String],
  keyPoints: [String],
  opportunities: [String],
  actionRequired: String,
  response: String,
  status: { type: String, default: 'pending' },
  responseDate: String
});

const PrincipalReport = mongoose.model('PrincipalReport', principalReportSchema);

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if lecturers already exist
    const lecturerCount = await Lecturer.countDocuments();
    if (lecturerCount === 0) {
      const defaultLecturers = [
        {
          name: 'Mr. Molao',
          department: 'IT',
          email: 'molao@college.ac.za',
          courses: ['Programming Principles', 'Advanced Programming'],
          contact: '+27 11 123 4567',
          office: 'IT Building Room 101'
        },
        {
          name: 'Mr. Makheka',
          department: 'IT',
          email: 'makheka@college.ac.za',
          courses: ['Web Technologies', 'Web Application Development'],
          contact: '+27 11 123 4568',
          office: 'IT Building Room 102'
        },
        {
          name: 'Mr. Thokoane',
          department: 'IT',
          email: 'thokoane@college.ac.za',
          courses: ['Database Systems', 'Database Management'],
          contact: '+27 11 123 4569',
          office: 'IT Building Room 103'
        }
      ];
      await Lecturer.insertMany(defaultLecturers);
      console.log(' Default lecturers created');
    }

    // Check if principal reports exist
    const reportCount = await PrincipalReport.countDocuments();
    if (reportCount === 0) {
      const defaultReports = [
        {
          title: 'Program Performance Review - Q1 2024',
          priority: 'high',
          from: 'Principal Office',
          date: '2024-01-20',
          dueDate: '2024-01-27',
          subject: 'IT Program Performance Analysis - Semester 1 2024',
          keyConcerns: [
            'Attendance rate dropped by 8% compared to previous semester',
            'Student performance in advanced programming courses below expectations',
            'Industry feedback suggests need for updated curriculum in web technologies'
          ],
          actionRequired: 'Please provide detailed response addressing these concerns and proposed improvement plan.'
        },
        {
          title: 'Resource Allocation Review',
          priority: 'medium',
          from: 'Academic Committee',
          date: '2024-01-18',
          dueDate: '2024-02-01',
          subject: 'IT Department Resource Utilization and Requirements',
          keyPoints: [
            'Review current laboratory equipment utilization rates',
            'Assess software licensing needs for next academic year',
            'Provide justification for additional teaching staff requests'
          ],
          actionRequired: 'Submit detailed resource assessment and requirements proposal.'
        }
      ];
      await PrincipalReport.insertMany(defaultReports);
      console.log(' Default principal reports created');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    services: {
      challenges: 'active',
      ratings: 'active',
      lecturers: 'active',
      courses: 'active',
      reports: 'active'
    }
  });
});

// Authentication endpoints
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, role, studentId, employeeId } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      role,
      studentId: role === 'student' ? studentId : null,
      employeeId: role !== 'student' ? employeeId : null
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.fullName 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId
      },
      token
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(400).json({ error: `User is not registered as a ${role}` });
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.fullName 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ===== LECTURERS ENDPOINTS =====
app.get('/api/lecturers', async (req, res) => {
  try {
    const lecturers = await Lecturer.find().sort({ name: 1 });
    res.json(lecturers);
  } catch (error) {
    console.error('Get lecturers error:', error);
    res.status(500).json({ error: 'Failed to fetch lecturers' });
  }
});

app.get('/api/lecturers/:id', async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) {
      return res.status(404).json({ error: 'Lecturer not found' });
    }
    res.json(lecturer);
  } catch (error) {
    console.error('Get lecturer error:', error);
    res.status(500).json({ error: 'Failed to fetch lecturer' });
  }
});

app.get('/api/lecturers/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = query.toLowerCase();
    const lecturers = await Lecturer.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { department: { $regex: searchTerm, $options: 'i' } },
        { courses: { $in: [new RegExp(searchTerm, 'i')] } }
      ]
    });

    res.json(lecturers);
  } catch (error) {
    console.error('Search lecturers error:', error);
    res.status(500).json({ error: 'Failed to search lecturers' });
  }
});

// ===== CHALLENGES ENDPOINTS =====
app.post('/api/challenges', async (req, res) => {
  try {
    const { studentId, studentName, program, level, semester, challenge, course, lecturer } = req.body;
    
    if (!challenge || !studentId) {
      return res.status(400).json({ error: 'Challenge description and student ID are required' });
    }

    const newChallenge = new Challenge({
      studentId,
      studentName: studentName || 'Anonymous Student',
      program: program || 'Not specified',
      level: level || 'Not specified',
      semester: semester || 'Not specified',
      course: course || 'Not specified',
      lecturer: lecturer || 'Not specified',
      challenge
    });

    await newChallenge.save();
    
    console.log(`New challenge submitted by ${newChallenge.studentName} (${newChallenge.studentId})`);
    
    res.status(201).json({
      message: 'Challenge submitted successfully to the Principal Lecturer!',
      challenge: newChallenge
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to save challenge' });
  }
});

app.get('/api/challenges', async (req, res) => {
  try {
    const { status, priority, lecturer } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (lecturer) filter.lecturer = { $regex: lecturer, $options: 'i' };

    const challenges = await Challenge.find(filter).sort({ submittedDate: -1 });
    res.json(challenges);
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

app.put('/api/challenges/:id', async (req, res) => {
  try {
    const { status, response, resolution, priority, reviewedBy } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (response) updateData.response = response;
    if (resolution) updateData.resolution = resolution;
    if (priority) updateData.priority = priority;
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedDate = new Date();
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      message: 'Challenge updated successfully',
      challenge
    });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// ===== RATINGS ENDPOINTS =====
app.post('/api/ratings', async (req, res) => {
  try {
    const { studentId, studentName, lecturerName, courseName, rating, comments } = req.body;
    
    if (!lecturerName || !rating || !courseName) {
      return res.status(400).json({ error: 'Lecturer name, course name, and rating are required' });
    }

    const ratingScores = {
      'excellent': 5,
      'good': 4,
      'average': 3,
      'poor': 2
    };

    const numericalRating = ratingScores[rating] || 3;

    const newRating = new Rating({
      studentId,
      studentName: studentName || 'Anonymous Student',
      lecturerName,
      courseName,
      rating: numericalRating,
      ratingLabel: rating,
      comments: comments || '',
      isAnonymous: !studentName
    });

    await newRating.save();

    // Update lecturer's overall rating
    const lecturer = await Lecturer.findOne({ name: { $regex: lecturerName, $options: 'i' } });
    if (lecturer) {
      const totalScore = (lecturer.overallRating * lecturer.totalRatings) + numericalRating;
      lecturer.totalRatings += 1;
      lecturer.overallRating = totalScore / lecturer.totalRatings;
      
      if (!lecturer.courses.includes(courseName)) {
        lecturer.courses.push(courseName);
      }
      
      await lecturer.save();
    }

    console.log(`New rating submitted for ${lecturerName} - ${courseName}`);
    
    res.status(201).json({
      message: `Rating submitted successfully for ${lecturerName} - ${courseName}`,
      rating: newRating,
      lecturerUpdated: !!lecturer
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to save rating' });
  }
});

app.get('/api/ratings', async (req, res) => {
  try {
    const { lecturer, course, minRating, maxRating } = req.query;
    let filter = {};

    if (lecturer) filter.lecturerName = { $regex: lecturer, $options: 'i' };
    if (course) filter.courseName = { $regex: course, $options: 'i' };
    if (minRating) filter.rating = { $gte: parseInt(minRating) };
    if (maxRating) {
      filter.rating = filter.rating || {};
      filter.rating.$lte = parseInt(maxRating);
    }

    const ratings = await Rating.find(filter).sort({ submittedDate: -1 });
    res.json(ratings);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// ===== COURSE ASSIGNMENT ENDPOINTS =====
app.get('/api/courses/assigned', async (req, res) => {
  try {
    const assignedCourses = await AssignedCourse.find().sort({ assignedDate: -1 });
    res.json(assignedCourses);
  } catch (error) {
    console.error('Get assigned courses error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned courses' });
  }
});

app.post('/api/courses/assign', async (req, res) => {
  try {
    const { program, course, code, lecturer, day, time, week, semester, year } = req.body;
    
    if (!program || !course || !code || !lecturer || !day || !time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newAssignment = new AssignedCourse({
      program,
      course,
      code,
      lecturer,
      day,
      time,
      week: week || 1,
      semester: semester || 'semester1',
      year: year || 'certificate'
    });

    await newAssignment.save();

    res.status(201).json({
      message: 'Course assigned successfully!',
      assignment: newAssignment
    });
  } catch (error) {
    console.error('Assign course error:', error);
    res.status(500).json({ error: 'Failed to assign course' });
  }
});

app.delete('/api/courses/assigned/:id', async (req, res) => {
  try {
    const assignment = await AssignedCourse.findByIdAndDelete(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({
      message: 'Assignment removed successfully',
      assignment
    });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// ===== REPORTS ENDPOINTS =====
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdDate: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { type, program, period, data } = req.body;
    
    if (!type || !program || !period) {
      return res.status(400).json({ error: 'Report type, program, and period are required' });
    }

    const newReport = new Report({
      type,
      program,
      period,
      date: new Date().toLocaleDateString(),
      data: data || {}
    });

    await newReport.save();

    res.status(201).json({
      message: 'Report compiled successfully!',
      report: newReport
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Report deleted successfully',
      report
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// ===== PRINCIPAL REPORTS ENDPOINTS =====
app.get('/api/principal-reports', async (req, res) => {
  try {
    const reports = await PrincipalReport.find().sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Get principal reports error:', error);
    res.status(500).json({ error: 'Failed to fetch principal reports' });
  }
});

app.put('/api/principal-reports/:id', async (req, res) => {
  try {
    const { response, status } = req.body;
    
    const updateData = {};
    if (response) updateData.response = response;
    if (status) {
      updateData.status = status;
      if (status === 'submitted') {
        updateData.responseDate = new Date().toISOString().split('T')[0];
      }
    }

    const report = await PrincipalReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Report response updated successfully',
      report
    });
  } catch (error) {
    console.error('Update principal report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// ===== STATISTICS ENDPOINTS =====
app.get('/api/ratings/stats', async (req, res) => {
  try {
    const ratings = await Rating.find();
    const lecturers = await Lecturer.find().sort({ overallRating: -1 }).limit(5);

    const stats = {
      totalRatings: ratings.length,
      averageRating: 0,
      ratingDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0
      },
      topLecturers: lecturers.map(lecturer => ({
        name: lecturer.name,
        department: lecturer.department,
        overallRating: lecturer.overallRating,
        totalRatings: lecturer.totalRatings,
        courses: lecturer.courses
      })),
      recentSubmissions: await Rating.find().sort({ submittedDate: -1 }).limit(10)
    };

    if (ratings.length > 0) {
      const totalScore = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      stats.averageRating = totalScore / ratings.length;

      ratings.forEach(rating => {
        if (rating.rating >= 4.5) stats.ratingDistribution.excellent++;
        else if (rating.rating >= 3.5) stats.ratingDistribution.good++;
        else if (rating.rating >= 2.5) stats.ratingDistribution.average++;
        else stats.ratingDistribution.poor++;
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Get ratings stats error:', error);
    res.status(500).json({ error: 'Failed to fetch rating statistics' });
  }
});

app.get('/api/challenges/stats', async (req, res) => {
  try {
    const challenges = await Challenge.find();

    const stats = {
      totalChallenges: challenges.length,
      byStatus: {
        submitted: 0,
        reviewed: 0,
        resolved: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      byLecturer: {},
      recentChallenges: await Challenge.find().sort({ submittedDate: -1 }).limit(10)
    };

    challenges.forEach(challenge => {
      stats.byStatus[challenge.status] = (stats.byStatus[challenge.status] || 0) + 1;
      stats.byPriority[challenge.priority] = (stats.byPriority[challenge.priority] || 0) + 1;
      const lecturer = challenge.lecturer || 'Unknown';
      stats.byLecturer[lecturer] = (stats.byLecturer[lecturer] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Get challenges stats error:', error);
    res.status(500).json({ error: 'Failed to fetch challenge statistics' });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [
      challenges,
      ratings,
      lecturers,
      assignedCourses,
      reports
    ] = await Promise.all([
      Challenge.find(),
      Rating.find(),
      Lecturer.find(),
      AssignedCourse.find(),
      Report.find()
    ]);

    const stats = {
      overview: {
        totalLecturers: lecturers.length,
        totalAssignedCourses: assignedCourses.length,
        totalChallenges: challenges.length,
        totalRatings: ratings.length,
        totalReports: reports.length
      },
      challenges: {
        pending: challenges.filter(c => c.status === 'submitted').length,
        reviewed: challenges.filter(c => c.status === 'reviewed').length,
        resolved: challenges.filter(c => c.status === 'resolved').length
      },
      ratings: {
        averageRating: ratings.length > 0 ? 
          (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : 0,
        totalRatings: ratings.length
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Initialize data and start server
const startServer = async () => {
  try {
    await initializeDefaultData();
    
    app.listen(PORT, () => {
      console.log(` Server is running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api/`);
      console.log(`  MongoDB: ${MONGODB_URI}`);
      console.log('\n Available endpoints:');
      console.log('  POST /api/signup');
      console.log('  POST /api/login');
      console.log('  GET  /api/health');
      console.log('  GET  /api/dashboard/stats');
      console.log('\n Lecturers:');
      console.log('  GET  /api/lecturers');
      console.log('  GET  /api/lecturers/:id');
      console.log('  GET  /api/lecturers/search?query=name');
      console.log('\n Challenges:');
      console.log('  GET  /api/challenges');
      console.log('  POST /api/challenges');
      console.log('  PUT  /api/challenges/:id');
      console.log('  GET  /api/challenges/stats');
      console.log('\n Ratings:');
      console.log('  GET  /api/ratings');
      console.log('  POST /api/ratings');
      console.log('  GET  /api/ratings/stats');
      console.log('\n Courses:');
      console.log('  GET  /api/courses/assigned');
      console.log('  POST /api/courses/assign');
      console.log('  DELETE /api/courses/assigned/:id');
      console.log('\n Reports:');
      console.log('  GET  /api/reports');
      console.log('  POST /api/reports');
      console.log('  DELETE /api/reports/:id');
      console.log('  GET  /api/principal-reports');
      console.log('  PUT  /api/principal-reports/:id');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;