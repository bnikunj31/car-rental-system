const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, match: [/.+@.+\..+/, 'Please enter a valid email'] },
  password: { type: String, required: [true, 'Password is required'] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profilePic: { type: String },
  phoneNumber: { type: String, required: [true, 'Phone Number is required'] },
  emailOtp: { type: String },
  emailOtpExpires: { type: Date },
  phoneOtp: { type: String },
  phoneOtpExpires: { type: Date },
  isVerified: { type: Boolean, default: false }  // Add a flag to check if the user is verified
});

// Hash password before saving to the database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to verify OTPs and mark the user as verified
userSchema.methods.verifyOtp = function (emailOtp, phoneOtp) {
  const currentTime = Date.now();
  if (
    this.emailOtp === emailOtp &&
    this.phoneOtp === phoneOtp &&
    this.emailOtpExpires > currentTime &&
    this.phoneOtpExpires > currentTime
  ) {
    this.isVerified = true;
    this.emailOtp = undefined;
    this.phoneOtp = undefined;
    this.emailOtpExpires = undefined;
    this.phoneOtpExpires = undefined;
    return true;
  }
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
