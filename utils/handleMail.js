require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const REDIRECT_URI = process.env.REDIRECT_URI;
const EMAIL_FROM = process.env.EMAIL_FROM;

const isDev = process.env.NODE_ENV === 'development';

const createTransporter = async () => {
  const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.error('OAuth2 error:', err);
        reject('Failed to create access token.');
      } else {
        resolve(token);
      }
    });
  });

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: EMAIL_FROM,
      accessToken,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
    },
  });
};

const sendEmail = async (emailOptions) => {
  if (isDev) {
    console.log('[MOCK EMAIL - DEVELOPMENT MODE]');
    console.log('From:', emailOptions.from || EMAIL_FROM);
    console.log('To:', emailOptions.to);
    console.log('Subject:', emailOptions.subject);
    console.log('Text:', emailOptions.text);
    return { mock: true, sent: false, ...emailOptions };
  }

  try {
    const transporter = await createTransporter();
    const result = await transporter.sendMail({
      ...emailOptions,
      from: emailOptions.from || EMAIL_FROM,
    });
    return result;
  } catch (e) {
    console.error('Email sending error:', e);
    throw new Error('Error sending email');
  }
};

module.exports = { sendEmail };
