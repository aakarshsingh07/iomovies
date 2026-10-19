const mongoose = require('mongoose');
const Movie = require('./models/Movie');
const Showtime = require('./models/Showtime');
require('dotenv').config();

const sampleMovies = [
  {
    title: 'Interstellar Odyssey',
    genre: 'Sci-Fi / Adventure',
    rating: 8.8,
    duration: '2h 49m',
    releaseDate: 'October 2026',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot leads a research team to find a new planet.',
    banner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1400'
  },
  {
    title: 'Cyber Heist 2077',
    genre: 'Action / Thriller',
    rating: 7.9,
    duration: '2h 15m',
    releaseDate: 'September 2026',
    synopsis: 'An elite crew of hackers assemble to pull off a dangerous heist against a corrupt mega-corporation in a neon metropolis.',
    banner: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=1400'
  }
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/imovies');
    
    await Movie.deleteMany({});
    await Showtime.deleteMany({});

    const createdMovies = await Movie.insertMany(sampleMovies);

    await Showtime.insertMany([
      {
        movieId: createdMovies[0]._id,
        theaterName: 'PVR Cinemas: Grand Venice Mall',
        distance: '2.4 km away',
        time: '10:30 AM',
        format: 'IMAX 3D',
        price: 15,
        bookedSeats: ['A3', 'A4']
      },
      {
        movieId: createdMovies[0]._id,
        theaterName: 'Cinepolis: MSX Mall',
        distance: '4.1 km away',
        time: '02:15 PM',
        format: 'Standard',
        price: 12,
        bookedSeats: ['B1']
      }
    ]);

    console.log('Database Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDB();   