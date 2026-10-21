require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. Connect to MongoDB Atlas & Seed Data if empty
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected Successfully");
    await seedDatabase();
  })
  .catch(err => console.error("MongoDB Connection Error:", err));

// 2. Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const movieSchema = new mongoose.Schema({
  title: String,
  poster: String,
  genre: String,
  duration: String
});
const Movie = mongoose.model('Movie', movieSchema);

const showtimeSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  time: String,
  price: Number,
  bookedSeats: { type: [String], default: [] }
});
const Showtime = mongoose.model('Showtime', showtimeSchema);

const bookingSchema = new mongoose.Schema({
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seats: [String],
  createdAt: { type: Date, default: Date.now }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Seed initial movie data if collection is empty
async function seedDatabase() {
  const count = await Movie.countDocuments();
  if (count === 0) {
    const movie = await Movie.create({
      title: "Interstellar",
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      genre: "Sci-Fi / Adventure",
      duration: "2h 49m"
    });
    await Showtime.create({
      movieId: movie._id,
      time: "07:00 PM",
      price: 150,
      bookedSeats: []
    });
    console.log("Sample movie and showtime seeded!");
  }
}

// 3. Auth Routes (Register & Login)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ success: true, message: "Registration successful! Please login." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Movie & Booking API Routes

// Get all movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

// Add a new movie and initial showtime
app.post('/api/movies', async (req, res) => {
  try {
    const { title, poster, genre, duration, time, price } = req.body;
    if (!title || !poster || !genre || !duration || !time || !price) {
      return res.status(400).json({ success: false, message: "Please fill in all movie and showtime details." });
    }

    const newMovie = await Movie.create({ title, poster, genre, duration });
    await Showtime.create({
      movieId: newMovie._id,
      time,
      price: Number(price),
      bookedSeats: []
    });

    res.status(201).json({ success: true, message: "Movie added successfully!", movie: newMovie });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get showtimes for a specific movie
app.get('/api/shows/:movieId', async (req, res) => {
  const shows = await Showtime.find({ movieId: req.params.movieId });
  res.json(shows);
});

// Get details for a single showtime
app.get('/api/show/:showId', async (req, res) => {
  const show = await Showtime.findById(req.params.showId);
  res.json(show);
});

// CRITICAL: Atomic booking endpoint to prevent race conditions & double-booking
app.post('/api/book', async (req, res) => {
  const { showtimeId, selectedSeats, userId } = req.body;

  try {
    const updatedShow = await Showtime.findOneAndUpdate(
      { 
        _id: showtimeId, 
        bookedSeats: { $not: { $elemMatch: {$in: selectedSeats } } } 
      },
      { $push: { bookedSeats: {$each: selectedSeats } } },
      { new: true }
    );

    if (!updatedShow) {
      return res.status(400).json({ success: false, message: "Oops! One or more selected seats were just booked by someone else." });
    }

    await Booking.create({ showtimeId, userId, seats: selectedSeats });

    // Broadcast real-time seat update to all clients in this show room
    io.to(showtimeId).emit('seats-updated', { bookedSeats: updatedShow.bookedSeats });

    res.status(200).json({ success: true, bookedSeats: updatedShow.bookedSeats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper route to reset seat statuses
app.get('/api/reset-seats', async (req, res) => {
  await Showtime.updateMany({}, { bookedSeats: [] });
  await Booking.deleteMany({});
  res.json({ success: true, message: "All seats reset to vacant!" });
});

// 5. Socket.io Real-Time Connection
io.on('connection', (socket) => {
  socket.on('join-showroom', (showtimeId) => {
    socket.join(showtimeId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));