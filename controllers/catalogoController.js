import { Tipo, Comprador, Lote, Especie, Compra } from '../models/index.js';
import { aInputDT, deInputDT, fechaHora } from '../utils/fechas.js';

// Los cuatro catálogos de la Lonja comparten las mismas pantallas (lista, alta,
// edición y baja). Cada uno solo declara sus campos y columnas.
//
// escritura: 'todos' → cualquier usuario con sesión captura y edita
//            'admin' → solo el administrador
// Eliminar siempre es exclusivo del administrador.

const lotesParaSelect = async () => {
  const lotes = await Lote.findAll({ order: [['id_lte', 'DESC']] });
  return lotes.map((l) => ({
    valor: l.id_lte,
    texto: `Lote ${l.id_lte} · ${Number(l.kilos).toLocaleString('es-MX')} kg · ${fechaHora(l.fecha)}`,
  }));
};

const tiposParaSelect = async () => {
  const tipos = await Tipo.findAll({ order: [['nombre', 'ASC']] });
  return tipos.map((t) => ({ valor: t.id_tpo, texto: t.nombre }));
};

// Ruta pública dentro de /public (las imágenes se guardan en public/bootstrap/img)
const RUTA_IMAGEN = /^\/[A-Za-z0-9_\-./]+$/;

export const CATALOGOS = {
  tipos: {
    modelo: Tipo,
    pk: 'id_tpo',
    titulo: 'Tipos de especie',
    singular: 'tipo',
    nuevo: 'Nuevo tipo',
    ayuda: 'Clasificación de las especies (por ejemplo: pescado, marisco, molusco).',
    escritura: 'admin',
    orden: [['nombre', 'ASC']],
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', max: 30, requerido: true }],
    columnas: [
      { etiqueta: 'Código', valor: (f) => f.id_tpo },
      { etiqueta: 'Nombre', valor: (f) => f.nombre },
    ],
    bloqueoEliminar: 'No se puede eliminar: hay especies de este tipo.',
  },

  compradores: {
    modelo: Comprador,
    pk: 'codigo_cpr',
    titulo: 'Compradores',
    singular: 'comprador',
    nuevo: 'Nuevo comprador',
    ayuda: 'Personas que compran lotes en la Lonja.',
    escritura: 'todos',
    orden: [['apellido_paterno', 'ASC'], ['nombre', 'ASC']],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', max: 15, requerido: true, col: 4 },
      { nombre: 'apellido_paterno', etiqueta: 'Apellido paterno', tipo: 'text', max: 15, requerido: true, col: 4 },
      { nombre: 'apellido_materno', etiqueta: 'Apellido materno', tipo: 'text', max: 15, requerido: true, col: 4 },
      { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'text', max: 200, requerido: true },
      { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', max: 80, requerido: true, minusculas: true },
    ],
    columnas: [
      { etiqueta: 'Código', valor: (f) => f.codigo_cpr },
      { etiqueta: 'Nombre', valor: (f) => `${f.nombre} ${f.apellido_paterno} ${f.apellido_materno}` },
      { etiqueta: 'Correo', valor: (f) => f.correo },
      { etiqueta: 'Dirección', valor: (f) => f.direccion },
    ],
    bloqueoEliminar: 'No se puede eliminar: el comprador tiene compras registradas.',
  },

  lotes: {
    modelo: Lote,
    pk: 'id_lte',
    titulo: 'Lotes',
    singular: 'lote',
    nuevo: 'Nuevo lote',
    ayuda: 'Producto que llega a la Lonja. Después de crear el lote, agrega sus especies y regístralo en una compra.',
    escritura: 'todos',
    orden: [['id_lte', 'DESC']],
    incluir: () => [
      { model: Especie, as: 'especies', attributes: ['id_epe', 'nombre'] },
      { model: Compra, as: 'compra', attributes: ['id_cmp'] },
    ],
    campos: [
      { nombre: 'kilos', etiqueta: 'Kilos', tipo: 'number', paso: '0.01', min: '0.01', requerido: true, col: 4 },
      { nombre: 'numero_cajas', etiqueta: 'Número de cajas', tipo: 'number', paso: '1', min: '1', requerido: true, col: 4 },
      { nombre: 'precio_kilo_salida', etiqueta: 'Precio de salida por kilo', tipo: 'number', paso: '0.01', min: '0.01', requerido: true, col: 4 },
      {
        nombre: 'fecha', etiqueta: 'Fecha y hora de llegada', tipo: 'datetime', requerido: false,
        ayuda: 'Si la dejas vacía se usa la fecha y hora actuales.',
      },
    ],
    columnas: [
      { etiqueta: 'Lote', valor: (f) => f.id_lte },
      { etiqueta: 'Llegada', valor: (f) => fechaHora(f.fecha), clase: 'fecha' },
      { etiqueta: 'Especies', valor: (f) => f.especies.map((e) => e.nombre).join(', ') || '—' },
      { etiqueta: 'Kilos', valor: (f) => Number(f.kilos).toLocaleString('es-MX', { minimumFractionDigits: 2 }), clase: 'num' },
      { etiqueta: 'Cajas', valor: (f) => f.numero_cajas, clase: 'num' },
      { etiqueta: 'Precio salida/kg', valor: (f) => Number(f.precio_kilo_salida).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), clase: 'num' },
      { etiqueta: 'Estado', valor: (f) => (f.compra ? 'Comprado' : 'Disponible'), insignia: true },
    ],
    // Un lote ya comprado no se modifica: cambiaría el total de la compra
    puedeEditar: (f) => (f.compra ? 'Este lote ya fue comprado y no se puede modificar.' : null),
    bloqueoEliminar: 'No se puede eliminar: el lote tiene especies o una compra registrada.',
  },

  especies: {
    modelo: Especie,
    pk: 'id_epe',
    titulo: 'Especies',
    singular: 'especie',
    nuevo: 'Nueva especie',
    ayuda: 'Cada especie pertenece a un lote y a un tipo.',
    escritura: 'todos',
    orden: [['id_epe', 'DESC']],
    incluir: () => [
      { model: Tipo, as: 'tipo', attributes: ['nombre'] },
      { model: Lote, as: 'lote', attributes: ['id_lte'] },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', max: 25, requerido: true },
      { nombre: 'id_tpo', etiqueta: 'Tipo', tipo: 'select', requerido: true, opciones: tiposParaSelect, col: 6 },
      { nombre: 'id_lte', etiqueta: 'Lote', tipo: 'select', requerido: true, opciones: lotesParaSelect, col: 6 },
      {
        nombre: 'imagen', etiqueta: 'Imagen (ruta)', tipo: 'text', max: 100, requerido: false, patron: RUTA_IMAGEN,
        error: 'La imagen debe ser una ruta como /bootstrap/img/pulpo.jpg',
        ayuda: 'Opcional. Guarda el archivo en public/bootstrap/img y escribe su ruta, por ejemplo /bootstrap/img/pulpo.jpg.',
      },
    ],
    columnas: [
      { etiqueta: 'Imagen', imagen: (f) => f.imagen },
      { etiqueta: 'Código', valor: (f) => f.id_epe },
      { etiqueta: 'Nombre', valor: (f) => f.nombre },
      { etiqueta: 'Tipo', valor: (f) => f.tipo?.nombre ?? '—' },
      { etiqueta: 'Lote', valor: (f) => f.id_lte },
    ],
  },
};

// Número del formulario → valor listo para guardar (null si no es un número)
const aNumero = (texto) => {
  const n = Number(String(texto).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Lee el cuerpo del formulario según los campos del catálogo.
// Devuelve { datos, valores, error }: los valores en texto sirven para volver a pintar el formulario.
const leerCampos = (cat, body) => {
  const datos = {};
  const valores = {};
  for (const c of cat.campos) {
    let texto = typeof body[c.nombre] === 'string' ? body[c.nombre].trim() : '';
    if (c.minusculas) texto = texto.toLowerCase();
    valores[c.nombre] = texto;

    if (texto === '') {
      if (c.requerido) return { valores, error: `${c.etiqueta}: es obligatorio` };
      datos[c.nombre] = null;
      continue;
    }
    if (c.max && texto.length > c.max) return { valores, error: `${c.etiqueta}: máximo ${c.max} caracteres` };
    if (c.patron && !c.patron.test(texto)) return { valores, error: c.error || `${c.etiqueta}: valor no válido` };

    if (c.tipo === 'number' || c.tipo === 'select') {
      const n = aNumero(texto);
      if (n === null) return { valores, error: `${c.etiqueta}: debe ser un número` };
      if (c.tipo === 'select' && !Number.isInteger(n)) return { valores, error: `${c.etiqueta}: opción no válida` };
      if (c.min && n < Number(c.min)) return { valores, error: `${c.etiqueta}: debe ser mayor o igual a ${c.min}` };
      if (c.paso === '1' && !Number.isInteger(n)) return { valores, error: `${c.etiqueta}: debe ser un número entero` };
      datos[c.nombre] = n;
    } else if (c.tipo === 'datetime') {
      const d = deInputDT(texto);
      if (!d) return { valores, error: `${c.etiqueta}: fecha no válida` };
      datos[c.nombre] = d;
    } else {
      datos[c.nombre] = texto;
    }
  }
  return { datos, valores };
};

// Resuelve las opciones de los campos <select> (cargadas de la base)
const camposConOpciones = async (cat) =>
  Promise.all(cat.campos.map(async (c) => (c.opciones ? { ...c, lista: await c.opciones() } : c)));

// Verifica que las llaves foráneas elegidas existan
const validarRelaciones = async (cat, datos) => {
  if (cat === CATALOGOS.especies) {
    if (!(await Tipo.findByPk(datos.id_tpo))) return 'Tipo: elige una opción válida';
    if (!(await Lote.findByPk(datos.id_lte))) return 'Lote: elige una opción válida';
  }
  return null;
};

const mensajeSequelize = (err) => {
  if (err.name === 'SequelizeUniqueConstraintError') return 'Ya existe un registro con ese valor (por ejemplo, el correo)';
  if (err.name === 'SequelizeValidationError') return err.errors.map((e) => e.message).join('. ');
  return null;
};

const renderFormulario = async (res, cat, clave, { fila, valores, error, status = 200 }) => {
  res.status(status).render('catalogo/formulario.ejs', {
    titulo: fila ? `Editar ${cat.singular}` : cat.nuevo,
    cat,
    clave,
    fila,
    campos: await camposConOpciones(cat),
    valores,
    error,
  });
};

// Valores del registro tal como se muestran en el formulario
const valoresDeFila = (cat, fila) => {
  const v = {};
  for (const c of cat.campos) {
    const dato = fila[c.nombre];
    v[c.nombre] = dato == null ? '' : c.tipo === 'datetime' ? aInputDT(dato) : String(dato);
  }
  return v;
};

const registrarAviso = (req, tipo, texto) => {
  req.session.flash = { [tipo]: texto };
};

// ---- Fábrica de controladores para un catálogo ----
export const controladorCatalogo = (clave) => {
  const cat = CATALOGOS[clave];
  const base = `/${clave}`;

  const buscar = (id) => cat.modelo.findByPk(id, cat.incluir ? { include: cat.incluir() } : {});

  const lista = async (req, res) => {
    const filas = await cat.modelo.findAll({
      include: cat.incluir ? cat.incluir() : [],
      order: cat.orden,
      limit: 500,
    });
    res.render('catalogo/index.ejs', { titulo: cat.titulo, cat, clave, filas });
  };

  const nuevo = async (req, res) => {
    if (clave === 'especies' && (await Lote.count()) === 0) {
      registrarAviso(req, 'error', 'Primero registra un lote para poder agregarle especies.');
      return res.redirect('/lotes/nuevo');
    }
    if (clave === 'especies' && (await Tipo.count()) === 0) {
      registrarAviso(req, 'error', 'Primero registra un tipo de especie.');
      return res.redirect(req.usuario.rol === 'admin' ? '/tipos/nuevo' : '/tipos');
    }
    await renderFormulario(res, cat, clave, { fila: null, valores: {}, error: null });
  };

  const crear = async (req, res) => {
    const { datos, valores, error } = leerCampos(cat, req.body);
    const fallo = (e, status = 400) => renderFormulario(res, cat, clave, { fila: null, valores, error: e, status });
    if (error) return fallo(error);
    try {
      const rel = await validarRelaciones(cat, datos);
      if (rel) return fallo(rel);
      if (datos.fecha === null) delete datos.fecha; // usa la fecha actual por defecto
      await cat.modelo.create(datos);
      registrarAviso(req, 'mensaje', 'Registro guardado con éxito');
      res.redirect(base);
    } catch (err) {
      const texto = mensajeSequelize(err);
      if (!texto) throw err;
      fallo(texto, err.name === 'SequelizeUniqueConstraintError' ? 409 : 400);
    }
  };

  const editar = async (req, res) => {
    const fila = await buscar(req.params.id);
    if (!fila) {
      registrarAviso(req, 'error', 'El registro no existe');
      return res.redirect(base);
    }
    const motivo = cat.puedeEditar?.(fila);
    if (motivo) {
      registrarAviso(req, 'error', motivo);
      return res.redirect(base);
    }
    await renderFormulario(res, cat, clave, { fila, valores: valoresDeFila(cat, fila), error: null });
  };

  const actualizar = async (req, res) => {
    const fila = await buscar(req.params.id);
    if (!fila) {
      registrarAviso(req, 'error', 'El registro no existe');
      return res.redirect(base);
    }
    const motivo = cat.puedeEditar?.(fila);
    if (motivo) {
      registrarAviso(req, 'error', motivo);
      return res.redirect(base);
    }
    const { datos, valores, error } = leerCampos(cat, req.body);
    const fallo = (e, status = 400) => renderFormulario(res, cat, clave, { fila, valores, error: e, status });
    if (error) return fallo(error);
    try {
      const rel = await validarRelaciones(cat, datos);
      if (rel) return fallo(rel);
      if (datos.fecha === null) delete datos.fecha;
      await fila.update(datos);
      registrarAviso(req, 'mensaje', 'Registro actualizado con éxito');
      res.redirect(base);
    } catch (err) {
      const texto = mensajeSequelize(err);
      if (!texto) throw err;
      fallo(texto, err.name === 'SequelizeUniqueConstraintError' ? 409 : 400);
    }
  };

  const eliminar = async (req, res) => {
    const fila = await buscar(req.params.id);
    if (!fila) {
      registrarAviso(req, 'error', 'El registro no existe');
      return res.redirect(base);
    }
    try {
      await fila.destroy();
      registrarAviso(req, 'mensaje', 'Registro eliminado con éxito');
    } catch (err) {
      if (err.name !== 'SequelizeForeignKeyConstraintError') throw err;
      registrarAviso(req, 'error', cat.bloqueoEliminar || 'No se puede eliminar: tiene registros relacionados.');
    }
    res.redirect(base);
  };

  return { lista, nuevo, crear, editar, actualizar, eliminar };
};
