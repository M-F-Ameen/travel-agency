require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedDB = async () => {
  try {
    await connectDB();

    // Create a dummy booking to initialize the database
    const dummyBooking = new Booking({
      name: 'Test User',
      phone: '+1234567890',
      email: 'test@example.com',
      adults: 1,
      children: 0,
      travelDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      confirmTrip: 'test trip',
      tourId: '',
      message: 'Dummy booking to create database',
      status: 'confirmed' // to make it active
    });

    await dummyBooking.save();
    console.log('Dummy booking saved, database and collections created');

    // Optionally delete the dummy
    await Booking.findByIdAndDelete(dummyBooking._id);
    console.log('Dummy booking removed');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
