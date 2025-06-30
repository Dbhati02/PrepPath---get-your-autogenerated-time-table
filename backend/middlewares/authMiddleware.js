const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

const authMiddleware = async function (req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).render('unauthorized');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };

    next();
  } catch (err) {
    return res.status(401).render('unauthorized');
  }
};

module.exports = authMiddleware;
