const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  syllabus: [{
    type: String, // e.g. ["Algebra", "Trigonometry", ...]
    required: true,
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Subject', SubjectSchema);