const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: 'NOT_TOKEN' });
  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('DECODED:', decoded);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'INVALID_TOKEN' });

    if (user.status !== "verified") return res.status(401).json({ error: 'USER_NOT_VERIFIED' });

    req.user = user;


    next();
  } catch {
    res.status(403).json({ error: 'INVALID_TOKEN' });
  }
};