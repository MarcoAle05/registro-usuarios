import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

const registro_usuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios (nombre, email, password)',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ mensaje: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({ nombre, email, password: passwordHash });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        fechaRegistro: nuevoUsuario.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const usuarios_lista = async (req, res) => {
  const usuarios = await Usuario.findAll({
    attributes: ['id', 'nombre', 'email', ['createdAt', 'fechaRegistro']],
  });
  res.json(usuarios);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const usuario = email ? await Usuario.findOne({ where: { email } }) : null;
  if (!usuario || !password) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }
  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    return res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }
  res.json({
    mensaje: 'Login exitoso',
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  });
};

export { registro_usuario, usuarios_lista, login };
