const express = require('express');
const router = express.Router();
const User = require('../models/User');
const vonage = require('../config/nexmo');
const crypto = require('crypto'); // For generating OTPs

// Middleware for validation
const validateUserData = (req, res, next) => {
  const { name, email, password, phoneNumber } = req.body;

  if (!name || !email || !password || !phoneNumber) {
    return res.status(400).json({ message: 'Name, email, password, and phone number are required' });
  }

  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }

  next();
};

router.post('/register', validateUserData, async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    const phoneOtp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
    const phoneOtpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      phoneOtp,
      phoneOtpExpires
    });

    await user.save();

    // Send phone OTP using Nexmo
    const from = "Vonage";
    const to = `91${phoneNumber}`; // Assuming you are in India; change the country code accordingly
    const text = `Your phone OTP code is ${phoneOtp}. It expires in 10 minutes.`;

    vonage.sms.send({ to, from, text })
      .then(resp => console.log('Message sent successfully'))
      .catch(err => console.log('There was an error sending the message:', err.message));

    res.status(201).json({ message: 'User registered successfully. OTP sent to your phone.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
