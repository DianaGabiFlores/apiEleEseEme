const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); 
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Importar el archivo de rutas que contiene el router
const rutasFamilias = require('./src/rutas');


// Configuración de Middlewares
app.use(cors()); // Permite peticiones CORS
app.use(bodyParser.json()); // Analiza el body de las peticiones como JSON
app.use(express.json());


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
