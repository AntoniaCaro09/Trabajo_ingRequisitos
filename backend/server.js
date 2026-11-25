
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.API_BIND_HOST || '127.0.0.1';

// Configuración de Express
app.use(cors());
app.use(express.json());

// Conexión con PostgreSQL
const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Comprobar que el servidor funciona
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Mantenimiento Planta funcionando'
  });
});

// Consultar los equipos de PostgreSQL
app.get('/api/equipos', async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT
        e.id,
        e.codigo_interno,
        e.codigo_qr,
        e.nombre,
        e.descripcion,
        e.estado,
        a.nombre AS area
      FROM public.equipos e
      INNER JOIN public.areas a
        ON e.area_id = a.id
      ORDER BY e.codigo_interno
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(
      'Error al consultar equipos:',
      error.message
    );

    res.status(500).json({
      error: 'No se pudieron consultar los equipos'
    });
  }
});

// Consultar las áreas industriales
app.get('/api/areas', async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT
        id,
        planta_id,
        nombre,
        descripcion
      FROM public.areas
      ORDER BY nombre
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(
      'Error al consultar áreas:',
      error.message
    );

    res.status(500).json({
      error: 'No se pudieron consultar las áreas'
    });
  }
});

// Panel web existente
// Conserva las funciones de tu compañera
app.use('/api', require('./panelRoutes')(db));

// NUEVO: API de la aplicación móvil
// Autenticación, QR, fotografías y sincronización
app.use('/api/mobile', require('./mobileRoutes')(db));

// Iniciar el servidor
app.listen(PORT, HOST, () => {
  console.log(
    `Servidor funcionando en http://${HOST}:${PORT}`
  );
});
