const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors()); // Esto permite que cualquier IP u origen acceda

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT} 🚀`);
});