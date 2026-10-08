import bcrypt from 'bcryptjs';
import { Persona } from '../models/index.js';
import { mensajeError } from '../utils/errores.js';

// GET /registro
const registroForm = (req, res) => {
  res.render('auth/registro.ejs', { error: null, yaRegistrado: false, valores: {} });
};

// POST /registro
const registro = async (req, res) => {
  const { nombre, apellido, email, edad, password } = req.body;
  const valores = { nombre, apellido, email, edad };
  const fallo = (error, extra = {}) =>
    res.status(400).render('auth/registro.ejs', { error, yaRegistrado: false, valores, ...extra });

  if (!nombre?.trim() || !apellido?.trim() || !email?.trim() || !edad || !password) {
    return fallo('Todos los campos son obligatorios');
  }
  if (password.length < 6) {
    return fallo('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    const emailLimpio = email.trim().toLowerCase();

    // Revisar antes de insertar: un INSERT fallido gasta un ID del auto_increment
    if (await Persona.findOne({ where: { email: emailLimpio } })) {
      return fallo('Ese email ya está registrado', { yaRegistrado: true });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Persona.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: emailLimpio,
      edad,
      password: passwordHash,
    });
    req.session.flash = { mensaje: 'Registro exitoso. Ahora inicia sesión' };
    res.redirect('/login');
  } catch (err) {
    fallo(mensajeError(err).texto);
  }
};

// GET /login
const loginForm = (req, res) => {
  res.render('auth/login.ejs', { error: null, email: '' });
};

// POST /login
const login = async (req, res) => {
  const { email, password } = req.body;
  const fallo = (texto) => res.status(401).render('auth/login.ejs', { error: texto, email: email || '' });

  if (!email?.trim() || !password) {
    return fallo('Escribe tu email y tu contraseña');
  }

  try {
    const persona = await Persona.findOne({ where: { email: email.trim().toLowerCase() } });
    const valida = persona ? await bcrypt.compare(password, persona.password) : false;
    if (!valida) {
      return fallo('Email o contraseña incorrectos');
    }
    // Nueva sesión al iniciar (evita fijación de sesión)
    req.session.regenerate((err) => {
      if (err) return fallo('No se pudo iniciar la sesión. Intenta de nuevo');
      req.session.sesion = { id: persona.id, nombre: persona.nombre, email: persona.email };
      res.redirect('/personas');
    });
  } catch (err) {
    console.error(err);
    fallo('Ocurrió un error inesperado. Intenta de nuevo');
  }
};

// POST /logout
const logout = (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
};

export { registroForm, registro, loginForm, login, logout };
