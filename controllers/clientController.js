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

//put
const updateClient = async (req, res) => {
    const { id } = req.params;
    const data = matchedData(req);
    const user = req.user;
  
    try {
      const client = await Client.findById(id);
  
      if (!client) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
  
      // Verificación de permisos
      const belongsToUserOrCompany =
        client.createdBy.equals(user._id) || client.companyCIF === user.company?.cif;
  
      if (!belongsToUserOrCompany) {
        return res.status(403).json({ message: 'No tienes permiso para editar este cliente' });
      }
  
      Object.assign(client, data);
      await client.save();
  
      res.status(200).json({ message: 'Cliente actualizado', client });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error al actualizar cliente' });
    }
};

module.exports{
    createClient,
    updateClient
};