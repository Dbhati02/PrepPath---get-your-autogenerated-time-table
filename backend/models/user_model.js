const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  // overall progress across all subjects (0–100)
  overallPercentage: {
    type: Number,
    default: 0,
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  dailyPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyPlan',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);