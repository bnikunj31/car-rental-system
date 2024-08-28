// routes/review.js
const express = require('express');
const { createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /reviews
router.post('/', createReview);

module.exports = router;
