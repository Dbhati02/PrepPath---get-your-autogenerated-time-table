const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const {
  createDailyPlan,
  getDailyPlans,
  getTodaysPlan,
  updateTaskStatus,
  deleteDailyPlan,
  generateAutoStudyPlan,
  deleteAllDailyPlans 
} = require('../controller/dailyPlan_controller');

//Auto-generate full study plan till exam
router.post('/autogenerate', authMiddleware, generateAutoStudyPlan);

//  Manually create a daily plan
router.post('/create', authMiddleware, createDailyPlan);
router.get('/create', (req, res) => {
  res.render('createTask', { message: null });
});

//  Get all daily plans for logged-in user
router.get('/getAllPlans', authMiddleware, getDailyPlans);

//  Get today’s daily plan
router.get('/todaysPlan', authMiddleware, getTodaysPlan);

//  Update status of a task in a plan
router.patch('/updateTheStatusPlan/:id', authMiddleware, updateTaskStatus);

// DELETE all plans for the logged-in user
router.post('/deleteAll', authMiddleware, deleteAllDailyPlans);

//  Delete a daily plan
router.delete('/deleteThePlan/:id', authMiddleware, deleteDailyPlan);

module.exports = router;