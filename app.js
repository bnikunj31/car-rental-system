const path = require('path');
const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(methodOverride('_method')); // Override method for forms (frontend)
app.use(express.urlencoded({ extended: true })); // Middleware for parsing URL-encoded bodies
app.use(express.json()); // Middleware for parsing JSON bodies
app.use(cookieParser()); // Cookies

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: true,  maxAge: 2 * 60 * 60 * 1000 }
}));

// View Engine
app.set('view engine', 'ejs');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/profile_pics', express.static(path.join(__dirname, 'uploads', 'profile_pics')));

// Routes
app.use('/', require('./routes/auth'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/reviews', require('./routes/review'));
app.use('/payment', require('./routes/paymentRoutes'));
app.use('/vehicles', require('./routes/vehicle'));
app.use('/reservations', require('./routes/reservation'));

// Additional route
app.get('/add-vehicle', (req, res) => {
  res.render('add-vehicle');
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`We Are Now Live`);
});
