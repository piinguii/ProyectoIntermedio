const mongoose = require('mongoose');
const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String},
    address: {
      street: { type: String, required: true },
      number: { type: Number, required: true },
      postal: { type: Number, required: true },
      city: { type: String, required: true },
      province: { type: String, required: true }
    },
    archived: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyCIF: { type: String } // solo se guarda el cif para enlazar
  });
  
  ClientSchema.index({ email: 1, createdBy: 1, companyCIF: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });

  module.exports = mongoose.model('Client', ClientSchema);