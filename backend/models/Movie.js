const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String, required: true },
  rating: { type: Number, required: true },
  duration: { type: String, required: true },
  releaseDate: { type: String, required: true },
  synopsis: { type: String, required: true },
  banner: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);