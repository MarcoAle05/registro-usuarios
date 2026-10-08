import express from 'express';
import { registroForm, registro, loginForm, login, logout } from '../controllers/authController.js';
import { soloInvitados } from '../middleware/auth.js';

const router = express.Router();
router.get('/', (req, res) => res.redirect('/personas'));
router.get('/registro', soloInvitados, registroForm);
router.post('/registro', soloInvitados, registro);
router.get('/login', soloInvitados, loginForm);
router.post('/login', soloInvitados, login);
router.post('/logout', logout);
export default router;
