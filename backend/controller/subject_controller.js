const User = require('../models/user_model');
const Subject = require('../models/subject_model');

exports.createSubject = async function createSubject(req, res) {
  try {
    const { name, syllabus } = req.body;

    const subject = new Subject({
      user: req.user.id,
      name,
      syllabus,
    });

    await subject.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { subjects: subject._id },
    });

    //  Minimal change: render page with success message
    res.render('createSubject', { message: 'Subject created successfully!' });

  } catch (err) {
    //  Render the same page with error message
    res.status(500).render('createSubject', { message: `Error: ${err.message}` });
  }
};


// Get all subjects for the logged-in user
exports.getSubjects = async function getSubjects(req, res) {
  try {
    const subjects = await Subject.find({ user: req.user.id });
    res.render('allSubjects', { subjects });  
  } catch (err) {
    res.status(500).render('error', { message: err.message }); 
  }
};


// Update a specific subject
exports.updateSubject = async function updateSubject(req, res) {
  try {
    const { name, syllabus } = req.body;

    const updatedSyllabus = Array.isArray(syllabus)
      ? syllabus
      : syllabus.split(',').map(topic => topic.trim()).filter(topic => topic);

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, syllabus: updatedSyllabus },
      { new: true }
    );

    if (!subject) {
      return res.status(404).render('updateSubject', {
        subject: null,
        message: ' Subject not found or unauthorized!',
      });
    }

    // Re-render update page with updated data and message
    res.render('updateSubject', {
      subject,
      message: ' Subject updated successfully!',
    });
  } catch (err) {
    res.status(500).render('updateSubject', {
      subject: null,
      message: ` Error: ${err.message}`,
    });
  }
};



// Delete a specific subject and unlink from user
exports.deleteSubject = async function deleteSubject(req, res) {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!subject) {
      return res.status(404).json({ error: 'Subject not found or unauthorized' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { subjects: subject._id },
    });

    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};