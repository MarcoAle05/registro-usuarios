import express from 'express';
import {
  inicio,
  registro,
  verCrear,
  editar,
  actualizar,
  eliminar,
} from '../controllers/usuariosController.js';
import { soloAdmin, adminOPropio } from '../middleware/auth.js';

const router = express.Router();

// El :id solo puede ser un número
router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) {
    req.session.flash = { error: 'El usuario no existe' };
    return res.redirect('/usuarios');
  }
  next();
});

//Routing
router.get('/', inicio);
router.get('/crear', soloAdmin, verCrear);
router.post('/registrar', soloAdmin, registro);
router.get('/:id/editar', adminOPropio, editar);
router.put('/:id', adminOPropio, actualizar);
router.delete('/:id', adminOPropio, eliminar);
export default router;
