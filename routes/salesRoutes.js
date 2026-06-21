import { Router } from 'express'; 
import { getSales, createNewSale, getTodaysTotal, getSalesSummary, getDashboardStats } from '../controllers/salesController.js'; 
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

const router = Router(); 

// All sales routes require authentication to ensure req.session.userId is available
router.get('/dashboard/stats', ensureAuthenticated, getDashboardStats);
router.get('/sales', ensureAuthenticated, getSales);
router.get('/sales/today-total', ensureAuthenticated, getTodaysTotal);
router.post('/sales', ensureAuthenticated, createNewSale);

// Summary MUST be authenticated because the controller uses req.session.userId to filter data
router.get('/sales/summary', ensureAuthenticated, getSalesSummary);

export default router;