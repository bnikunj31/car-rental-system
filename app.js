// Packages
const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

// Routes Imported
const reservationRoutes = require('./routes/reservation');
const adminRoutes = require('./routes/adminRoutes');
const vehicleRoutes = require('./routes/vehicle');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/Review');
const authRoutes = require('./routes/auth');
const connectDB = require('./config/db');

// DB Connecting
dotenv.config();
connectDB();

const app = express();
app.use(methodOverride('_method')); // Override method for forms (frontend)
app.use(express.urlencoded({ extended: true })); // Middleware for parsing URL-encoded bodies
app.use(express.json()); // Middleware for parsing JSON bodies

// View Engine for Frontend
app.set('view engine', 'ejs');
app.use(cookieParser());  // Cookies

// Multer related code
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/profile_pics', express.static(path.join(__dirname, 'uploads','profile_pics')));

// Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/reviews', reviewRoutes);
app.use('/payment', paymentRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/reservations', reservationRoutes);


app.get('/add-vehicle', (req, res) => {
  res.render('add-vehicle');
});

// Starting Server on PORT 3000
app.listen(10000, () => {
  console.log('Server running on http://localhost:10000');
});