const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('DECODED:', decoded);
    const user = await User.findById(decoded.id);
    if (!user) return res.sendStatus(401);

    if (user.status !== "verified") return res.sendStatus(401);

    req.user = user;


    next();
  } catch {
    res.sendStatus(403);
  }
};