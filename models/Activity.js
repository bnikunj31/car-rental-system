
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    // Add other fields as necessary
});

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = Activity;
