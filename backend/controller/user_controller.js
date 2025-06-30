const User = require('../models/user_model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { updateUserOverallProgress } = require('../controller/dailyPlan_controller');
//register api 
exports.register = async function register(req,res){
    try {
        const {name, email, password, examDate} = req.body;
        if(await User.findOne({email})){
            return res.render('register', { message: 'User already exists with this email.' });
        }
        
        const passwordHash = await bcrypt.hash(password,10);
        const user = new User({name, email,password: passwordHash, examDate});
        await user.save();
        res.render('register', { message: 'Successfully registered!' });
    } catch (error) {
        return res.render('register', { message: 'Something went wrong. Please try again.' });
    }
}


//login
exports.login = async function login(req,res){
     try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.render('login', { message: 'No user found with the email!!' });
        }

        if(!(await bcrypt.compare(password,user.password))){
            return res.render('login', { message: "Password didn't match!!" });
        }

        //after checking both the condition now store the user in token 
        const token = jwt.sign({id : user._id}, process.env.JWT_SECRET,{
            expiresIn: '7d',
        });

        //now store this token as a cookie
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 7*24*60*60*1000,
        })

        //just return the succefull mess
       res.render('login', { message: 'Successfully LogedIn!' });
     } catch (error) {
        return res.render('login', { message: 'Something went wrong. Please try again.' });
     }
}


//logout 
exports.logout = async function logout(req,res){
  res.clearCookie('token',{
    httpOnly: true,
    sameSite: 'Strict',
  });

 res.render('home', { message: "Logged out successfully!" });

}



exports.getUserProfile = async function getUserProfile(req, res) {
  try {
    // First update the user's overall progress
    await updateUserOverallProgress(req.user.id);

    // Then fetch the updated user data
    const user = await User.findById(req.user.id)
      .select('-password') // hide password
      .populate('subjects')
      .populate('dailyPlans');

    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    // RENDER the EJS profile page and send user data
    res.render('profileUser', { user });

  } catch (err) {
    console.error('Error in getUserProfile:', err);
    res.status(500).render('error', { message: err.message });
  }
};


// update user profile
exports.updateUserProfile = async function updateUserProfile(req, res) {
  try {
    const updates = {};
    const allowedFields = ['name', 'email', 'examDate'];

    // Include only fields the user has provided and are allowed
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    )
      .select('-password')
      .populate('subjects')
      .populate('dailyPlans');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //  Render profile page with alert message
    res.render('updateProfile', {
      user,
      message: ' Profile updated successfully!',
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
