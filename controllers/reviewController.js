const mongoose = require('mongoose');
const Review = require('../models/review'); // Ensure the path is correct
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Record = require('./adminController');

// Create a review
exports.createReview = async (req, res) => {
    try {
        // const { vehicleId, reservationId, userId, rating, comment } = req.body;

        // Validate required fields
        if (!req.body.review) {
            return res.redirect('/reservations?error=Comment is required');
        }

        if (!mongoose.Types.ObjectId.isValid(req.body.vehicleId) ||
            !mongoose.Types.ObjectId.isValid(req.body.reservationId) ||
            !mongoose.Types.ObjectId.isValid(req.body.userId)) {
            return res.redirect('/reservations?error=Invalid data provided');
        }

        // Create new review
        const review = new Review({
            vehicle: req.body.vehicleId,
            reservation: req.body.reservationId,
            user: req.body.userId,
            rating: req.body.rating,
            comment: req.body.review,
        });

        // Fetch user and vehicle information
        const user = await User.findById(req.body.userId).select('name');
        const vehicle = await Vehicle.findById(req.body.vehicleId).select('make model');

        // Log the review activity
        await Record.logActivity(
            req.body.userId,
            `${user.name} rated ${vehicle.make} ${vehicle.model} with a rating of ${req.body.rating}`
        );

        // Save the review
        await review.save();

        // Redirect to reservations page with success message
        res.redirect('/reservations?success=Review submitted successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/reservations?error=Error submitting review');
    }
};
