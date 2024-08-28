// Packages
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Record = require('../controllers/adminController');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nikunj.banssal@gmail.com',
    pass: 'peng pqxi nzmx bbit' // Ensure to use environment variables for sensitive data
  }
});

// Helper Function to Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Controller for Registration
const tempUserStore = {};

const register = async (req, res) => {
  // Validation checks
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { errors: errors.array() });
  }

  const { name, email, phoneNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store user data temporarily
    tempUserStore[email] = { name, email, phoneNumber, password, otp, otpExpires };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Car Rental System',
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Error sending OTP' });
      }

      res.render('otp', { email, message: 'Please enter the OTP sent to your email.' });
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { enteredOtp, email } = req.body;

  try {
    const tempUser = tempUserStore[email];

    if (!tempUser) {
      return res.status(400).render('otp', { message: 'User not found.' });
    }

    const currentTime = Date.now();
    if (tempUser.otp !== enteredOtp) {
      return res.status(400).render('otp', { email, message: 'Invalid OTP. Please try again.' });
    } else if (tempUser.otpExpires < currentTime) {
      return res.status(400).render('otp', { email, message: 'OTP has expired. Please request a new one.' });
    }

    const newUser = new User({
      name: tempUser.name,
      email: tempUser.email,
      phoneNumber: tempUser.phoneNumber, // Store phone number
      password: tempUser.password,
      isVerified: true // Mark the user as verified
    });

    await newUser.save();
    await Record.logActivity(newUser._id, `${newUser.name} Registered to the Application`);

    delete tempUserStore[email];

    return res.redirect('/login');
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(400).render('otp', { email, message: 'Error verifying OTP. Please try again.' });
  }
};

// Controller for Login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).render('login', { errors: [{ msg: 'Invalid credentials' }] });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, { httpOnly: true });
    await Record.logActivity(user._id, `${user.name} Login to the Application`);
    res.redirect('/vehicles');
  } catch (error) {
    res.status(400).render('login', { errors: [{ msg: 'Error logging in user' }] });
  }
};

// Controller for Logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

// Controller for Resending OTP
const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Car Rental System',
      text: `Your new OTP code is ${otp}. It will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Error sending OTP.' });
      }

      res.json({ success: true, message: 'OTP resent successfully.' });
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ success: false, message: 'Error resending OTP.' });
  }
};

module.exports = {
  register: [
    // Validation rules for registration
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('phoneNumber', 'Please include a valid phone number').isMobilePhone(), // Validate phone number
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    register
  ],
  login: [
    // Validation rules for login
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
    login
  ],
  logout,
  verifyOtp,
  resendOtp
};
