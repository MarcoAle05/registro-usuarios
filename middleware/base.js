import crypto from 'node:crypto';

// Valores por defecto para las vistas. Van PRIMERO, así hasta las páginas de
// error (que pueden ocurrir antes que la sesión) tienen todo lo que usa el header.
export const valoresPorDefecto = (req, res, next) => {
  res.locals.sesion = null;
  res.locals.flash = {};
  res.locals.csrfToken = '';
  res.locals.rutaActual = req.path;
  res.locals.carritoCantidad = 0;
  res.locals.dinero = (pesos) =>
    Number(pesos).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  res.locals.dineroCent = (centavos) => res.locals.dinero(centavos / 100);
  next();
};

// Solo se aceptan textos: rechaza arreglos y objetos (email[]=a, {"a":{...}}) con 400
// en vez de dejar que rompan el controlador con un 500.
export const soloTextos = (req, res, next) => {
  req.body = req.body ?? {};
  const valido = Object.values(req.body).every((v) => typeof v === 'string');
  if (!valido) {
    const err = new Error('Cuerpo inválido');
    err.status = 400;
    return next(err);
  }
  next();
};

// Protección CSRF (token por sesión, comparado en tiempo constante)
export const csrf = (req, res, next) => {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrf;

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const enviado = req.body._csrf;
  const esperado = req.session.csrf;
  const valido =
    typeof enviado === 'string' &&
    enviado.length === esperado.length &&
    crypto.timingSafeEqual(Buffer.from(enviado), Buffer.from(esperado));
  if (!valido) {
    const err = new Error('Token CSRF inválido');
    err.status = 403;
    err.csrf = true;
    return next(err);
  }
  next();
};
