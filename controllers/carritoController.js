import db from '../config/db.js';
import { Libro, Venta } from '../models/index.js';
import {
  MAX_LINEAS,
  MAX_POR_LIBRO,
  detalleCarrito,
  guardarCarrito,
  leerCarrito,
} from '../utils/carrito.js';
import { mensajeError } from '../utils/errores.js';

// Evita que un doble clic (o dos pestañas) registre la misma compra dos veces
const comprasEnCurso = new Set();

const aEntero = (valor) => (/^\d{1,10}$/.test(String(valor ?? '').trim()) ? Number(valor) : NaN);
const volver = (res, req, datos, destino = '/carrito') => {
  req.session.flash = datos;
  res.redirect(destino);
};

// GET /carrito
const ver = async (req, res) => {
  const carrito = leerCarrito(req);
  const detalle = await detalleCarrito(carrito);

  // Libros que ya no existen se quitan y se avisa
  if (detalle.faltantes.length > 0) {
    detalle.faltantes.forEach((id) => delete carrito[id]);
    guardarCarrito(req, carrito);
    res.locals.flash = { ...res.locals.flash, error: 'Un libro de tu carrito ya no está disponible y se quitó' };
  }
  res.render('carrito/index.ejs', { ...detalle, maxPorLibro: MAX_POR_LIBRO });
};

// POST /carrito/agregar
const agregar = async (req, res) => {
  const libroId = aEntero(req.body.libroId);
  const cantidad = req.body.cantidad === undefined ? 1 : aEntero(req.body.cantidad);
  const destino = req.body.volver === 'carrito' ? '/carrito' : '/';

  if (!Number.isInteger(libroId) || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_POR_LIBRO) {
    return volver(res, req, { error: `Elige una cantidad de 1 a ${MAX_POR_LIBRO}` }, destino);
  }
  const libro = await Libro.findByPk(libroId, { attributes: ['id', 'titulo'] });
  if (!libro) return volver(res, req, { error: 'Ese libro ya no está disponible' }, destino);

  const carrito = leerCarrito(req);
  const actual = carrito[libro.id] ?? 0;
  if (!actual && Object.keys(carrito).length >= MAX_LINEAS) {
    return volver(res, req, { error: `Tu carrito admite hasta ${MAX_LINEAS} libros distintos` }, destino);
  }
  if (actual >= MAX_POR_LIBRO) {
    return volver(res, req, { error: `Ya tienes el máximo (${MAX_POR_LIBRO}) de «${libro.titulo}»` }, destino);
  }
  carrito[libro.id] = Math.min(actual + cantidad, MAX_POR_LIBRO);
  guardarCarrito(req, carrito);
  volver(res, req, { mensaje: `«${libro.titulo}» agregado al carrito` }, destino);
};

// POST /carrito/actualizar (cantidad 0 = quitar)
const actualizar = async (req, res) => {
  const libroId = aEntero(req.body.libroId);
  const cantidad = aEntero(req.body.cantidad);
  const carrito = leerCarrito(req);

  if (!Number.isInteger(libroId) || !(libroId in carrito)) {
    return volver(res, req, { error: 'Ese libro no está en tu carrito' });
  }
  if (!Number.isInteger(cantidad) || cantidad < 0 || cantidad > MAX_POR_LIBRO) {
    return volver(res, req, { error: `La cantidad debe ser un entero de 0 a ${MAX_POR_LIBRO}` });
  }
  if (cantidad === 0) delete carrito[libroId];
  else carrito[libroId] = cantidad;
  guardarCarrito(req, carrito);
  volver(res, req, { mensaje: cantidad === 0 ? 'Libro quitado del carrito' : 'Cantidad actualizada' });
};

// POST /carrito/quitar
const quitar = (req, res) => {
  const libroId = aEntero(req.body.libroId);
  const carrito = leerCarrito(req);
  if (!(libroId in carrito)) return volver(res, req, { error: 'Ese libro no está en tu carrito' });
  delete carrito[libroId];
  guardarCarrito(req, carrito);
  volver(res, req, { mensaje: 'Libro quitado del carrito' });
};

// POST /carrito/vaciar
const vaciar = (req, res) => {
  guardarCarrito(req, {});
  volver(res, req, { mensaje: 'Carrito vaciado' });
};

// POST /carrito/comprar
const comprar = async (req, res) => {
  // Sin sesión: se guarda a dónde volver y se manda a iniciar sesión (el carrito se conserva)
  if (!req.usuario) {
    req.session.volverA = '/carrito';
    return volver(res, req, { info: 'Inicia sesión o crea una cuenta para completar tu compra' }, '/login');
  }
  if (comprasEnCurso.has(req.usuario.id)) {
    return volver(res, req, { error: 'Tu compra ya se está procesando' });
  }
  comprasEnCurso.add(req.usuario.id);

  try {
    const carrito = leerCarrito(req);
    if (Object.keys(carrito).length === 0) {
      return volver(res, req, { error: 'Tu carrito está vacío' }, '/');
    }

    const detalle = await detalleCarrito(carrito);
    if (detalle.faltantes.length > 0) {
      detalle.faltantes.forEach((id) => delete carrito[id]);
      guardarCarrito(req, carrito);
      return volver(res, req, { error: 'Un libro de tu carrito ya no está disponible. Revisa el carrito antes de comprar' });
    }
    // El total que el usuario vio debe ser el que se cobra: si un precio cambió, se vuelve a confirmar
    if (aEntero(req.body.totalCent) !== detalle.totalCent) {
      return volver(res, req, { error: 'Los precios cambiaron. Revisa el total y confirma de nuevo' });
    }

    await db.transaction(async (transaction) => {
      await Venta.bulkCreate(
        detalle.lineas.map((l) => ({
          personaId: req.usuario.id,
          libroId: l.libro.id,
          cantidad: l.cantidad,
          precioUnitario: (l.unitarioCent / 100).toFixed(2),
        })),
        { transaction }
      );
    });

    guardarCarrito(req, {});
    req.session.compra = {
      fecha: new Date().toISOString(),
      totalCent: detalle.totalCent,
      lineas: detalle.lineas.map((l) => ({
        titulo: l.libro.titulo,
        cantidad: l.cantidad,
        unitarioCent: l.unitarioCent,
        subtotalCent: l.subtotalCent,
      })),
    };
    res.redirect('/carrito/confirmacion');
  } catch (err) {
    volver(res, req, { error: mensajeError(err).texto });
  } finally {
    comprasEnCurso.delete(req.usuario.id);
  }
};

// GET /carrito/confirmacion
const confirmacion = (req, res) => {
  const compra = req.session.compra;
  if (!req.usuario || !compra) return res.redirect('/');
  res.render('carrito/confirmacion.ejs', { compra, fecha: new Date(compra.fecha) });
};

export { ver, agregar, actualizar, quitar, vaciar, comprar, confirmacion };
