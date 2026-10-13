import bcrypt from 'bcryptjs';
import { Op, Sequelize } from 'sequelize';
import db from '../config/db.js';
import { Libro, Persona, Venta } from '../models/index.js';
import { mensajeError } from '../utils/errores.js';

// Nunca se envía el hash de la contraseña a las vistas
const SIN_PASSWORD = { exclude: ['password'] };

const POR_PAGINA = 10;

// Lee y limpia los campos del formulario
const leerCampos = (body) => ({
  nombre: body.nombre?.trim() ?? '',
  apellido: body.apellido?.trim() ?? '',
  email: body.email?.trim().toLowerCase() ?? '',
  edad: body.edad ?? '',
});

const ROLES = ['admin', 'usuario'];
const esAdmin = (req) => req.usuario.rol === 'admin';

// Evita dejar el sistema sin ningún administrador
const esUnicoAdmin = async (persona) =>
  persona.rol === 'admin' && (await Persona.count({ where: { rol: 'admin' } })) <= 1;

const camposCompletos = ({ nombre, apellido, email, edad }) =>
  nombre && apellido && email && String(edad) !== '';

// LISTA. Un usuario normal solo ve su propia cuenta; el administrador ve a todos,
// con búsqueda y de 10 en 10 ("Mostrar más").
const inicio = async (req, res) => {
  const admin = esAdmin(req);
  const q = admin && typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const pedido = Number.parseInt(req.query.mostrar, 10);
  const mostrar = admin && pedido > 10 ? Math.min(Math.ceil(pedido / POR_PAGINA) * POR_PAGINA, 1000) : POR_PAGINA;

  // Los comodines de LIKE (% _ \) que escriba el usuario se toman literalmente
  const literal = q.replace(/[\\%_]/g, '\\$&');
  const patron = `%${literal}%`;
  let where = { id: req.usuario.id };
  if (admin) {
    where = q
      ? { [Op.or]: ['nombre', 'apellido', 'email'].map((c) => ({ [c]: { [Op.like]: patron } })) }
      : {};
  }

  // Con búsqueda, la coincidencia más exacta va en la primera fila
  const orden = [['id', 'DESC']];
  if (q) {
    const exacto = db.escape(q);
    const prefijo = db.escape(`${literal}%`);
    orden.unshift([
      Sequelize.literal(`CASE
        WHEN email = ${exacto} THEN 0
        WHEN nombre = ${exacto} OR apellido = ${exacto} OR CONCAT(nombre, ' ', apellido) = ${exacto} THEN 1
        WHEN email LIKE ${prefijo} OR nombre LIKE ${prefijo} OR apellido LIKE ${prefijo} THEN 2
        ELSE 3 END`),
      'ASC',
    ]);
  }

  const total = await Persona.count({ where });
  const personas = await Persona.findAll({
    where,
    attributes: SIN_PASSWORD,
    // Ventas de cada persona (alias "venta"); solo se necesita contarlas
    include: [{ model: Venta, as: 'venta', attributes: ['id', 'personaId'], separate: true }],
    order: orden,
    limit: mostrar,
  });

  // Libros y ventas de la página principal: un usuario solo ve sus propias ventas
  const [libros, ventas, todasPersonas] = await Promise.all([
    Libro.findAll({ order: [['titulo', 'ASC']] }),
    Venta.findAll({
      where: esAdmin(req) ? {} : { personaId: req.usuario.id },
      include: [
        { model: Persona, as: 'persona', attributes: ['id', 'nombre', 'apellido'] },
        { model: Libro, as: 'libro', attributes: ['id', 'titulo', 'precio'] },
      ],
      order: [['id', 'DESC']],
      limit: 10,
    }),
    esAdmin(req)
      ? Persona.findAll({ attributes: ['id', 'nombre', 'apellido'], order: [['nombre', 'ASC']] })
      : [],
  ]);
  res.render('personas/index.ejs', { personas, total, q, mostrar, paso: POR_PAGINA, libros, ventas, todasPersonas });
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
    const rol = ROLES.includes(req.body.rol) ? req.body.rol : 'usuario';
    await Persona.create({ ...valores, password: passwordHash, rol });
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

    // Solo un admin puede cambiar roles (el rol del formulario se ignora si no)
    if (esAdmin(req) && ROLES.includes(req.body.rol)) {
      if (req.body.rol !== persona.rol && (await esUnicoAdmin(persona))) {
        return fallo('No puedes quitar el rol al único administrador');
      }
      cambios.rol = req.body.rol;
    }
    await persona.update(cambios);
    req.session.flash = { mensaje: 'Persona actualizada con éxito' };
    res.redirect('/personas');
  } catch (err) {
    fallo(mensajeError(err).texto);
  }
};

// ELIMINAR
const eliminar = async (req, res) => {
  const persona = await Persona.findByPk(req.params.id, { attributes: ['id', 'rol'] });
  if (!persona) {
    req.session.flash = { error: 'La persona no existe' };
    return res.redirect('/personas');
  }
  if (await esUnicoAdmin(persona)) {
    req.session.flash = { error: 'No puedes eliminar al único administrador' };
    return res.redirect('/personas');
  }
  try {
    await persona.destroy();
  } catch (err) {
    if (err.name !== 'SequelizeForeignKeyConstraintError') throw err;
    req.session.flash = { error: 'No se puede eliminar: la persona tiene ventas registradas' };
    return res.redirect('/personas');
  }

  // Si se eliminó a sí mismo, la sesión ya no tiene sentido
  if (req.usuario.id === persona.id) {
    return req.session.destroy(() => res.redirect('/login'));
  }
  req.session.flash = { mensaje: 'Persona eliminada con éxito' };
  res.redirect('/personas');
};

export { inicio, verCrear, registro, editar, actualizar, eliminar };
