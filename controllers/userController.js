
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const handleGenerateCode = require('../utils/handleRegister');
const { matchedData } = require('express-validator');
const { sendEmail } = require('../utils/handleEmail');

exports.registerUser = async (req, res) => {
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

    // Enviar código de verificación por correo electrónico
    await sendEmail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Código de verificación',
      text: `Tu código de verificación es: ${code}`
    });

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
exports.validateUserEmail = async (req, res) => {
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

exports.loginUser = async (req, res) => {
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

exports.updatePersonalData = async (req, res) => {
  const { name, lastname, nif } = matchedData(req);
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.personalData = { ...user.personalData, name, lastname, nif };
    await user.save();

    return res.status(200).json({ message: 'Datos personales actualizados correctamente' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al actualizar datos personales' });
  }
};

exports.updateCompanyData = async (req, res) => {
  const { name, cif, address, isFreelancer } = matchedData(req);
  try {
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
