const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theaterName: { type: String, required: true },
  distance: { type: String, required: true },
  time: { type: String, required: true },
  format: { type: String, required: true },
  price: { type: Number, required: true },
  bookedSeats: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);