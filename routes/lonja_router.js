import express from 'express';
import { CATALOGOS, controladorCatalogo } from '../controllers/catalogoController.js';
import * as compras from '../controllers/comprasController.js';
import { requiereLogin, soloAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todo el sistema de la Lonja es solo para personal con sesión iniciada
router.use(requiereLogin);

// Los :id siempre son números
router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) {
    req.session.flash = { error: 'El registro no existe' };
    return res.redirect('/');
  }
  next();
});

router.get('/', compras.panel);

// Catálogos: tipos, compradores, lotes y especies
for (const [clave, cat] of Object.entries(CATALOGOS)) {
  const c = controladorCatalogo(clave);
  const escribe = cat.escritura === 'admin' ? [soloAdmin] : [];
  router.get(`/${clave}`, c.lista);
  router.get(`/${clave}/nuevo`, ...escribe, c.nuevo);
  router.post(`/${clave}`, ...escribe, c.crear);
  router.get(`/${clave}/:id/editar`, ...escribe, c.editar);
  router.put(`/${clave}/:id`, ...escribe, c.actualizar);
  router.delete(`/${clave}/:id`, soloAdmin, c.eliminar);
}

// Compras y reporte diario
router.get('/compras', compras.lista);
router.get('/compras/nuevo', compras.nuevo);
router.post('/compras', compras.crear);
router.get('/compras/:id/editar', compras.editar);
router.put('/compras/:id', compras.actualizar);
router.delete('/compras/:id', soloAdmin, compras.eliminar);
router.get('/reporte', compras.reporte);

export default router;
