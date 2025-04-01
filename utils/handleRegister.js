
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Maneja la generación del código de verificación de 6 dígitos
const handleGenerateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  module.exports = handleGenerateCode;
  