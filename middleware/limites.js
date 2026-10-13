import { rateLimit } from 'express-rate-limit';

// Login: 10 intentos fallidos cada 15 minutos por IP (los exitosos no cuentan)
export const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('auth/login.ejs', {
      error: 'Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo',
      email: '',
    }),
});

// Registro: 10 cuentas por hora por IP
export const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('auth/registro.ejs', {
      error: 'Demasiados registros desde tu red. Intenta más tarde',
      yaRegistrado: false,
      valores: {},
    }),
});
