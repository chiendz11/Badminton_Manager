const mongoose = require('mongoose');

const CenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10,15}$/, 'Please enter a valid phone number']
  },
  openingHours: {
    start: {
      type: String,
      required: true,
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Please enter a valid start time in HH:mm format']
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, 'Please enter a valid end time in HH:mm format']
    }
  },
  avatar: {
    type: String,
    default: ''
  },
  totalCourts: {
    type: Number,
    required: true,
    min: 1
  },
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  location: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Center', CenterSchema);
