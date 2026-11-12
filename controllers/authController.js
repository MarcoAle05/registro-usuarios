import bcrypt from 'bcryptjs';
import { Persona } from '../models/index.js';
import { mensajeError } from '../utils/errores.js';

// Hash falso: así el login tarda lo mismo exista o no el email
const HASH_FALSO = bcrypt.hashSync('contraseña-que-nadie-usa', 10);

// El registro público solo existe para crear la primera cuenta (el administrador).
// Después, el acceso es solo para el personal que un administrador dé de alta.
const sinUsuarios = async () => (await Persona.count()) === 0;

const registroCerrado = (req, res) => {
  req.session.flash = { error: 'El registro está cerrado. Pide a un administrador que te dé de alta.' };
  res.redirect('/login');
};

// GET /registro
const registroForm = async (req, res) => {
  if (!(await sinUsuarios())) return registroCerrado(req, res);
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
    if (!(await sinUsuarios())) return registroCerrado(req, res);
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
      rol: 'admin',
    });
    req.session.flash = {
      mensaje: 'Cuenta de administrador creada. Ahora inicia sesión.',
    };
    res.redirect('/login');
  } catch (err) {
    fallo(mensajeError(err).texto);
  }
};

// GET /login
const loginForm = async (req, res) => {
  res.render('auth/login.ejs', { error: null, email: '', primerUso: await sinUsuarios() });
};

// POST /login
const login = async (req, res) => {
  const { email, password } = req.body;
  const fallo = (texto) => res.status(401).render('auth/login.ejs', { error: texto, email: email || '', primerUso: false });

  if (!email?.trim() || !password) {
    return fallo('Escribe tu email y tu contraseña');
  }

  try {
    const persona = await Persona.findOne({ where: { email: email.trim().toLowerCase() } });
    const hash = persona?.password?.length === 60 ? persona.password : HASH_FALSO;
    const coincide = await bcrypt.compare(password, hash);
    if (!persona || !coincide) {
      return fallo('Email o contraseña incorrectos');
    }
    // Nueva sesión al iniciar (evita fijación de sesión)
    req.session.regenerate((err) => {
      if (err) return fallo('No se pudo iniciar la sesión. Intenta de nuevo');
      req.session.sesion = { id: persona.id };
      res.redirect('/');
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
