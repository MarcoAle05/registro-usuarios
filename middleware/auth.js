import { Persona } from '../models/index.js';

// Carga la sesión desde la base en cada petición: el rol siempre está al día
// y una cuenta eliminada pierde la sesión de inmediato.
export const contexto = async (req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  res.locals.sesion = null;
  req.usuario = null;

  if (req.session.sesion) {
    const persona = await Persona.findByPk(req.session.sesion.id, {
      attributes: ['id', 'nombre', 'email', 'rol'],
    });
    if (persona) {
      req.usuario = persona.toJSON();
      res.locals.sesion = req.usuario;
    } else {
      delete req.session.sesion;
    }
  }
  next();
};

const denegar = (req, res) => {
  req.session.flash = { error: 'No tienes permiso para hacer eso' };
  res.status(403).redirect('/personas');
};

// Solo deja pasar a quien ya inició sesión
export const requiereLogin = (req, res, next) => {
  if (!req.usuario) {
    req.session.flash = { error: 'Inicia sesión para continuar' };
    return res.redirect('/login');
  }
  next();
};

// Si ya inició sesión, no tiene sentido mostrar registro/login
export const soloInvitados = (req, res, next) => {
  if (req.usuario) return res.redirect('/personas');
  next();
};

// Solo administradores
export const soloAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') return denegar(req, res);
  next();
};

// Administradores, o la propia persona (rutas con :id)
export const adminOPropio = (req, res, next) => {
  const esPropio = req.usuario?.id === Number(req.params.id);
  if (req.usuario?.rol !== 'admin' && !esPropio) return denegar(req, res);
  next();
};
