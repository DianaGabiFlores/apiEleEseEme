const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); 
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Importar el archivo de rutas que contiene el router
const rutasFamilias = require('./src/rutas/rutas');

app.use(cors({
  origin: 'http://localhost:4200',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // Analiza el body de las peticiones como JSON
app.use(express.urlencoded({ extended: true }));

// ---------------------------------
// Montaje de las Rutas de la API
// ---------------------------------
app.use('/', rutasFamilias); 


// Ruta de bienvenida (opcional)
app.get('/', (req, res) => {
    res.send('API Root Funcionando. Accede a /familias para consultar datos.');
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT} 🚀`);
});
