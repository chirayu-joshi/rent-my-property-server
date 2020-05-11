const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  uploaderId: { type: String, required: true },
  propertyName: { type: String, required: true },
  propertyDescription: String,
  propertyArea: { type: Number, required: true },
  propertyType: { type: String, required: true },
  guestCapacity: { type: Number, min: 1, required: true },
  rooms: { type: Number, min: 1, required: true },
  beds: { type: Number, min: 1, required: true },
  amenities: [String],
  facilities: [String],
  imageIds: [String],
  location: { lat: Number, lon: Number },
  address: {
    number: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true }
  },
  price: { type: Number, required: true },
  schedule: {
    checkIn: { type: Date, default: Date.now() },
    checkOut: { type: Date, required: true }
  },
  rules: [String],
  language: [String],
  reviews: [
    {
      stars: { type: Number, min: 0, max: 5 },
      from: { type: String },
      review: { type: String }
    }
  ]
});

module.exports = mongoose.model('Posts', postSchema);
