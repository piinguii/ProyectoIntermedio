const jwt = require("jsonwebtoken");
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const tokenSign = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const verifyToken = (tokenJwt) => {
  try {
    return jwt.verify(tokenJwt, JWT_SECRET);
  } catch (err) {
    console.log(err);
    return null;
  }
};

module.exports = { tokenSign, verifyToken };
