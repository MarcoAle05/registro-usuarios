import express from 'express';
import { registro_usuario, usuarios_lista, login } from '../controllers/apiController.js';

const router = express.Router();
router.post('/registro', registro_usuario);
router.get('/lista', usuarios_lista);
router.post('/login', login);
export default router;
