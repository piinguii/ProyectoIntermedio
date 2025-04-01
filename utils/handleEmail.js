require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;

// Crea el transportador para enviar correos usando OAuth2
const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error('Error al obtener accessToken', err);
        return reject('No se pudo crear el token de acceso.');
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_FROM,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken
    }
  });

  return transporter;
};

// Envía el correo con las opciones proporcionadas
const sendEmail = async (emailOptions) => {
  try {
    const transporter = await createTransporter();
    const result = await transporter.sendMail(emailOptions);
    console.log('Email enviado', result);
    return result;
  } catch (error) {
    console.error('Error al enviar el correo', error);
    throw error;
  }
};

module.exports = { sendEmail };
