const { sendEmail } = require('../utils/handleMail');
const { handleHttpError } = require('../utils/handleError');

const send = async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    const info = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text
    };

    const result = await sendEmail(info);
    res.status(200).json({ success: true, info: result });
  } catch (err) {
    handleHttpError(res, 'ERROR_SEND_EMAIL');
  }
};

module.exports = { send };
