import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Persona, Venta } from '../models/index.js';
import { mensajeError } from '../utils/errores.js';

// Nunca se envía el hash de la contraseña a las vistas
const SIN_PASSWORD = { exclude: ['password'] };

const listar = () =>
  Persona.findAll({
    attributes: SIN_PASSWORD,
    order: [['id', 'DESC']],
    include: [{ model: Venta, as: 'venta' }],
  });

// Lee y limpia los campos del formulario
const leerCampos = (body) => ({
  nombre: body.nombre?.trim() ?? '',
  apellido: body.apellido?.trim() ?? '',
  email: body.email?.trim().toLowerCase() ?? '',
  edad: body.edad ?? '',
});

const camposCompletos = ({ nombre, apellido, email, edad }) =>
  nombre && apellido && email && String(edad) !== '';

// LISTA
const inicio = async (req, res) => {
  const personas = await listar();
  res.render('personas/index.ejs', { personas });
};

// FORMULARIO CREAR
const verCrear = (req, res) => {
  res.render('personas/formulario.ejs', {
    persona: null,
    valores: {},
    action: '/personas/registrar',
    method: 'POST',
    error: null,
  });
};

// GUARDAR persona
const registro = async (req, res) => {
  const valores = leerCampos(req.body);
  const { password } = req.body;
  const fallo = (error, status = 400) =>
    res.status(status).render('personas/formulario.ejs', {
      persona: null,
      valores,
      action: '/personas/registrar',
      method: 'POST',
      error,
    });

  if (!camposCompletos(valores) || !password) {
    return fallo('Todos los campos son obligatorios');
  }
  if (password.length < 6) {
    return fallo('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    // Revisar antes de insertar: un INSERT fallido gasta un ID del auto_increment
    if (await Persona.findOne({ where: { email: valores.email } })) {
      return fallo('Ese email ya está registrado', 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await Persona.create({ ...valores, password: passwordHash });
    req.session.flash = { mensaje: 'Persona registrada con éxito' };
    res.redirect('/personas');
  } catch (err) {
    fallo(mensajeError(err).texto);
  }
};

// FORMULARIO EDITAR
const editar = async (req, res) => {
  const persona = await Persona.findByPk(req.params.id, { attributes: SIN_PASSWORD });
  if (!persona) {
    req.session.flash = { error: 'La persona no existe' };
    return res.redirect('/personas');
  }
  res.render('personas/formulario.ejs', {
    persona,
    valores: persona.toJSON(),
    action: `/personas/${persona.id}?_method=PUT`,
    method: 'POST',
    error: null,
  });
};

// ACTUALIZAR
const actualizar = async (req, res) => {
  const persona = await Persona.findByPk(req.params.id, { attributes: SIN_PASSWORD });
  if (!persona) {
    req.session.flash = { error: 'La persona no existe' };
    return res.redirect('/personas');
  }

  const valores = leerCampos(req.body);
  const { password } = req.body;
  const fallo = (error, status = 400) =>
    res.status(status).render('personas/formulario.ejs', {
      persona,
      valores: { ...valores, id: persona.id },
      action: `/personas/${persona.id}?_method=PUT`,
      method: 'POST',
      error,
    });

  if (!camposCompletos(valores)) {
    return fallo('Todos los campos son obligatorios');
  }
  // La contraseña es opcional al editar: vacía = no cambiarla
  if (password && password.length < 6) {
    return fallo('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    const repetido = await Persona.findOne({
      where: { email: valores.email, id: { [Op.ne]: persona.id } },
    });
    if (repetido) {
      return fallo('Ese email ya está registrado en otra persona', 409);
    }
    const cambios = { ...valores };
    if (password) cambios.password = await bcrypt.hash(password, 10);
    await persona.update(cambios);

    // Si se editó a sí mismo, refrescar los datos de la sesión
    if (req.session.sesion?.id === persona.id) {
      req.session.sesion = { id: persona.id, nombre: persona.nombre, email: persona.email };
    }
    req.session.flash = { mensaje: 'Persona actualizada con éxito' };
    res.redirect('/personas');
  } catch (err) {
    fallo(mensajeError(err).texto);
  }
};

// ELIMINAR
const eliminar = async (req, res) => {
  const borradas = await Persona.destroy({ where: { id: req.params.id } });

  // Si se eliminó a sí mismo, la sesión ya no tiene sentido
  if (borradas && req.session.sesion?.id === Number(req.params.id)) {
    return req.session.destroy(() => res.redirect('/login'));
  }
  req.session.flash = borradas
    ? { mensaje: 'Persona eliminada con éxito' }
    : { error: 'La persona no existe' };
  res.redirect('/personas');
};

export { inicio, verCrear, registro, editar, actualizar, eliminar };
