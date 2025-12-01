const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Tour = require('../models/Tour');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/tours/'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename: tour-id-timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tour-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation rules for tour creation/update
const tourValidation = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isIn(['1 day', '2 days', '3 days', '1 week', '2 weeks']).withMessage('Invalid duration'),
  body('category').isIn(['adventure', 'cultural', 'luxury', 'family', 'romantic']).withMessage('Invalid category'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer')
];

// GET /api/tours - Get all tours (public)
router.get('/tours', async (req, res) => {
  try {
    console.log('GET /api/tours called');
    const tours = await Tour.getActiveTours();
    console.log('Active tours found:', tours.length);
    res.json({
      success: true,
      data: tours
    });
  } catch (error) {
    console.error('Fetching tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tours'
    });
  }
});

// GET /api/tours/:id - Get single tour (public)
router.get('/tours/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour || !tour.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      data: tour
    });
  } catch (error) {
    console.error('Fetching tour error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour'
    });
  }
});

// GET /api/admin/tours - Get all tours for admin (with inactive)
router.get('/admin/tours', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = {};
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const skip = (page - 1) * limit;

    const tours = await Tour
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Tour.countDocuments(filter);

    res.json({
      success: true,
      data: tours,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetching admin tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tours'
    });
  }
});

// POST /api/tours - Create new tour (admin only)
router.post('/tours', upload.single('image'), tourValidation, async (req, res) => {
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

    const tourData = {
      title: req.body.title,
      price: parseFloat(req.body.price),
      duration: req.body.duration,
      category: req.body.category,
      description: req.body.description,
      imageUrl: req.file ? '/images/tours/' + req.file.filename : '/images/_blank.png',
      displayOrder: parseInt(req.body.displayOrder) || 0,
      isActive: req.body.isActive !== 'false' // Default to true unless explicitly false
    };

    const tour = new Tour(tourData);
    await tour.save();

    console.log(`New tour created: ${tour.title}`);

    res.status(201).json({
      success: true,
      message: 'Tour created successfully!',
      data: tour
    });

  } catch (error) {
    console.error('Tour creation error:', error);

    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tour title already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create tour. Please try again.'
    });
  }
});

// PUT /api/tours/:id - Update tour (admin only)
router.put('/tours/:id', upload.single('image'), tourValidation, async (req, res) => {
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

    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Update tour data
    tour.title = req.body.title;
    tour.price = parseFloat(req.body.price);
    tour.duration = req.body.duration;
    tour.category = req.body.category;
    tour.description = req.body.description;
    tour.displayOrder = parseInt(req.body.displayOrder) || 0;
    tour.isActive = req.body.isActive !== 'false';

    // Update image if new file was uploaded
    if (req.file) {
      tour.imageUrl = '/images/tours/' + req.file.filename;
      // TODO: Delete old image file
    }

    await tour.save();

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: tour
    });

  } catch (error) {
    console.error('Tour update error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tour title already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update tour'
    });
  }
});

// PUT /api/tours/:id/status - Toggle tour active status (admin only)
router.put('/tours/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: `Tour ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      data: tour
    });

  } catch (error) {
    console.error('Tour status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tour status'
    });
  }
});

// DELETE /api/tours/:id - Delete tour (admin only)
router.delete('/tours/:id', async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // TODO: Delete associated image file

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });

  } catch (error) {
    console.error('Tour deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tour'
    });
  }
});

module.exports = router;
