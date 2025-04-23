const Client = require('../models/Client');
const { matchedData } = require('express-validator');

const createClient = async (req, res) => {
  const { name, email, phone, address } = matchedData(req);
  const user = req.user;

  try {
    // Evita duplicados por email para el mismo usuario o su empresa
    const existing = await Client.findOne({
      email,
      $or: [
        { createdBy: user._id },
        { companyCIF: user.company?.cif }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: 'Ya existe un cliente con ese email para ti o tu compañía' });
    }

    const client = new Client({
      name,
      email,
      phone,
      address,
      createdBy: user._id,
      companyCIF: user.company?.cif || null
    });

    await client.save();

    res.status(201).json({
      message: 'Cliente creado correctamente',
      client
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};

module.exports{
    createClient
};