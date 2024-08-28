const express = require('express');
const methodOverride = require('method-override');
const { getVehicles, addVehicle, updateVehicle, deleteVehicle, getVehicleById } = require('../controllers/vehicleController');
const protect = require('../middleware/auth');
const upload = require('../middleware/multer');
const router = express.Router();

// Middleware
router.use(methodOverride('_method'));
router.use(express.urlencoded({ extended: true }));

// Public routes
router.get('/', getVehicles);

// Route to get a specific vehicle by ID for editing
router.get('/edit-vehicle/:id', protect, getVehicleById);

// Route to update a specific vehicle by ID (PATCH request)
router.patch('/edit-vehicle/:id', protect, upload.single('carImage'), updateVehicle);

// Admin routes
router.post('/', protect, upload.single('carImage'), addVehicle);
router.delete('/:id', protect, deleteVehicle);

module.exports = router;
