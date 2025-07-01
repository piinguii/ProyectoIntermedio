const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/mongo');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const fs = require('fs');

const app = express();
const clientRoutes = require('./routes/clientRoutes');
const deliveryNoteRoutes = require('./routes/deliveryNoteRoutes');
dotenv.config();
connectDB();

app.use(express.json());
app.use('/api/user', userRoutes);

app.use('/api', clientRoutes);

const projectRoutes = require('./routes/projectRoutes');
app.use('/api/project', projectRoutes);
app.use('/api/deliveryNotes', deliveryNoteRoutes);

// Debug: Log all registered routes
console.log('Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`Router mounted at: ${middleware.regexp}`);
  }
});

// Crear carpeta de logos si no existe
const logoDir = path.join(__dirname, 'storage', 'logos');
if (!fs.existsSync(logoDir)) fs.mkdirSync(logoDir, { recursive: true });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
