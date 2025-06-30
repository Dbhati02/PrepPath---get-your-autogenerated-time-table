const express = require('express');
const router = express.Router();
const User = require('../models/user_model')
const {
  register,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
} = require('../controller/user_controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.get('/register', (req, res) => {
  res.render('register', { message: null });
});
router.post('/register', register);

router.get('/login', (req, res) => {
  res.render('login', { message: null });
});
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (require login)
router.get('/profile', authMiddleware, getUserProfile);

router.get('/updateProfile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const message = req.query.message || null; // Capture ?message=... from query

    res.render('updateProfile', { user, message }); // Pass user and message
  } catch (err) {
    res.status(500).send('Server Error');
  }
});
router.post('/updateProfile', authMiddleware, updateUserProfile);


module.exports = router;
