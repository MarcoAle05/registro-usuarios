import { Op } from 'sequelize';
import db from '../config/db.js';
import { Compra, Comprador, Lote, Especie, Tipo } from '../models/index.js';
import { hoyISO, limitesDia, fechaHora } from '../utils/fechas.js';

// Lote con sus especies y tipo, para mostrar qué se compró
const incluirLote = {
  model: Lote,
  as: 'lote',
  include: [{ model: Especie, as: 'especies', include: [{ model: Tipo, as: 'tipo', attributes: ['nombre'] }] }],
};
const incluirComprador = { model: Comprador, as: 'comprador' };

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const nombreComprador = (c) => `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno}`;

// Lotes que todavía no tienen compra (más, si se edita, el lote de esa compra)
const lotesDisponibles = async (incluirId) => {
  const lotes = await Lote.findAll({
    include: [
      { model: Compra, as: 'compra', attributes: ['id_cmp'], required: false },
      { model: Especie, as: 'especies', attributes: ['nombre'] },
    ],
    order: [['id_lte', 'DESC']],
  });
  return lotes
    .filter((l) => !l.compra || l.id_lte === incluirId)
    .map((l) => ({
      valor: l.id_lte,
      kilos: Number(l.kilos),
      salida: Number(l.precio_kilo_salida),
      texto:
        `Lote ${l.id_lte} · ${Number(l.kilos).toLocaleString('es-MX')} kg · ` +
        `${l.especies.map((e) => e.nombre).join(', ') || 'sin especies'} · ${fechaHora(l.fecha)}`,
    }));
};

const compradoresParaSelect = async () =>
  (await Comprador.findAll({ order: [['apellido_paterno', 'ASC'], ['nombre', 'ASC']] })).map((c) => ({
    valor: c.codigo_cpr,
    texto: `${nombreComprador(c)} (${c.codigo_cpr})`,
  }));

const renderFormulario = async (res, { compra, valores, error, status = 200 }) => {
  res.status(status).render('compras/formulario.ejs', {
    titulo: compra ? 'Editar compra' : 'Nueva compra',
    compra,
    valores,
    error,
    lotes: await lotesDisponibles(compra?.id_cmp),
    compradores: await compradoresParaSelect(),
  });
};

// GET /compras — últimas compras
export const lista = async (req, res) => {
  const compras = await Compra.findAll({
    include: [incluirLote, incluirComprador],
    order: [['fecha', 'DESC'], ['id_cmp', 'DESC']],
    limit: 100,
  });
  res.render('compras/index.ejs', { titulo: 'Compras', compras, nombreComprador });
};

// GET /compras/nuevo
export const nuevo = async (req, res) => {
  if ((await lotesDisponibles()).length === 0) {
    req.session.flash = { error: 'No hay lotes disponibles. Registra un lote antes de capturar una compra.' };
    return res.redirect('/lotes/nuevo');
  }
  if ((await Comprador.count()) === 0) {
    req.session.flash = { error: 'Primero registra al comprador.' };
    return res.redirect('/compradores/nuevo');
  }
  await renderFormulario(res, { compra: null, valores: { lote: req.query.lote || '' }, error: null });
};

// Lee y valida el formulario
const leer = (body) => {
  const str = (k) => (typeof body[k] === 'string' ? body[k].trim() : '');
  const valores = { lote: str('id_cmp'), comprador: str('codigo_cpr'), precio: str('precio_kilo_final') };
  const lote = Number(valores.lote);
  const comprador = Number(valores.comprador);
  const precio = Number(valores.precio.replace(',', '.'));
  let error = null;
  if (!Number.isInteger(lote) || lote < 1) error = 'Elige el lote';
  else if (!Number.isInteger(comprador) || comprador < 1) error = 'Elige al comprador';
  else if (!valores.precio || !Number.isFinite(precio) || precio <= 0) error = 'El precio final por kilo debe ser mayor a 0';
  else if (precio > 99999999) error = 'El precio final por kilo es demasiado grande';
  return { valores, lote, comprador, precio, error };
};

// POST /compras
export const crear = async (req, res) => {
  const { valores, lote, comprador, precio, error } = leer(req.body);
  const fallo = (e, status = 400) => renderFormulario(res, { compra: null, valores, error: e, status });
  if (error) return fallo(error);

  try {
    await db.transaction(async (t) => {
      const l = await Lote.findByPk(lote, { transaction: t, lock: t.LOCK.UPDATE });
      if (!l) throw Object.assign(new Error('Ese lote no existe'), { aviso: true });
      if (await Compra.findByPk(lote, { transaction: t })) {
        throw Object.assign(new Error('Ese lote ya fue comprado'), { aviso: true });
      }
      if (!(await Comprador.findByPk(comprador, { transaction: t }))) {
        throw Object.assign(new Error('Ese comprador no existe'), { aviso: true });
      }
      await Compra.create(
        {
          id_cmp: l.id_lte,
          codigo_cpr: comprador,
          precio_kilo_final: precio,
          precio_total: redondear(Number(l.kilos) * precio),
          fecha: new Date(),
        },
        { transaction: t }
      );
    });
    req.session.flash = { mensaje: 'Compra registrada con éxito' };
    res.redirect('/compras');
  } catch (err) {
    if (err.aviso) return fallo(err.message, 409);
    if (err.name === 'SequelizeUniqueConstraintError') return fallo('Ese lote ya fue comprado', 409);
    if (err.name === 'SequelizeValidationError') return fallo(err.errors.map((e) => e.message).join('. '));
    throw err;
  }
};

const buscar = (id) => Compra.findByPk(id, { include: [incluirLote, incluirComprador] });

// GET /compras/:id/editar
export const editar = async (req, res) => {
  const compra = await buscar(req.params.id);
  if (!compra) {
    req.session.flash = { error: 'La compra no existe' };
    return res.redirect('/compras');
  }
  await renderFormulario(res, {
    compra,
    valores: { lote: String(compra.id_cmp), comprador: String(compra.codigo_cpr), precio: String(compra.precio_kilo_final) },
    error: null,
  });
};

// PUT /compras/:id — el lote no cambia; sí el comprador y el precio (el total se recalcula)
export const actualizar = async (req, res) => {
  const compra = await buscar(req.params.id);
  if (!compra) {
    req.session.flash = { error: 'La compra no existe' };
    return res.redirect('/compras');
  }
  const { valores, comprador, precio, error } = leer({ ...req.body, id_cmp: String(compra.id_cmp) });
  const fallo = (e, status = 400) => renderFormulario(res, { compra, valores, error: e, status });
  if (error) return fallo(error);
  if (!(await Comprador.findByPk(comprador))) return fallo('Ese comprador no existe', 409);

  try {
    await compra.update({
      codigo_cpr: comprador,
      precio_kilo_final: precio,
      precio_total: redondear(Number(compra.lote.kilos) * precio),
    });
    req.session.flash = { mensaje: 'Compra actualizada con éxito' };
    res.redirect('/compras');
  } catch (err) {
    if (err.name === 'SequelizeValidationError') return fallo(err.errors.map((e) => e.message).join('. '));
    throw err;
  }
};

// DELETE /compras/:id (solo administrador): el lote vuelve a quedar disponible
export const eliminar = async (req, res) => {
  const compra = await Compra.findByPk(req.params.id);
  if (!compra) {
    req.session.flash = { error: 'La compra no existe' };
    return res.redirect('/compras');
  }
  await compra.destroy();
  req.session.flash = { mensaje: 'Compra eliminada. El lote vuelve a estar disponible.' };
  res.redirect('/compras');
};

// GET /reporte?fecha=YYYY-MM-DD — informe diario de compras
export const reporte = async (req, res) => {
  const pedida = typeof req.query.fecha === 'string' ? req.query.fecha : '';
  const dia = limitesDia(pedida);
  const fecha = dia ? pedida : hoyISO();
  const { ini, fin } = dia ?? limitesDia(fecha);

  const compras = await Compra.findAll({
    where: { fecha: { [Op.gte]: ini, [Op.lt]: fin } },
    include: [incluirLote, incluirComprador],
    order: [['fecha', 'ASC'], ['id_cmp', 'ASC']],
  });

  const totales = compras.reduce(
    (t, c) => ({
      compras: t.compras + 1,
      kilos: t.kilos + Number(c.lote.kilos),
      cajas: t.cajas + c.lote.numero_cajas,
      importe: t.importe + Number(c.precio_total),
    }),
    { compras: 0, kilos: 0, cajas: 0, importe: 0 }
  );
  totales.importe = redondear(totales.importe);

  // Resumen por comprador
  const porComprador = new Map();
  for (const c of compras) {
    const acum = porComprador.get(c.codigo_cpr) ?? { nombre: nombreComprador(c.comprador), compras: 0, kilos: 0, importe: 0 };
    acum.compras += 1;
    acum.kilos += Number(c.lote.kilos);
    acum.importe = redondear(acum.importe + Number(c.precio_total));
    porComprador.set(c.codigo_cpr, acum);
  }

  res.render('compras/reporte.ejs', {
    titulo: `Reporte del ${fecha}`,
    ancho: 'amplio',
    fecha,
    hoy: hoyISO(),
    fechaInvalida: Boolean(pedida) && !dia,
    compras,
    totales,
    resumen: [...porComprador.values()].sort((a, b) => b.importe - a.importe),
    nombreComprador,
  });
};

// GET / — panel de inicio con el resumen del día
export const panel = async (req, res) => {
  const hoy = hoyISO();
  const { ini, fin } = limitesDia(hoy);
  const [comprasHoy, lotes, compradores, especies, comprados] = await Promise.all([
    Compra.findAll({ where: { fecha: { [Op.gte]: ini, [Op.lt]: fin } }, attributes: ['precio_total'] }),
    Lote.count(),
    Comprador.count(),
    Especie.count(),
    Compra.count(),
  ]);
  res.render('panel.ejs', {
    titulo: 'Inicio',
    hoy,
    resumen: {
      comprasHoy: comprasHoy.length,
      importeHoy: redondear(comprasHoy.reduce((s, c) => s + Number(c.precio_total), 0)),
      disponibles: lotes - comprados,
      compradores,
      especies,
    },
  });
};
