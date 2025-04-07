const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'storage/logos',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Solo se permiten imágenes .png, .jpg y .jpeg'));
    }
    cb(null, true);
  }
});

module.exports = upload;

