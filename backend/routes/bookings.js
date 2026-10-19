const router = require('express').Router();
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');

// Create a booking and lock seats
router.post('/', async (req, res) => {
  try {
    const { userId, showtimeId, seats, totalAmount } = req.body;

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    // Check if any requested seat is already booked
    const alreadyBooked = seats.some(seat => showtime.bookedSeats.includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({ error: 'One or more selected seats are already booked.' });
    }

    // Add seats to booked array
    showtime.bookedSeats.push(...seats);
    await showtime.save();

    const newBooking = new Booking({ userId, showtimeId, seats, totalAmount });
    await newBooking.save();

    res.status(201).json({ message: 'Booking confirmed successfully', booking: newBooking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;