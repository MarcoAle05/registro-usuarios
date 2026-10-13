import { Libro, Persona, Venta } from '../models/index.js';
import { MAX_POR_LIBRO, leerCarrito } from '../utils/carrito.js';
import { mensajeError } from '../utils/errores.js';

const volver = (req, res, datos) => {
  req.session.flash = datos;
  res.redirect('/personas#ventas');
};

// LIBRO: crear
const crearLibro = async (req, res) => {
  const titulo = req.body.titulo?.trim() ?? '';
  const autor = req.body.autor?.trim() ?? '';
  const precio = Number(String(req.body.precio ?? '').replace(',', '.'));

  if (!titulo || !autor || String(req.body.precio ?? '').trim() === '') {
    return volver(req, res, { error: 'Libro: título, autor y precio son obligatorios' });
  }
  if (titulo.length > 255 || autor.length > 255) {
    return volver(req, res, { error: 'Libro: título y autor admiten hasta 255 caracteres' });
  }
  if (!Number.isFinite(precio) || precio <= 0 || precio > 99999999) {
    return volver(req, res, { error: 'Libro: el precio debe ser un número mayor que 0' });
  }

  try {
    await Libro.create({ titulo, autor, precio: precio.toFixed(2) });
    volver(req, res, { mensaje: 'Libro agregado con éxito' });
  } catch (err) {
    volver(req, res, { error: mensajeError(err).texto });
  }
};

// VENTA: registrar
const crearVenta = async (req, res) => {
  const personaId = Number.parseInt(req.body.personaId, 10);
  const libroId = Number.parseInt(req.body.libroId, 10);
  const cantidad = Number.parseInt(req.body.cantidad, 10);

  if (!Number.isInteger(personaId) || !Number.isInteger(libroId)) {
    return volver(req, res, { error: 'Venta: elige una persona y un libro' });
  }
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) {
    return volver(req, res, { error: 'Venta: la cantidad debe ser un entero de 1 a 1000' });
  }

  try {
    const [persona, libro] = await Promise.all([
      Persona.findByPk(personaId, { attributes: ['id'] }),
      Libro.findByPk(libroId, { attributes: ['id', 'precio'] }),
    ]);
    if (!persona || !libro) {
      return volver(req, res, { error: 'Venta: la persona o el libro ya no existe' });
    }
    await Venta.create({ personaId, libroId, cantidad, precioUnitario: libro.precio });
    volver(req, res, { mensaje: 'Venta registrada con éxito' });
  } catch (err) {
    volver(req, res, { error: mensajeError(err).texto });
  }
};

// PÁGINA PRINCIPAL pública: catálogo de libros
const catalogo = async (req, res) => {
  const libros = await Libro.findAll({ order: [['titulo', 'ASC']] });
  res.render('inicio.ejs', { libros, enCarrito: leerCarrito(req), maxPorLibro: MAX_POR_LIBRO });
};

export { crearLibro, crearVenta, catalogo };
