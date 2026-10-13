import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import methodOverride from 'method-override';
import router from './routes/inicio_router.js';
import auth from './routes/auth_router.js';
import { contexto, requiereLogin } from './middleware/auth.js';
import { valoresPorDefecto, soloTextos, csrf } from './middleware/base.js';
import db from './config/db.js';
import './models/index.js';
import dotenv from 'dotenv';
import path from 'path';
import carrito from './routes/carrito_router.js';
import { contadorCarrito } from './utils/carrito.js';
import { sembrarLibros } from './utils/semilla.js';
const __dirname = path.resolve();

dotenv.config({ path: '.env' });
// Crear la aplicación
const app = express();

// Cabeceras de seguridad (CSP, nosniff, X-Frame-Options...) y sin X-Powered-By
// 'upgrade-insecure-requests' se quita para que funcione en http://localhost
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.disable('x-powered-by');

// Variables que siempre necesitan las vistas (también las de error)
app.use(valoresPorDefecto);

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', './views');
// Carpeta pública
app.use(express.static('public'));

// Acceso a bootstrap
app.use('/bootstrap', express.static(path.join(__dirname, 'public/bootstrap')));

// Acceso a los datos del formulario (límite de tamaño contra abusos)
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Permite PUT/DELETE vía ?_method=PUT
app.use(methodOverride('_method'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10kb' }));

// Solo valores de texto en el cuerpo
app.use(soloTextos);

// Sesiones (para el login). Con HTTPS pon COOKIE_SECURE=true en el .env
if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en el .env');
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // la sesión se renueva con la actividad
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);
app.use(contexto);
app.use(csrf);
app.use(contadorCarrito);

// Routing
app.use('/personas', requiereLogin, router);
app.use('/carrito', carrito);
app.use('/', auth);

// 404
app.use((req, res) => {
  res.status(404).render('error.ejs', { titulo: 'Página no encontrada', detalle: 'La página que buscas no existe.' });
});

// Errores: nunca se muestra el detalle técnico al usuario
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  // Formulario caducado (sesión vencida): volver al inicio con un aviso, sin página 403
  if (err.csrf) {
    req.session.flash = { error: 'El formulario caducó. Vuelve a intentarlo.' };
    return res.redirect(req.usuario ? '/personas' : '/login');
  }
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  const titulo =
    status === 413 ? 'Solicitud demasiado grande'
    : status === 403 ? 'Solicitud no autorizada'
    : status < 500 ? 'Solicitud inválida'
    : 'Error del servidor';
  const detalle =
    status === 403 ? 'La sesión de tu formulario expiró. Recarga la página e intenta de nuevo.'
    : status < 500 ? 'No se pudo procesar la solicitud.'
    : 'Algo salió mal. Intenta de nuevo más tarde.';
  if (status >= 500) console.error(err);

  res.status(status).render('error.ejs', { titulo, detalle }, (e, html) => {
    if (e) {
      console.error(e);
      return res.type('text').send(titulo);
    }
    res.send(html);
  });
});

// Definiendo el puerto
const port = 2800;

(async () => {
  try {
    await db.authenticate();
    console.log('Conexión a la base de datos establecida.');

    await db.sync(); // crea las tablas que falten (los datos existentes no se tocan)
    console.log('Modelos sincronizados.');

    await sembrarLibros();

    app.listen(port, () => {
      console.log(`Esperando peticiones en el puerto ${port}`);
    });
  } catch (err) {
    console.error('Error al iniciar:', err);
  }
})();
