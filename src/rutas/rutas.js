const express = require('express');
const router = express.Router();

// IMPORTANTE: Se corrige la ruta relativa para importar el pool de la DB
const db = require('../db'); 
const pool = require('../db');


// ------------------------------------
// RUTA GET: Obtener todos las familias
// Accesible en: /familias
// ------------------------------------
router.get('/familias', async (req, res) => {
  try {
    console.log("-> Petición GET a /familias");
    // Consulta simple (SELECT)
    const [rows] = await db.execute('SELECT * FROM FAMILIA');
    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener familias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al consultar la base de datos',
      details: error.message
    });
  }
});

// Ruta para traer palabras que coincidan con la búsqueda
router.post('/palabras/busqueda', async (req, res) => {
  try {
    const buscador = req.body.info;
    let palabras;
    if(buscador == null){
      palabras = await pool.query(
        'SELECT Id_Palabra, nombre, descripcion, video FROM PALABRA'
      );
    }else{
      palabras = await pool.query(
        `SELECT Id_Palabra, P.nombre, P.descripcion, P.video FROM PALABRA P INNER JOIN FAMILIA F ON P.Id_familia = F.ID_Familia WHERE lower(P.nombre) LIKE '%${buscador}%' OR lower(F.nombre) LIKE '%${buscador}%';`
      );
    }
    return res.status(201).json({
      success: true,
      message: 'Palabras encontradas',
      response: palabras[0]
    });

  }catch(err){
    console.error('Error al buscar las palabras deseadas: ', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      response: null
    });
  }  
});

// Endpoint para registrar un nuevo usuario si es que aún no esta registrado
router.post('/usuario/crear', async (req, res) => {
  try {
    const { Correo, Nombre, Nickname, Imagen} = req.body;
    // Verificar si el correo ya está registrado
    const [existingUser] = await pool.query(
      'SELECT ID_User FROM USUARIO WHERE correo = ?',
      [Correo]
    );

    // Si esta registrado retornar un falso 
    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
        response: null
      });
    }

    // Insertar el nuevo usuario en la base de datos
    await pool.query(
      `INSERT INTO USUARIO (correo, nombre, nickname, imagen) 
       VALUES (?, ?, ?, ?)`,
      [Correo, Nombre, Nickname, Imagen]
    );

    // Obtener el usuario recién creado para devolverlo en la respuesta
    const [newUser] = await pool.query(
      `SELECT * 
       FROM USUARIO 
       WHERE correo = ?`,
      [Correo]
    );

    console.log("-> Petición POST usuario");
    
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      response: newUser[0]
    });

  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      response: null
    });
  }
});

module.exports = router;