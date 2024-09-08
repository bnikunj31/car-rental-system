// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).redirect('/login');
  }
};

module.exports = protect;
module.exports.admin = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
      return res.redirect('/admin/login');
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (!decoded.isAdmin) {
          return res.redirect('/admin/login');
      }
      next();
  } catch (err) {
      return res.redirect('/admin/login');
  }
};