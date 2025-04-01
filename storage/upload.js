const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'storage/logos/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
module.exports = multer({ storage });
