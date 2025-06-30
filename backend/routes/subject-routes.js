const express = require('express');
const router = express.Router();
const {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject
} = require('../controller/subject_controller');
const authMiddleware = require('../middlewares/authMiddleware');
const Subject = require('../models/subject_model')

// Create new subject
router.get('/create', (req, res) => {
  res.render('createSubject', { message: null });
});
router.post('/create', authMiddleware, createSubject);


// Get all subjects
router.get('/getAll', authMiddleware, getSubjects);


router.get('/update/:id', authMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!subject) {
      // Show error page (not updateSubject)
      return res.status(404).send("Subject not found");
    }

    res.render('updateSubject', { subject, message: null });

  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});


// Update subject by ID
router.post('/update/:id', authMiddleware, updateSubject);



// Delete subject by ID
router.get('/delete/:id', authMiddleware, deleteSubject);

module.exports = router;
