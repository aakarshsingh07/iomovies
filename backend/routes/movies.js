const router = require('express').Router();
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

// Get movie details and its showtimes
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    const showtimes = await Showtime.find({ movieId: movie._id });
    res.json({ movie, showtimes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific showtime details (for seat mapping)
router.get('/showtime/:showtimeId', async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.showtimeId).populate('movieId');
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;