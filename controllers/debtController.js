import { addNewDebt,getAllDebts,deleteDebt,recordRepayment, getRepayments } from "../models/debtModel.js";
import logger from "../utils/logger.js";

const getDebts = async (req, res) => {
    try {
        const debts = await getAllDebts(); 
        res.status(200).json(debts); 
    } catch (error) {
        res.status(500).json({ message: 'Error fetching debt items' });
    }
};

const createNewDebt = async (req,res)=>{
 logger.log("debtController: received request to add a new debt")
try{
    const newDebtData = req.body

    if(!newDebtData || !newDebtData.customer || !newDebtData.amount || !newDebtData.dueDate || !newDebtData.dateTaken){
        logger.warn(`debtController.js: some information is missing in the request`)
        res.status(400).json({message:`missing required debt data`})
    }

    const addedDebt = await addNewDebt(newDebtData);
    logger.log(`new debt added to firestore debts collection`);
    res.status(201).json(addedDebt);
    return;
}
catch(err){
    logger.error(`debtController: error adding debt `,err);
    res.status(500).json({ message: 'Error adding debt item' });

}
};

const deleteDebtController = async (req, res) => {
    try {
        const debtId = req.params.id;
        if (typeof debtId !== 'string' || debtId.trim() === '') {
            return res.status(400).json({ message: 'Invalid debt ID provided for deletion.' });
        }
        const success = await deleteDebt(debtId); // Call the model function
        if (success) {
            
            res.status(200).json({ message: 'Debt cleared successfully' });
        } else {
            logger.warn(`DebtController: Debt ID ${debtId} not found for deletion.`);
            res.status(404).json({ message: 'Debt not found' });
        }
    } catch (error) {
        logger.error('DebtController Error: Error deleting debt item:', error);
        res.status(500).json({ message: 'Error deleting debt item' });
    }
};

const recordRepaymentController = async (req, res) => {
    logger.log('debtController: Received request to record repayment.');
    try {
        const debtId = req.params.id; // Get debt ID from URL parameters
        const { repaymentAmount, paymentDate } = req.body; // Get repayment data from request body

        // Server-side validation for repayment data
        if (typeof debtId !== 'string' || debtId.trim() === '') {
            logger.warn('debtController: Invalid debt ID provided for repayment.');
            return res.status(400).json({ message: 'Invalid debt ID.' });
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            logger.warn('debtController: Invalid repayment amount provided.');
            return res.status(400).json({ message: 'Repayment amount must be a positive number.' });
        }
        if (typeof paymentDate !== 'string' || paymentDate.trim() === '') {
            logger.warn('debtController: Repayment date is missing.');
            return res.status(400).json({ message: 'Repayment date is required.' });
        }

        // Call the model function to record the repayment
        const updatedDebt = await recordRepayment(debtId, repaymentAmount, paymentDate);

        // Send back the updated debt object
        res.status(200).json(updatedDebt);

    } catch (error) {
        logger.error('debtController Error: Error recording repayment:', error);
        // Distinguish specific errors from the model
        if (error.message.includes('Debt not found')) {
            res.status(404).json({ message: 'Debt not found for repayment.' });
        } else if (error.message.includes('Repayment amount exceeds outstanding balance')) {
            res.status(400).json({ message: error.message }); // Send specific error from model
        } else {
            res.status(500).json({ message: 'Error recording debt repayment.' });
        }
    }
};
const getRepaymentsControlller = async (req,res)=>{
logger.log('debtController: Received request for all repayments.');
    try{
        const debtId = req.params.id;
        if(typeof debtId !== 'string' || debtId.trim()===""){
            logger.warn(`debtController: the id in the params is invalid buddy`)
            return res.status(400).json({message:`Invalid debt id`})
        }
        const repayments = await getRepayments(debtId);
        res.status(200).json(repayments)
    }
    catch(err){
        logger.error(`debtController: there was a problem getting the repayments`,err)
        res.status(500).json({message:`debtcontroller: error fetching the repayments`})
    }
}

export{
    createNewDebt,
    getDebts,
    deleteDebtController,
    recordRepaymentController,
    getRepaymentsControlller
}