import { Router } from 'express'; 
import { getDebts, createNewDebt, deleteDebtController, recordRepaymentController, getRepaymentsControlller} from '../controllers/debtController.js'; 
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

const router = Router(); 

router.get('/debts', ensureAuthenticated, getDebts);

router.get('/debts/:id/repayments',ensureAuthenticated, getRepaymentsControlller)

router.post('/debts', ensureAuthenticated, createNewDebt);


router.delete('/debts/:id',ensureAuthenticated, deleteDebtController);

router.patch('/debts/:id/repayment',ensureAuthenticated ,recordRepaymentController)

export default router;
