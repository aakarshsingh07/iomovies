const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');

// Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single movie by ID along with its showtimes
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    // Fetch related showtimes
    const showtimes = await Showtime.find({ movieId: movie._id });
    
    res.json({ movie, showtimes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;