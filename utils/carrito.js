import { Libro } from '../models/index.js';

export const MAX_POR_LIBRO = 10;
export const MAX_LINEAS = 20;

// El carrito vive en la sesión como { [libroId]: cantidad }. Se vuelve a validar
// siempre que se lee: la sesión es la única fuente y nada del cliente se acepta tal cual.
export const leerCarrito = (req) => {
  const crudo = req.session.carrito;
  const limpio = {};
  if (crudo && typeof crudo === 'object') {
    for (const [id, cantidad] of Object.entries(crudo)) {
      if (/^\d{1,10}$/.test(id) && Number.isInteger(cantidad) && cantidad >= 1) {
        limpio[id] = Math.min(cantidad, MAX_POR_LIBRO);
      }
    }
  }
  return limpio;
};

export const guardarCarrito = (req, carrito) => {
  if (Object.keys(carrito).length > 0) req.session.carrito = carrito;
  else delete req.session.carrito;
};

export const cantidadTotal = (carrito) => Object.values(carrito).reduce((a, b) => a + b, 0);

// Los importes se calculan en centavos enteros para no arrastrar errores de decimales.
// Los precios se leen de la base: el cliente nunca decide cuánto cuesta algo.
export const detalleCarrito = async (carrito) => {
  const ids = Object.keys(carrito).map(Number);
  const libros = ids.length ? await Libro.findAll({ where: { id: ids } }) : [];
  const porId = new Map(libros.map((l) => [l.id, l]));

  const lineas = [];
  const faltantes = [];
  for (const id of ids) {
    const libro = porId.get(id);
    if (!libro) {
      faltantes.push(id);
      continue;
    }
    const cantidad = carrito[id];
    const unitarioCent = Math.round(Number(libro.precio) * 100);
    lineas.push({ libro, cantidad, unitarioCent, subtotalCent: unitarioCent * cantidad });
  }
  return {
    lineas,
    faltantes,
    articulos: lineas.reduce((n, l) => n + l.cantidad, 0),
    totalCent: lineas.reduce((n, l) => n + l.subtotalCent, 0),
  };
};

// Pone en locals el número de artículos para la barra superior
export const contadorCarrito = (req, res, next) => {
  res.locals.carritoCantidad = cantidadTotal(leerCarrito(req));
  next();
};
