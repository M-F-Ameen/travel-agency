const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');

const router = express.Router();

// Validation rules for booking
const bookingValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').trim().isMobilePhone().withMessage('Invalid phone number'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('adults').isInt({ min: 1, max: 20 }).withMessage('Adults must be between 1-20'),
  body('children').isInt({ min: 0, max: 20 }).withMessage('Children must be between 0-20'),
  body('travelDate').isISO8601().withMessage('Invalid date format'),
  body('confirmTrip').trim().notEmpty().withMessage('Trip confirmation is required'),
  body('message').optional().isLength({ max: 1000 }).withMessage('Message too long')
];

// POST /api/bookings - Create new booking
router.post('/bookings', bookingValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Validate travel date is not in past
    const travelDate = new Date(req.body.travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (travelDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Travel date cannot be in the past'
      });
    }

    const bookingData = {
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      adults: parseInt(req.body.adults),
      children: parseInt(req.body.children),
      travelDate: travelDate,
      confirmTrip: req.body.confirmTrip,
      tourId: req.body.tourId || '',
      message: req.body.message || '',
      status: 'pending'
    };

    const booking = new Booking(bookingData);
    await booking.save();

    console.log(`New booking created: ${booking.name} (${booking.email}) - ${booking.confirmTrip}`);

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully! We will contact you soon.',
      booking: {
        id: booking._id,
        name: booking.name,
        email: booking.email,
        createdAt: booking.createdAt
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.'
    });
  }
});

// GET /api/bookings - Get all bookings for admin
router.get('/bookings', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status; // optional filter
    const search = req.query.search; // optional search by name or email
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    let query = {};
    if (status) {
      query.status = status;
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive search
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetching bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings'
    });
  }
});

// GET /api/bookings/:id - Get single booking
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Fetching booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// PUT /api/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Booking status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Booking deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
  }
});

module.exports = router;
