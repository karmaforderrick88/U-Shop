import { Router } from 'express'; 
import {   getSales,createNewSale, getTodaysTotal, getSalesSummary } from '../controllers/salesController.js'; 
import { ensureAuthenticated, ensureAdminOrOwner } from '../middleware/authMiddleware.js';

const router = Router(); 

router.get('/sales', ensureAuthenticated, getSales);
router.get('/sales/today-total',ensureAuthenticated, getTodaysTotal);
router.post('/sales', ensureAuthenticated, createNewSale);
router.get('/sales/summary', getSalesSummary);

export default router;
