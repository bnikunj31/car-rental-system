// controllers/vehicleController.js
const Vehicles = require("../models/Vehicle");
const Review = require("../models/review");
const Record = require('../controllers/adminController');
const Reservations = require('../models/Reservation');


const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicles.find().lean();
    for (let vehicle of vehicles) {
      const reviews = await Review.find({ vehicle: vehicle._id });
      vehicle.avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0;
    }
    res.render("vehicles", { vehicles });
  } catch (error) {
    res.status(400).json({ error: "Error fetching vehicles" });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicles.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.render('edit-vehicle', { vehicle }); // Render the EJS view with the vehicle data
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Admin adds a vehicle
const addVehicle = async (req, res) => {
  const { make, model, year, pricePerDay, capacity, description } = req.body;
  const owner = req.user ? req.user._id : null;
  const carImage = req.file ? req.file.filename : null;
  const username = req.user.name;
  
  await Record.logActivity(req.user._id, `${username} Added a new car`);
  try {
    const vehicle = new Vehicles({
      carImage,
      make,
      model,
      year,
      pricePerDay,
      capacity,
      description,
      availability: true,
      owner,
    });

    await vehicle.save();
    res.redirect("/vehicles");
  } catch (error) {
    res.status(400).json({ error: "Error adding vehicle" });
  }
};

// Admin updates a vehicle
const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { make, model, year, pricePerDay } = req.body;
  
  // Ensure availability is set correctly
  const availability = Array.isArray(req.body.availability)
    ? req.body.availability.includes("true")
    : req.body.availability === "true" || req.body.availability === true;

    
  const carImage = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updatedData = {
      make,
      model,
      year,
      pricePerDay,
      availability, // Use the correct availability value
    };

    if (carImage) {
      updatedData.carImage = carImage;
    }

    const vehicle = await Vehicles.findByIdAndUpdate(id, updatedData, { new: true });

    const username = req.user.name;
    const vehiclename = `${make} ${model}`;
    await Record.logActivity(req.user._id, `${username} Updated ${vehiclename}`);
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.redirect("/profile");
  } catch (error) {
        res.status(400).json({ error: "Error updating vehicle" });
  }
};


// Admin deletes a vehicle
const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const username = req.user.name;

    // Find the vehicle by ID and select the make and model fields
    const vehicle = await Vehicles.findById(id).select('make model');

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const companyname = vehicle.make;
    const model = vehicle.model;
    const vehiclename = `${companyname} ${model}`;

    // Log the activity before deleting the vehicle
    await Record.logActivity(req.user._id, `${username} deleted ${vehiclename}`);

    // Delete associated reservations and reviews
    await Reservations.deleteMany({ vehicle: id });
    await Review.deleteMany({ vehicle: id });

    // Delete the vehicle
    await Vehicles.findByIdAndDelete(id);

    res.redirect("/vehicles");
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Error deleting vehicle" });
  }
};


module.exports = {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
};
