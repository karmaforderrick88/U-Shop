import { Router } from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { getStocks, createStockItem, updateItem, deleteStock, getPublicStocks} from '../controllers/stockController.js'; 
import { ensureAuthenticated,ensureAdminOrOwner} from '../middleware/authMiddleware.js';

const router = Router(); 

//public  api route to fetch gallery items
router.get('/public/stocks/:businessId', getPublicStocks);

// GET /api/stocks - Get all stock items
router.get('/stocks', ensureAuthenticated, getStocks);

// POST /api/stocks - Add a new stock item
router.post('/stocks', ensureAuthenticated, ensureAdminOrOwner,upload.single('productImage'),createStockItem);

router.put('/stocks/:id', ensureAuthenticated, ensureAdminOrOwner,upload.single('productImage'), updateItem);

router.delete('/stocks/:id', ensureAuthenticated, ensureAdminOrOwner, deleteStock);


export default router;
