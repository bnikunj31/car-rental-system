// Packages
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controllers Imported
const User = require('../models/User');
const protect = require('../middleware/auth');
const {
  getProfile,
  editProfile,
  updateProfile
} = require('../controllers/profileController');
const { register, login, logout, verifyOtp, resendOtp} = require('../controllers/authController');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile_pics/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes
router.get('/', (req, res) => res.render('index'));
router.get('/register', (req, res) => res.render('register'));
router.post('/register', register);
router.post('/otp', verifyOtp);
// Resend OTP route
router.post('/resend-otp', resendOtp);
router.get('/login', (req, res) => res.render('login'));
router.post('/login', login);
router.get('/logout', logout);

// Profile routes
router.get('/profile', protect, getProfile);
router.get('/profile/edit', protect, editProfile);
router.post('/profile/edit', protect, upload.single('profilePic'), updateProfile);

module.exports = router;
