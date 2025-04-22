const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  code: String, // código de verificación
  attempts: { type: Number, default: 3 }, // número máximo de intentos para validación
  status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
  role: { type: String, default: 'user' },
  personalData: {
    name: String,
    lastname: String,
    nif: String,
    age: Number
  },
  company: {
    name: String,
    cif: String,
    address: String,
  },
  logoUrl: String,
  //reset password
  resetCode: { type: String },
  resetCodeExpiration: { type: Date }

});
module.exports = mongoose.model('User', UserSchema);