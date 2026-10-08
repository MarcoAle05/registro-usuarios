import express from 'express';
import session from 'express-session';
import methodOverride from 'method-override';
import router from './routes/inicio_router.js';
import auth from './routes/auth_router.js';
import api from './routes/api_router.js';
import { flash, requiereLogin } from './middleware/auth.js';
import db from './config/db.js';
import './models/index.js';
import './models/Usuario.js';
import dotenv from 'dotenv';
import path from 'path';
const __dirname = path.resolve();

dotenv.config({ path: '.env' });
// Crear la aplicación
const app = express();

// Acceso a los datos del formulario
app.use(express.urlencoded({ extended: true }));

// Permite PUT/DELETE vía ?_method=PUT
app.use(methodOverride('_method'));

// Middleware para parsear JSON
app.use(express.json());

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', './views');
// Carpeta pública
app.use(express.static('public'));

// Acceso a bootstrap
app.use('/bootstrap', express.static(path.join(__dirname, 'public/bootstrap')));

// Sesiones (para el login)
if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en el .env');
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 2 },
  })
);
app.use(flash);

// Routing
app.use('/api', api);
app.use('/personas', requiereLogin, router);
app.use('/', auth);

// 404
app.use((req, res) => {
  res.status(404).render('error.ejs', { titulo: 'Página no encontrada', detalle: 'La página que buscas no existe.' });
});

// Errores no controlados
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error.ejs', { titulo: 'Error del servidor', detalle: 'Algo salió mal. Intenta de nuevo más tarde.' });
});

// Definiendo el puerto
const port = 2800;

(async () => {
  try {
    await db.authenticate();
    console.log('Conexión a la base de datos establecida.');

    await db.sync(); // crea las tablas que falten (los datos existentes no se tocan)
    console.log('Modelos sincronizados.');

    app.listen(port, () => {
      console.log(`Esperando peticiones en el puerto ${port}`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err);
  }
})();
