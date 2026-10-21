const express = require('express');
const router = express.Router();
const Showtime = require('../models/Showtime');

// Get showtimes by movie ID
router.get('/:movieId', async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movieId: req.params.movieId });
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book seats for a showtime
router.post('/book', async (req, res) => {
  try {
    const { showtimeId, selectedSeats } = req.body;
    
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ error: 'Showtime not found' });
    }

    // Check if seats are already booked
    const alreadyBooked = selectedSeats.some(seat => showtime.bookedSeats.includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({ error: 'One or more selected seats are already booked.' });
    }

    // Add seats to booked array
    showtime.bookedSeats.push(...selectedSeats);
    await showtime.save();

    res.json({ message: 'Seats booked successfully!', showtime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;