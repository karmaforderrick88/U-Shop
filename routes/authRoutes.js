import express from 'express';
import { loginPage, login, logout } from '../controllers/authController.js';

const router = express.Router();

router.get('/login', loginPage);
router.post('/login', login);
router.get('/logout', logout);

export default router;