import express from 'express';
import {
  ver,
  agregar,
  actualizar,
  quitar,
  vaciar,
  comprar,
  confirmacion,
} from '../controllers/carritoController.js';

const router = express.Router();

router.get('/', ver);
router.get('/confirmacion', confirmacion);
router.post('/agregar', agregar);
router.post('/actualizar', actualizar);
router.post('/quitar', quitar);
router.post('/vaciar', vaciar);
router.post('/comprar', comprar);

export default router;
