const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:50000', 'http://127.0.0.1:5501'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Travel Agency Booking API Server is Running!',
    status: 'Active',
    timestamp: new Date().toISOString(),
    docs: {
      health: 'GET /health - Server health check',
      bookings: 'GET /api/bookings - Get all bookings',
      submitBooking: 'POST /api/bookings - Submit new booking'
    },
    frontend: {
      mainSite: 'Open index.html directly in browser',
      adminDashboard: 'Open admin.html directly in browser',
      tourDetails: 'Automatically opened from main site'
    },
    testing: {
      instruction: '1. Open index.html in browser 2. Book a tour 3. View in admin.html',
      apiExample: 'curl -X POST http://localhost:3001/api/bookings -H "Content-Type: application/json" -d \'{"name":"Test","phone":"+123","email":"test@test.com","adults":1,"travelDate":"2025-12-15T00:00:00.000Z","confirmTrip":"paris","message":"Hello"}\''
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Routes
const bookingRoutes = require('./routes/bookings');
const tourRoutes = require('./routes/tours');
app.use('/api', bookingRoutes);
app.use('/api', tourRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    // Default to local MongoDB if no MONGO_URI provided
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel-agency';

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log(`🌐 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('📪 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

startServer();
