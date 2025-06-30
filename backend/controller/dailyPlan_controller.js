const DailyPlan = require('../models/dailyPlan_model');
const User = require('../models/user_model');

//helper to update user's overall % completed
const updateUserOverallProgress = async (userId) =>{
    const allPlans = await DailyPlan.find({user:userId});

    let totalTasks = 0;
    let completedTasks = 0;

    for(const plan of allPlans){
        for(const task of plan.tasks){
            totalTasks++;
            if(task.completed) completedTasks++;
        }
    }

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await User.findByIdAndUpdate(userId, {
        overallPercentage: percentage,
    });
};


exports.generateAutoStudyPlan = async function generateAutoStudyPlan(req, res) {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subjects');

    if (!user || !user.examDate) {
      return res.render('fullPlans', {
        groupedPlans: {},
        message: ' Please add an exam date first.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(user.examDate);
    examDate.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) {
      return res.render('fullPlans', {
        groupedPlans: {},
        message: ' Exam date must be in the future.'
      });
    }

    // Collect all subject-topic pairs
    const allTopics = [];
    for (const subject of user.subjects) {
      for (const topic of subject.syllabus) {
        allTopics.push({ subject: subject.name, topic });
      }
    }

    const totalTasks = allTopics.length;
    if (totalTasks === 0) {
      return res.render('fullPlans', {
        groupedPlans: {},
        message: ' No syllabus found. Please add topics first.'
      });
    }

    // Round-robin distribute tasks across days
    const dayPlans = Array.from({ length: daysLeft }, () => []);
    let index = 0;

    while (index < daysLeft * Math.ceil(totalTasks / daysLeft)) {
      const task = allTopics[index % totalTasks];
      dayPlans[index % daysLeft].push({ ...task, completed: false });
      index++;
    }

    const dailyPlanIds = [];

    for (let i = 0; i < dayPlans.length; i++) {
      const planDate = new Date(today);
      planDate.setDate(today.getDate() + i);

      const plan = new DailyPlan({
        user: userId,
        date: planDate,
        tasks: dayPlans[i],
      });

      await plan.save();
      dailyPlanIds.push(plan._id);
    }

    user.dailyPlans = dailyPlanIds;
    user.overallPercentage = 0;
    await user.save();

    // Regenerate fresh groupedPlans
    const plans = await DailyPlan.find({ user: userId }).sort({ date: 1 });
    const groupedPlans = {};

    plans.forEach(plan => {
      const dateKey = new Date(plan.date).toDateString();
      if (!groupedPlans[dateKey]) groupedPlans[dateKey] = [];
      groupedPlans[dateKey].push(...plan.tasks);
    });

    res.render('fullPlans', {
      groupedPlans,
      message: 'Auto study plan created successfully!'
    });

  } catch (err) {
    console.error('AutoPlan Error:', err);
    res.render('fullPlans', {
      groupedPlans: {},
      message: 'Internal server error while generating plan.'
    });
  }
};


//  Create a daily plan manually
exports.createDailyPlan = async function createDailyPlan(req, res) {
  try {
    const { date, subject, tasks } = req.body;

    // Split the tasks string into an array of trimmed topics
    const taskArray = tasks.split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0)
      .map(topic => ({
        subject,
        topic,
        completed: false,
      }));

    const plan = new DailyPlan({
      user: req.user.id,
      date,
      tasks: taskArray,
    });

    await plan.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { dailyPlans: plan._id },
    });

    res.render('createTask', { message: ' Daily plan created successfully!' });

  } catch (err) {
    console.error(err);
    res.status(500).render('createTask', { message: ` Error: ${err.message}` });
  }
};


exports.getDailyPlans = async function getDailyPlans(req, res) {
  try {
    const plans = await DailyPlan.find({ user: req.user.id }).sort({ date: 1 });

    const groupedPlans = {};

    plans.forEach(plan => {
      const dateKey = new Date(plan.date).toDateString();
      if (!groupedPlans[dateKey]) {
        groupedPlans[dateKey] = [];
      }

      plan.tasks.forEach((task, index) => {
        // Add planId and taskIndex to each task
        groupedPlans[dateKey].push({
          ...task.toObject(),     // Ensure plain object, not Mongoose document
          planId: plan._id,
          taskIndex: index
        });
      });
    });

    res.render('fullPlans', {
      groupedPlans,
      message: undefined
    });
  } catch (err) {
    res.status(500).render('fullPlans', {
      groupedPlans: {},
      message: 'Error loading your study plans.'
    });
  }
};




// Get today’s plan and render EJS
exports.getTodaysPlan = async function getTodaysPlan(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await DailyPlan.findOne({
      user: req.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    //  Normal case: render today's plan (even if plan is null)
    res.render('todaysPlan', { plan });

  } catch (err) {
    console.error('Error fetching today’s plan:', err);

    //  Instead of error.ejs, just render the same page with null plan
    res.render('todaysPlan', {
      plan: null,
      error: 'Something went wrong while fetching today’s plan.',
    });
  }
};



// Update status of a task (completed/uncompleted)
exports.updateTaskStatus = async function updateTaskStatus(req, res) {
  try {
    const { taskIndex, completed } = req.body;

    const plan = await DailyPlan.findOne({ _id: req.params.id, user: req.user.id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    if (plan.tasks[taskIndex] === undefined)
      return res.status(400).json({ error: 'Invalid task index' });

    plan.tasks[taskIndex].completed = completed;
    await plan.save();

     await updateUserOverallProgress(req.user.id) 
    res.json({ message: 'Task updated', plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE all daily plans for the logged-in user
exports.deleteAllDailyPlans = async function deleteAllDailyPlans(req, res) {
  try {
    const userId = req.user.id;

    const plans = await DailyPlan.find({ user: userId });

    if (plans.length === 0) {
      return res.render('fullPlans', {
        groupedPlans: {},
        message: ' No plans found to delete.'
      });
    }

    const deleteResult = await DailyPlan.deleteMany({ user: userId });

    if (deleteResult.deletedCount === 0) {
      return res.render('fullPlans', {
        groupedPlans: {},
        message: ' Deletion failed. No plans were removed.'
      });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        dailyPlans: [],
        overallPercentage: 0
      }
    });

    res.render('fullPlans', {
      groupedPlans: {},
      message: ` ${deleteResult.deletedCount} plans deleted successfully!`
    });

  } catch (err) {
    console.error(' DeleteAllPlans Error:', err);
    res.render('fullPlans', {
      groupedPlans: {},
      message: ' Internal error while deleting your study plans.'
    });
  }
};


// Delete a daily plan
exports.deleteDailyPlan = async function deleteDailyPlan(req, res) {
  try {
    const plan = await DailyPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { dailyPlans: plan._id },
    });

    //call your
     updateUserOverallProgress(req.user.id) 
    res.json({ message: 'Daily plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserOverallProgress = updateUserOverallProgress;
