
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const handleGenerateCode = require('../utils/handleRegister');
const { matchedData } = require('express-validator');

const registerUser = async (req, res) => {
  // Extrae solo los datos validados por express-validator
  req = matchedData(req);

  try {
    const { email, password, name, age } = req;

    // Verifica si ya existe un usuario con ese email Y que esté validado
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.status === 'verified') {
      return res.status(409).json({ message: 'Email ya registrado y validado' });
    }

    // Cifra la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Genera el código de verificación aleatorio
    const code = handleGenerateCode();

    // Define el rol por defecto y crea los datos del usuario
    const role = req.role || 'user';
    const userData = {
      email,
      password: hashedPassword,
      code,
      role,
      attempts: 3,
      personalData: {
        name,
        age
      }
    };

    // Crea o actualiza el usuario si ya existía pero no verificado
    const user = existingUser
      ? Object.assign(existingUser, userData)
      : new User(userData);

    await user.save();


    // Genera el token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Elimina campos sensibles antes de enviar al cliente
    user.set('password', undefined, { strict: false });
    user.set('code', undefined, { strict: false });

    // Devuelve respuesta exitosa con datos mínimos del usuario y token
    res.status(201).json({
      token,
      user: {
        email: user.email,
        status: user.status,
        role: user.role,
        personalData: user.personalData
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
};

//Validacion del email
const validateUserEmail = async (req, res) => {
  const { code } = matchedData(req);
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (user.code !== code) {
      user.attempts -= 1;
      await user.save();
      return res.status(400).json({ message: 'Código incorrecto', attempts: user.attempts });
    }

    user.status = 'verified';
    await user.save();
    return res.status(200).json({ message: 'Email verificado correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
}

//Login
const loginUser = async (req, res) => {
  req = matchedData(req);
  try {
    const { email, password } = req;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    user.set('password', undefined, { strict: false });
    user.set('code', undefined, { strict: false });

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        status: user.status,
        role: user.role,
        personalData: user.personalData
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al hacer login' });
  }
};


//Onboarding

const updatePersonalData = async (req, res) => {
  const { name, lastname, nif } = matchedData(req);
  try {
    
    const user = req.user;

    user.personalData = { ...user.personalData, name, lastname, nif };
    await user.save();
    return res.status(200).json({ message: 'Datos personales actualizados correctamente' });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar datos personales' });
  }
};

const updateCompanyData = async (req, res) => {
  const { name, cif, address, isFreelancer } = matchedData(req);
  try {
    //cambiar a req user
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (isFreelancer) {
      user.company = {
        name: user.personalData.name,
        cif: cif,
        address: address
      };
    } else {
      user.company = { name, cif, address };
    }

    await user.save();
    return res.status(200).json({ message: 'Datos de la compañía actualizados correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar datos de la compañía' });
  }
};

//Subir logo
const uploadUserLogo = async (req, res) => {
  try {
    //cambiar a req user
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (!req.file) {
      return res.status(400).json({ message: 'No se envió ningún archivo' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/storage/logos/${req.file.filename}`;
    user.logoUrl = imageUrl;
    await user.save();

    res.status(200).json({ message: 'Logo subido correctamente', logoUrl: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir el logo' });
  }
};

//endpoints 
//GET profile

const getUserProfile = async (req, res) => {
  try {
    //cambiar a req user
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -code');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

//reset password
const forgotPassword = async (req, res) => {
  const { email } = matchedData(req);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const code = handleGenerateCode();
    user.resetCode = code;
    user.resetCodeExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    await user.save();

    res.status(200).json({
      message: 'Código generado correctamente',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar el código' });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = matchedData(req);
  try {
    const user = await User.findOne({ email });

    if (!user || user.resetCode !== code || user.resetCodeExpiration < Date.now()) {
      return res.status(400).json({ message: 'Código inválido o expirado' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetCode = null;
    user.resetCodeExpiration = null;

    await user.save();
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar contraseña' });
  }
};

//invite user

const inviteUser = async (req, res) => {
  const { email } = matchedData(req);

  try {
    const inviter = req.user; 

    if (!inviter.company || !inviter.company.cif) {
      return res.status(400).json({ message: 'Debes tener una compañía configurada para invitar' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'El usuario ya existe' });

    const code = handleGenerateCode();

    const newGuest = new User({
      email,
      role: 'guest',
      code,
      status: 'pending',
      company: inviter.company,
      attempts: 3
    });

    await newGuest.save();

    res.status(201).json({
      message: 'Invitación creada correctamente',
      guest: {
        email: newGuest.email,
        role: newGuest.role,
        status: newGuest.status,
        company: newGuest.company
      },
     
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al invitar usuario' });
  }
};

//delete user
const deleteUser = async (req, res) => {
  try {
    const user = req.user; 

    const isSoftDelete = req.query.soft === 'true';

    if (isSoftDelete) {
      user.status = 'deleted';
      await user.save();
      return res.status(200).json({ message: 'Usuario marcado como eliminado (soft delete)' });
    } else {
      await user.deleteOne();
      return res.status(200).json({ message: 'Usuario eliminado permanentemente (hard delete)' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};


module.exports = {
  registerUser,
  validateUserEmail,
  loginUser, 
  updatePersonalData,
  updateCompanyData,
  uploadUserLogo,
  getUserProfile,
  forgotPassword,
  resetPassword,
  inviteUser,
  deleteUser
};