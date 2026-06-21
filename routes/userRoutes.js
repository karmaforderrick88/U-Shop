import express from 'express';
import { createEmpUser } from '../controllers/userController.js';
import { ensureAuthenticated, ensureAdminOrOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Restricted User Creation
 * Only an authenticated Admin or Owner should be able to create new users 
 * via the internal management system.
 */
router.post('/users', ensureAuthenticated, ensureAdminOrOwner, createEmpUser);

export default router;