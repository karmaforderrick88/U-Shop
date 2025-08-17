import { Router } from 'express'; 
import { getStocks, createStockItem, updateItem, deleteStock } from '../controllers/stockController.js'; 
import { ensureAuthenticated,ensureAdminOrOwner} from '../middleware/authMiddleware.js';

const router = Router(); 

// GET /api/stocks - Get all stock items
router.get('/stocks', ensureAuthenticated, getStocks);

// POST /api/stocks - Add a new stock item
router.post('/stocks', ensureAuthenticated, ensureAdminOrOwner,createStockItem);

router.put('/stocks/:id', ensureAuthenticated, ensureAdminOrOwner, updateItem);

router.delete('/stocks/:id', ensureAuthenticated, ensureAdminOrOwner, deleteStock);


export default router;
