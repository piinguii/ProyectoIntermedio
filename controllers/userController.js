const User = require('../models/User');
const { matchedData } = require('express-validator');
const { handleHttpError } = require('../utils/handleError');
const { encrypt, compare } = require('../utils/handlePassword');
const { tokenSign, verifyToken } = require('../utils/handleJWT');
const generateCode = require('../utils/handleRegister');
const { sendEmail } = require('../utils/handleMail');

const registerUser = async (req, res) => {
  try {
    req = matchedData(req);
    const { email, password, name, age } = req;

    let user = await User.findOne({ email });
    if (user && user.status === 'verified') {
      return handleHttpError(res, 'Email ya registrado y validado', 409);
    }

    const hashedPassword = await encrypt(password);
    const code = generateCode();

    const userData = {
      email,
      password: hashedPassword,
      code,
      role: req.role || 'user',
      attempts: 3,
      personalData: { name, age }
    };

    user = user ? Object.assign(user, userData) : new User(userData);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Código de verificación de registro',
      text: `Tu código de verificación es: ${code}`,
      from: process.env.EMAIL_FROM
    });

    const token = await tokenSign(user);
    user.set('password', undefined);
    user.set('code', undefined);

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Error en registerUser:', err);
    handleHttpError(res, 'Error al registrar el usuario');
  }
};

const validateUserEmail = async (req, res) => {
  try {
    const { code } = matchedData(req);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return handleHttpError(res, 'Token no proporcionado', 401);

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) return handleHttpError(res, 'Usuario no encontrado', 404);

    if (user.code !== code) {
      user.attempts -= 1;
      await user.save();
      return handleHttpError(res, 'Código incorrecto', 400, { attempts: user.attempts });
    }

    user.status = 'verified';
    user.code = null;
    await user.save();

    return res.status(200).json({ message: 'Email verificado correctamente' });
  } catch (err) {
    handleHttpError(res, 'Token inválido o expirado', 403);
  }
};

const loginUser = async (req, res) => {
  try {
    req = matchedData(req);
    const { email, password } = req;

    const user = await User.findOne({ email });
    if (!user || !(await compare(password, user.password))) {
      return handleHttpError(res, 'Credenciales incorrectas', 401);
    }

    const token = await tokenSign(user);
    user.set('password', undefined);
    user.set('code', undefined);

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
    handleHttpError(res, 'Error al hacer login');
  }
};

const updatePersonalData = async (req, res) => {
  try {
    const { name, lastname, nif } = matchedData(req);
    const user = req.user;

    user.personalData = { ...user.personalData, name, lastname, nif };
    await user.save();
    return res.status(200).json({ message: 'Datos personales actualizados correctamente' });
  } catch (err) {
    handleHttpError(res, 'Error al actualizar datos personales');
  }
};

const updateCompanyData = async (req, res) => {
  try {
    const { name, cif, address, isFreelancer } = matchedData(req);
    const user = req.user;

    user.company = isFreelancer
      ? { name: user.personalData.name, cif, address }
      : { name, cif, address };

    await user.save();
    return res.status(200).json({ message: 'Datos de la compañía actualizados correctamente' });
  } catch (err) {
    handleHttpError(res, 'Error al actualizar datos de la compañía');
  }
};

const uploadUserLogo = async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) return handleHttpError(res, 'No se envió ningún archivo', 400);

    const imageUrl = `${req.protocol}://${req.get('host')}/storage/logos/${req.file.filename}`;
    user.logoUrl = imageUrl;
    await user.save();

    res.status(200).json({ message: 'Logo subido correctamente', logoUrl: imageUrl });
  } catch (error) {
    handleHttpError(res, 'Error al subir el logo');
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -code');
    if (!user) return handleHttpError(res, 'Usuario no encontrado', 404);
    res.status(200).json({ user });
  } catch (err) {
    handleHttpError(res, 'Token inválido o expirado', 403);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = matchedData(req);
    const user = await User.findOne({ email });
    if (!user) return handleHttpError(res, 'Usuario no encontrado', 404);

    const code = generateCode();
    user.resetCode = code;
    user.resetCodeExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendEmail({
      to: email,
      subject: 'Código de recuperación',
      text: `Tu código es: ${code}`,
      from: process.env.EMAIL_FROM
    });

    res.status(200).json({ message: 'Código de recuperación enviado correctamente' });
  } catch (err) {
    handleHttpError(res, 'Error al generar el código');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = matchedData(req);
    const user = await User.findOne({ email });

    if (!user || user.resetCode !== code || user.resetCodeExpiration < Date.now()) {
      return handleHttpError(res, 'Código inválido o expirado', 400);
    }

    user.password = await encrypt(newPassword);
    user.resetCode = null;
    user.resetCodeExpiration = null;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    handleHttpError(res, 'Error al actualizar contraseña');
  }
};

const inviteUser = async (req, res) => {
  try {
    const { email } = matchedData(req);
    const inviter = req.user;

    if (!inviter.company?.cif) {
      return handleHttpError(res, 'Debes tener una compañía configurada para invitar', 400);
    }

    const existing = await User.findOne({ email });
    if (existing) return handleHttpError(res, 'El usuario ya existe', 409);

    const code = generateCode();

    const newGuest = new User({
      email,
      role: 'guest',
      code,
      status: 'pending',
      company: inviter.company,
      attempts: 3
    });

    await newGuest.save();

    await sendEmail({
      to: email,
      subject: 'Has sido invitado a Gabrisp',
      text: `Tu código de acceso es: ${code}`,
      from: process.env.EMAIL_FROM
    });

    res.status(201).json({
      message: 'Invitación creada correctamente',
      guest: {
        email: newGuest.email,
        role: newGuest.role,
        status: newGuest.status,
        company: newGuest.company
      }
    });
  } catch (err) {
    handleHttpError(res, 'Error al invitar usuario');
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = req.user;
    const isSoftDelete = req.query.soft === 'true';

    if (isSoftDelete) {
      user.status = 'deleted';
      await user.save();
      return res.status(200).json({ message: 'Usuario marcado como eliminado (soft delete)' });
    }

    await user.deleteOne();
    return res.status(200).json({ message: 'Usuario eliminado permanentemente (hard delete)' });
  } catch (err) {
    handleHttpError(res, 'Error al eliminar el usuario');
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
