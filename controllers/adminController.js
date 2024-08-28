// Models
const User = require('../models/User');
const Review = require('../models/review');
const Vehicle = require('../models/Vehicle');
const Activity = require('../models/Activity');    
const Reservation = require('../models/Reservation');

// Packages
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Controllers

// Render Login Page
exports.getLoginPage = (req, res) => {
    res.render('admin/login', { errorMessage: null });
};

// Login authntication
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user || user.role !== 'admin') {
            return res.render('admin/login', { errorMessage: 'Invalid email or password' });
        }

        // Check if the password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.render('admin/login', { errorMessage: 'Invalid email or password' });
        }

        // Create a token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Store token in cookie
        res.cookie('adminToken', token, { httpOnly: true });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// Middleware to protect admin routes
exports.protectAdmin = (req, res, next) => {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.redirect('/admin/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        if (req.user.role !== 'admin') {
            return res.redirect('/admin/login');
        }

        next();
    } catch (error) {
        return res.redirect('/admin/login');
    }
};

// Controller to get dashboard
exports.getDashboard = async (req, res) => {
    try {
        // Fetch total users
        const totalUsers = await User.countDocuments();

        // Fetch total vehicles
        const totalVehicles = await Vehicle.countDocuments();

        // Fetch total reservations
        const totalReservations = await Reservation.countDocuments();

        // Fetch total reviews
        const totalReviews = await Review.countDocuments();
        
        // Fetch recent activities
        const recentActivities = await Activity.find().sort({ createdAt: -1 });

        // Render the dashboard view with totalUsers and recentActivities
        res.render('admin/dashboard', { totalUsers, totalVehicles, totalReservations, totalReviews, recentActivities });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Contorller to fetch user's every activities
exports.logActivity = async (userId, description) => {
    try {
        
        const activity = new Activity({
            description: `User ${userId} ${description}`,
        });
        await activity.save();
    } catch (err) {
        console.error('Error logging activity:', err);
    }
}

// Controller to fetch and display all the users
exports.getUsers = async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find().lean();

        // Render the EJS file with the users data
        res.render('admin/users', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Server error');
    }
};

// Controller to render edit page any users
exports.editusers = async (req,res) =>{
    try {
        // Fetch the user by ID from the request parameters
        const user = await User.findById(req.params.id).lean();
        
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Render the edit-user EJS template with the user data
        res.render('admin/edit-user', { user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Server error');
    }
}

// Controller to edit any user details
exports.updateUser = async (req, res) => {
    try {
        // Extract user data from the request body
        const { name, email, phoneNumber, role } = req.body;
        const userId = req.params.id;

        // Validate user data
        if (!name || !email || !phoneNumber || !role) {
            return res.status(400).send('All fields are required');
        }

        // Update user in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email, phoneNumber, role },
            { new: true, runValidators: true } // Options to return the updated document and validate data
        );

        // Check if the user was found and updated
        if (!updatedUser) {
            return res.status(404).send('User not found');
        }

        // Redirect to the user management page
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Server error');
    }
};

// Controller to delete any user
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find and delete the user by ID
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Delete all vehicles owned by the user
        await Vehicle.deleteMany({ owner: userId });

        // Delete all reservations made by the user
        await Reservation.deleteMany({ user: userId });

        // Delete all reviews made by the user
        await Review.deleteMany({ user: userId });

        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/users');
    }
};

// Controller to get vehicles and render page
exports.getVehicles = async (req, res) => {
    try {
        // Fetch all users from the database
        const vehicles = await Vehicle.find().lean();

        // Render the EJS file with the users data
        res.render('admin/vehicles', { vehicles });
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).send('Server error');
    }
};

// Controller to render edit vehicle page
exports.editVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const vehicle = await Vehicle.findById(vehicleId).lean();
        if (!vehicle) {
            req.flash('error_msg', 'Vehicle not found');
            return res.redirect('/admin/vehicles');
        }
        res.render('admin/edit-vehicle', { vehicle });
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        req.flash('error_msg', 'Error fetching vehicle');
        res.redirect('/admin/vehicles');
    }
};

// Controller to update the vehicles details
exports.updateVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const { make, model, year, pricePerDay, description, availability } = req.body;

        await Vehicle.findByIdAndUpdate(vehicleId, {
            make,
            model,
            year,
            pricePerDay,
            description,
            availability
        });


        res.redirect('/admin/vehicles');
    } catch (error) {
        res.redirect(`/admin/edit-vehicle/${req.params.id}`);
    }
};

// Controller to delete the vehicle
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.id;

        // Find and delete the vehicle by ID
        await Vehicle.findByIdAndDelete(vehicleId);

        res.redirect('/admin/vehicles');
    } catch (error) {
        res.redirect('/admin/vehicles');
    }
};


// Controller to get all reservations
exports.getAllReservations = async (req, res) => {
    try {
        const vehicles = await Vehicle.find().lean();
        const reservations = await Reservation.find()
        .populate('vehicle') // Make sure this matches the registered model name
        .populate('user')
        res.render('admin/reservations', { reservations });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Controller to edit reservations
exports.getEditReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate('Vehicle').populate('user');
        res.render('admin/editReservation', { reservation });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Controller to update the reservations
exports.updateReservation = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.body;
        const reservation = await Reservation.findById(req.params.id).populate('Vehicle');

        // Calculate the number of days between the start and end date
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        // Calculate the total cost based on the per-day cost of the vehicle
        const totalCost = days * reservation.vehicle.pricePerDay;

        // Update the reservation with the new details and total cost
        await Reservation.findByIdAndUpdate(req.params.id, { startDate, endDate, status, totalCost });

        res.redirect('/admin/reservations');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};


// Delete reservation
exports.deleteReservation = async (req, res) => {
    try {
        // Find the reservation by ID
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).send('Reservation not found');
        }

        // Delete the reservation
        await Reservation.findByIdAndDelete(req.params.id);

        // Set the vehicle's availability to true
        await Vehicle.findByIdAndUpdate(reservation.vehicle, { availability: true });

        // Redirect to the reservations page
        res.redirect('/admin/reservations');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};



exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('vehicle', 'make model year'); // Change 'Vehicle' to 'vehicle'
        res.render('admin/reviews', { reviews });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).send('Review not found');
        }

        const vehicle = await Vehicle.findById(review.vehicle);

        if (!vehicle) {
            return res.status(404).send('Vehicle not found');
        }

        await Review.findByIdAndDelete(req.params.id);

        const reviews = await Review.find({ vehicle: vehicle._id });
        const avgRating = reviews.length
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0;

        vehicle.avgRating = avgRating;
        await vehicle.save();

        res.redirect('/admin/reviews');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};