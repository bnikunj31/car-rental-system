const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    make: String,
    model: String,
    year: Number,
    pricePerDay: Number,
    capacity: { type: Number, required: [true, 'Capacity is required'], default: 2 },
    description: String,
    availability: Boolean,
    carImage: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
