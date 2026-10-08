// Solo deja pasar a quien ya inició sesión
export const requiereLogin = (req, res, next) => {
  if (!req.session.sesion) {
    req.session.flash = { error: 'Inicia sesión para continuar' };
    return res.redirect('/login');
  }
  next();
};

// Si ya inició sesión, no tiene sentido mostrar registro/login
export const soloInvitados = (req, res, next) => {
  if (req.session.sesion) return res.redirect('/personas');
  next();
};

// Pasa el mensaje temporal (flash) y la sesión a las vistas
export const flash = (req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  res.locals.sesion = req.session.sesion || null;
  next();
};
