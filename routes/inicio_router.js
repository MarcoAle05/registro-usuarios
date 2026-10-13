import express from 'express';
import {
  inicio,
  registro,
  verCrear,
  editar,
  actualizar,
  eliminar,
} from '../controllers/inicioController.js';
import { crearLibro, crearVenta } from '../controllers/ventasController.js';
import { soloAdmin, adminOPropio } from '../middleware/auth.js';

const router = express.Router();

// El :id solo puede ser un número
router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) {
    req.session.flash = { error: 'La persona no existe' };
    return res.redirect('/personas');
  }
  next();
});

//Routing
router.get('/', inicio);
router.post('/libros', soloAdmin, crearLibro);
router.post('/ventas', soloAdmin, crearVenta);
router.get('/crear', soloAdmin, verCrear);
router.post('/registrar', soloAdmin, registro);
router.get('/:id/editar', adminOPropio, editar);
router.put('/:id', adminOPropio, actualizar);
router.delete('/:id', adminOPropio, eliminar);
export default router;
