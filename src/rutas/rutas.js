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

router.get('/modulos', async (req, res) => {
  try {
    // Recibe los módulos
    const modulos = await pool.query(
        'Select * from MODULO;'
    );
    
    // Por cada comentario principal traer los comentarios réplicas
    const Modulo_Secciones_Promises = modulos[0].map(async modulo => {
      const id = modulo.ID_Modulo;
      // Extraer las secciones por cada módulo
      const secciones = await pool.query(
        `SELECT S.* FROM SECCION S INNER JOIN MODULO M ON M.ID_Modulo = S.Id_Modulo WHERE M.ID_Modulo = ?;`,
        [id]
      );
      const respuesta_final = await Promise.all(secciones); 
      return {
        ...modulo,
        secciones: respuesta_final[0]
      };
    });

    const Modulo_Secciones = await Promise.all(Modulo_Secciones_Promises); 
    console.log(Modulo_Secciones);

    return res.status(200).json({ // Changed to 200 OK for GET request
      success: true,
      message: 'Modulos encontrados',
      response: Modulo_Secciones
    });

  }catch(err){
    console.error('Error al traer los Modulos: ', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      response: null
    });
  }  
});

// ------------------------------------
// Ruta para traer palabras que coincidan con la búsqueda
// Accesible en: /palabras/busqueda
// ------------------------------------
router.post('/palabras/busqueda', async (req, res) => {
  console.log(req.body);
  try {
    const buscador = req.body.info;
    let palabras;
    if(buscador == null || buscador == "null"){
      palabras = await pool.query(
        'SELECT Id_Palabra, nombre, descripcion, enlace, tipo FROM PALABRA'
      );
    }else{
      palabras = await pool.query(
        `SELECT Id_Palabra, P.nombre, P.descripcion, P.enlace, P.tipo FROM PALABRA P INNER JOIN FAMILIA F ON P.Id_familia = F.ID_Familia WHERE lower(P.nombre) LIKE '%${buscador}%' OR lower(F.nombre) LIKE '%${buscador}%';`
      );
    }
    console.log(palabras[0]);
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

// ------------------------------------
// Endpoint para registrar un nuevo usuario si es que aún no esta registrado
// // Accesible en: /usuario/crear
// ------------------------------------
router.post('/usuario/crear', async (req, res) => {
  try {
    const { Correo, Nombre, Nickname, Imagen} = req.body;
    // Verificar si el correo ya está registrado
    const [existingUser] = await pool.query(
      'SELECT ID_User FROM USUARIO WHERE correo = ?',
      [Correo]
    );

    // Si esta registrado retornar un falso 
    if (existingUser.length < 0) {

      // return res.status(409).json({
      //   success: false,
      //   message: 'El correo electrónico ya está registrado',
      //   response: null
      // });

      // Insertar el nuevo usuario en la base de datos
      await pool.query(
        `INSERT INTO USUARIO (correo, nombre, nickname, imagen) 
        VALUES (?, ?, ?, ?)`,
        [Correo, Nombre, Nickname, Imagen]
      );
    }

    // Obtener el usuario recién creado para devolverlo en la respuesta
    const [newUser] = await pool.query(
      `SELECT ID_User 
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


// ------------------------------------
// Ruta para traer todos los comentarios
// Accesible en: /comentarios/todos
// ------------------------------------
router.get('/comentarios/todos', async (req, res) => {
  try {
    // Recibe todos los comentarios que son principales, y los ordena de forma descendente por ID
    const comentarios = await pool.query(
        'SELECT C.ID_Comentario, U.Nombre, U.imagen as U_imagen, DATE_FORMAT(C.fecha,  "%d %b %Y") as fecha, C.asunto, C.descripcion, C.video, C.imagen, C.Documento, ( SELECT COUNT(*) FROM COMENTARIO C2 WHERE C2.ID_Comentario_respuesta = C.ID_Comentario ) AS Total_Respuestas FROM Comentario C INNER JOIN USUARIO U ON C.ID_Usuario = U.ID_User WHERE C.ID_Comentario_respuesta IS NULL ORDER BY C.ID_Comentario DESC;'
    );
    
    // Por cada comentario principal traer los comentarios réplicas
    const Comentarios_Replies_Promises = comentarios[0].map(async comentario => {
      const id = comentario.ID_Comentario;
      // Extraer los comentarios respuesta
      const respuestas = await pool.query(
        `SELECT C.ID_Comentario, U.Nombre, U.imagen as U_imagen, DATE_FORMAT(C.fecha, '%d %b %Y') as fecha, C.asunto, C.descripcion, C.video, C.imagen, C.Documento, -1 AS Total_Respuestas  FROM Comentario C INNER JOIN USUARIO U ON C.ID_Usuario = U.ID_User WHERE C.ID_Comentario_respuesta = ? ORDER BY C.ID_Comentario; `,
        [id]
      );
      const respuestas_respuestas = respuestas[0].map(async respuesta => {
          return {
          ...respuesta,
          respuestas: []
        };
      });
      const respuestas_fianl = await Promise.all(respuestas_respuestas); 
      return {
        ...comentario,
        respuestas: respuestas_fianl
      };
    });

    const Comentarios_Replies = await Promise.all(Comentarios_Replies_Promises); 
    console.log(Comentarios_Replies);

    return res.status(200).json({ // Changed to 200 OK for GET request
      success: true,
      message: 'Comentarios encontrados',
      response: Comentarios_Replies
    });

  }catch(err){
    console.error('Error al traer los comentarios: ', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      response: null
    });
  }  
});

// ------------------------------------
// Endpoint para registrar un nuevo usuario si es que aún no esta registrado
// Accesible en: /comentario/agregar
// ------------------------------------
router.post('/comentario/agregar', async (req, res) => {
  try {
    // id
    const {Id_comentario_padre, Id_usuario, fecha, asunto, descripcion, video, imagen, documento} = req.body;

    // Insertar el comentario
    const [rows, fields] = await pool.query(
      ` INSERT INTO COMENTARIO (ID_Usuario, fecha, asunto, descripcion, video, Imagen, Documento, ID_Comentario_respuesta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [Id_usuario, fecha, asunto, descripcion, video, imagen, documento, Id_comentario_padre]
    );

    // Si se inserto correctamente 
    if (rows.affectedRows === 1) {
      console.log(`Row inserted successfully. New ID: ${rows.insertId}`);
    } else {
      // Si ocurrió un error 
      console.log("Insert operation did not affect the expected number of rows.");
    }
    
    return res.status(201).json({
      success: true,
      message: 'Comentario registrado correctamente',
      response: "succesful"
    });

  } catch (err) {
    console.error('Error al registrar comentario:', err);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      response: null
    });
  }
});

module.exports = router;