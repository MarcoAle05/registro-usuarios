import express from 'express';
import { registroForm, registro, loginForm, login, logout } from '../controllers/authController.js';
import { catalogo } from '../controllers/ventasController.js';
import { soloInvitados } from '../middleware/auth.js';
import { limiteLogin, limiteRegistro } from '../middleware/limites.js';

const router = express.Router();
router.get('/', catalogo);
router.get('/registro', soloInvitados, registroForm);
router.post('/registro', soloInvitados, limiteRegistro, registro);
router.get('/login', soloInvitados, loginForm);
router.post('/login', soloInvitados, limiteLogin, login);
router.post('/logout', logout);
export default router;
