const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Record = require('../controllers/adminController');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const twilio = require('twilio');
const otpGenerator = require('otp-generator');
require('dotenv').config();

// Captcha Generator
const generateCaptcha = () => {
  return otpGenerator.generate(6, { upperCase: false, specialChars: false });
};

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
if (!accountSid || !authToken || !verifyServiceSid) {
  console.log('Twilio credentials or Verify Service SID is missing');
}

const client = twilio(accountSid, authToken);

// Helper Function to Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use environment variables
  }
});

function sendOtp(phoneNumber, otp) {
  client.messages.create({
    body: `Your OTP code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER, // Use your Twilio phone number here
    to: phoneNumber
  })
  .then(message => console.log(`OTP sent successfully! Message SID: ${message.sid}`))
  .catch(error => console.error('Error sending OTP:', error));
}

// Temporary user store (consider using a more persistent solution)
const tempUserStore = {};

// Controller for Registration
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

    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    // Store OTPs in session
    req.session.emailOtp = emailOtp;
    req.session.phoneOtp = phoneOtp;
    req.session.emailOtpExpires = otpExpires;
    req.session.phoneOtpExpires = otpExpires;

    // Store registration data in cookies
    res.cookie('name', name, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.cookie('email', email, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.cookie('phoneNumber', phoneNumber, { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.cookie('password', password, { httpOnly: true, secure: true, sameSite: 'Strict' });

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Car Rental System Verification',
      text: `Your email OTP code is ${emailOtp}. It will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Error sending OTP via email' });
        }
      }
    });

    // Send OTP via SMS using Twilio
    sendOtp(`+91${phoneNumber}`, phoneOtp);

    // Render OTP verification page
    res.render('otp', { email, phoneNumber, message: 'Please enter the OTPs sent to your email and phone.' });

  } catch (error) {
    if (!res.headersSent) {
      res.status(400).json({ error: error.message });
    }
  }
};

// Controller for OTP Verification
const verifyOtp = async (req, res) => {
  const { email, emailOtp, phoneOtp } = req.body;
  
  try {
    console.log('Session Data:', req.session);
    // Get registration data from cookies
    const name = req.cookies.name;
    const phoneNumber = req.cookies.phoneNumber;
    const password = req.cookies.password;

    // Check if OTPs match and are valid
    const currentTime = Date.now();
    if (
      req.session.emailOtp !== emailOtp ||
      req.session.phoneOtp !== phoneOtp ||
      req.session.emailOtpExpires < currentTime ||
      req.session.phoneOtpExpires < currentTime
    ) {
      return res.status(400).render('otp', { email, message: 'Invalid OTPs. Please try again.' });
    }

    // Create and save the new user
    const newUser = new User({
      name,
      email,
      phoneNumber,
      password,
      isVerified: true // Mark the user as verified
    });

    await newUser.save();

    // Clear session data and cookies after successful registration
    req.session.emailOtp = null;
    req.session.phoneOtp = null;

    res.clearCookie('name');
    res.clearCookie('email');
    res.clearCookie('phoneNumber');
    res.clearCookie('password');

    // Redirect to login page
    res.redirect('/login');
  } catch (error) {
    res.status(400).render('otp', { email, message: 'Error verifying OTP. Please try again.' });
  }
};



const showLoginPage = (req, res) => {
  const captcha = generateCaptcha(); // Generate new CAPTCHA
  res.cookie('captcha', captcha, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'Strict',
    maxAge: 2 * 60 * 60 * 1000 // Set cookie expiry to 2 hours
  });
  res.render('login', { captcha }); // Pass CAPTCHA to the view if needed
};


const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('login', { 
      errors: errors.array(), 
      captcha: req.cookies.captcha // Retrieve CAPTCHA from cookies
    });
  }

  const { email, password, captchaInput } = req.body;

  try {
    // Verify CAPTCHA
    if (captchaInput !== req.cookies.captcha) {
      // CAPTCHA is incorrect, regenerate and set a new CAPTCHA cookie
      const newCaptcha = generateCaptcha();
      res.cookie('captcha', newCaptcha, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict',
        maxAge: 2 * 60 * 60 * 1000 // Set cookie expiry to 2 hours
      });
      return res.status(400).render('login', {
        errors: [{ msg: 'Invalid CAPTCHA' }],
        captcha: newCaptcha // Pass the new CAPTCHA to the frontend
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      // Regenerate CAPTCHA if credentials are invalid
      const newCaptcha = generateCaptcha();
      res.cookie('captcha', newCaptcha, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict',
        maxAge: 2 * 60 * 60 * 1000 // Set cookie expiry to 2 hours
      });
      return res.status(400).render('login', {
        errors: [{ msg: 'Invalid credentials' }],
        captcha: newCaptcha // Pass the new CAPTCHA to the frontend
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10y' });

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'Strict' 
    });
    await Record.logActivity(user._id, `${user.name} Login to the Application`);
    res.redirect(`/vehicles?token=${token}`);
  } catch (error) {
    // Regenerate CAPTCHA if an error occurs
    const newCaptcha = generateCaptcha();
    res.cookie('captcha', newCaptcha, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'Strict',
      maxAge: 2 * 60 * 60 * 1000 // Set cookie expiry to 2 hours
    });
    res.status(400).render('login', {
      errors: [{ msg: 'Error logging in user' }],
      captcha: newCaptcha // Pass the new CAPTCHA to the frontend
    });
  }
};


// Controller for Logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

// Controller for Resending OTP
const resendOtp = async (req, res) => {
  const { email, phoneNumber } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Update OTPs in session
    req.session.emailOtp = emailOtp;
    req.session.phoneOtp = phoneOtp;
    req.session.emailOtpExpires = otpExpires;
    req.session.phoneOtpExpires = otpExpires;

    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code for Car Rental System',
      text: `Your new OTP codes are Email: ${emailOtp} and Phone: ${phoneOtp}. They will expire in 10 minutes.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Error sending OTP.' });
      }

      // Send OTP via SMS using Twilio
      
      client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications
        .create({ to: `+91${phoneNumber}`, channel: 'sms' })
        .then(verification => {
          res.json({ success: true, message: 'OTP resent successfully.' });
        })
        .catch(err => {
          // console.error('Error sending SMS:', err.message);
          res.status(500).json({ success: false, message: 'Error sending OTP via SMS.' });
        });
    });
  } catch (error) {
    // console.error('Error resending OTP:', error);
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
  showLoginPage,
  verifyOtp,
  resendOtp
};
