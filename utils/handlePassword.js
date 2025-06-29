const bcrypt = require('bcryptjs');

// Encripta una contraseña en texto plano
const encrypt = async (passwordPlain) => {
  const hash = await bcrypt.hash(passwordPlain, 10);
  return hash;
};

// Compara contraseña en texto plano con la cifrada
const compare = async (passwordPlain, hashPassword) => {
  return await bcrypt.compare(passwordPlain, hashPassword);
};

module.exports = { encrypt, compare };
