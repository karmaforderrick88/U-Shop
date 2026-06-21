import { addNewDebt, getAllDebts, deleteDebt, recordRepayment, getRepayments } from "../models/debtModel.js";
import Logger from "../utils/logger.js";
import { getBusinessId } from "../utils/auth.js";

/**
 * Controller to fetch all debts for the logged-in user
 */

const getDebts = async (req, res) => {
    try {
        const businessId= getBusinessId(req)
        const debts = await getAllDebts(businessId); 
        res.status(200).json(debts); 
    } catch (error) {
        Logger.error('DebtController: Error fetching debts:', error);
        res.status(500).json({ message: 'Error fetching debt items' });
    }
};

/**
 * Controller to create a new debt scoped to the user
 */
const createNewDebt = async (req, res) => {
    Logger.log("DebtController: Received request to add a new debt");
    try {
      const businessId = getBusinessId(req)
        const newDebtData = req.body;

        if (!newDebtData || !newDebtData.customer || !newDebtData.amount || !newDebtData.dueDate || !newDebtData.dateTaken) {
            return res.status(400).json({ message: 'Missing required debt data' });
        }

        const addedDebt = await addNewDebt(newDebtData,businessId );
        res.status(201).json(addedDebt);
    } catch (err) {
        Logger.error(`DebtController: Error adding debt:`, err);
        res.status(500).json({ message: 'Error adding debt item' });
    }
};

/**
 * Controller to delete a debt with ownership check
 */
const deleteDebtController = async (req, res) => {
    try {
      const businessId = getBusinessId(req)
        const debtId = req.params.id;

        if (!debtId || debtId.trim() === '') {
            return res.status(400).json({ message: 'Invalid debt ID.' });
        }

        const success = await deleteDebt(debtId, businessId);
        if (success) {
            res.status(200).json({ message: 'Debt cleared successfully' });
        } else {
            res.status(404).json({ message: 'Debt not found' });
        }
    } catch (error) {
        Logger.error('DebtController Error: Error deleting debt:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error deleting debt item' });
    }
};

/**
 * Controller to record a repayment with ownership check
 */
const recordRepaymentController = async (req, res) => {
    try {
      const businessId = getBusinessId(req)
        const debtId = req.params.id;
        const { repaymentAmount, paymentDate } = req.body;

        if (!debtId || debtId.trim() === '') {
            return res.status(400).json({ message: 'Invalid debt ID.' });
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            return res.status(400).json({ message: 'Repayment amount must be positive.' });
        }

        const updatedDebt = await recordRepayment(debtId, Number(repaymentAmount), paymentDate, businessId);
        res.status(200).json(updatedDebt);

    } catch (error) {
        Logger.error('DebtController: Error recording repayment:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ message: error.message });
        } else if (error.message.includes('Debt not found')) {
            return res.status(404).json({ message: 'Debt not found.' });
        } else if (error.message.includes('exceeds outstanding balance')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error recording debt repayment.' });
    }
};

/**
 * Controller to fetch repayments for a specific debt
 */
const getRepaymentsControlller = async (req, res) => {
    try {
      const businessId = getBusinessId(req)
        const debtId = req.params.id;

        if (!debtId || debtId.trim() === "") {
            return res.status(400).json({ message: `Invalid debt id` });
        }

        const repayments = await getRepayments(debtId, businessId);
        res.status(200).json(repayments);
    } catch (err) {
        Logger.error(`DebtController: Error fetching repayments:`, err);
        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({ message: err.message });
        }
        res.status(500).json({ message: `Error fetching the repayments` });
    }
}

export {
    createNewDebt,
    getDebts,
    deleteDebtController,
    recordRepaymentController,
    getRepaymentsControlller
};