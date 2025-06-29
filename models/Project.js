const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectCode: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    number: { type: Number, required: true },
    postal: { type: Number, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true }
  },
  code: { type: String, required: true }, // código interno del proyecto
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  archived: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
});

module.exports = mongoose.model('Project', ProjectSchema);
