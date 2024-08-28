const Reservation = require('../models/Reservation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

const getProfile = async (req, res) => {
  try {
    // Fetch the logged-in user's details
    const user = await User.findById(req.user.id);

    // Fetch vehicles added by the user
    const vehicles = await Vehicle.find({ owner: req.user.id });

    // Fetch all reservations for the user's vehicles and populate the user who made the reservation
    const vehicleIds = vehicles.map(vehicle => vehicle._id);
    const reservations = await Reservation.find({ vehicle: { $in: vehicleIds } })
      .populate('vehicle')
      .populate('user', 'name email phoneNumber'); // Populate with user's name, email, and phone number
    // Count the number of vehicles
    const vehicleCount = vehicles.length;

    // Render the profile page with fetched data, including phone number
    res.render('profile', {
      user,
      vehicleCount,
      vehicles,
      reservations,
      // phoneNumber: reservations[0].user.phoneNumber
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};




const editProfile = (req, res) => {
  try {
      res.render('edit-profile', { 
        user: req.user,
        phoneNumber: req.user.phoneNumber // Pass phone number to the edit-profile template
      });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
};


const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber; // Update phone number

    if (req.file) {
      // Remove old profile picture if it exists
      if (user.profilePic) {
        const oldPicPath = path.join(__dirname, '..', 'uploads', 'profile_pics', user.profilePic);
        if (fs.existsSync(oldPicPath)) {
          fs.unlinkSync(oldPicPath);
        }
      }
      
      // Update with new profile picture
      user.profilePic = req.file.filename;
    }

    await user.save();
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

  

module.exports = {
    getProfile,
    editProfile,
    updateProfile
};
