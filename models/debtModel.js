import { db,admin } from '../firebase.js';
import logger from '../utils/logger.js';

const debtCollection = db.collection('debts');

async function getAllDebts(){
    if(!debtCollection){
        logger.error('debtModel: Firestore debtCollection is not initialized. Cannot fetch debts.');
        throw new Errorale('Database connection not available for debts. Please check server logs.');
    }
    logger.log('Firestore: Fetching all debt records...');
    try {
        const snapshot = await debtCollection.get();
        const debts = [];
        snapshot.forEach(doc => {
            debts.push({ id: doc.id, ...doc.data() }); 
        });
        logger.log(`DebtModel: Found ${debts.length} debt records.`);
        return debts;
    } catch (error) {
        logger.error('Firestore Error: Failed to get all debt records:', error);
        throw new Error('Could not fetch debt records from database.');
    }
}
async function addNewDebt(newDebt) {
    if (!debtCollection) {
        logger.error('DebtModel: Firestore debtsCollection is not initialized. Cannot add debt item.');
        throw new new Error('Database connection not available for debts. Please check server logs.');
    }

    logger.log('DebtModel: Adding new debt item to Firestore:', newDebt);
    try {
        // Add the new debt document to the collection
        const docRef = await debtCollection.add(newDebt);
        logger.log(`DebtModel: Debt item added with ID: ${docRef.id}`);
        // Return the new debt object along with its Firestore ID
        return { id: docRef.id, ...newDebt };
    } catch (error) {
        logger.error('DebtModel Error: Failed to add debt item:', error);
        throw new Error('Could not add debt item to database.');
    }
}

async function deleteDebt(id) {
    if (!debtCollection) {
        logger.error('DebtModel: Firestore debtCollection is not initialized. Cannot delete debt item.');
        throw new Error('Database connection not available for debts. Please check server logs.');
    }
    logger.log(`DebtModel: Deleting debt item with ID ${id} and its sub-collections...`);
    const debtRef = debtCollection.doc(id);

    try {
        // Check if the main debt document exists
        const debtDoc = await debtRef.get();
        if (!debtDoc.exists) {
            logger.warn(`DebtModel: Debt item with ID ${id} not found.`);
            return false; 
        }

        // Step 1: Delete all documents in the 'repayments' sub-collection
        const repaymentsSnapshot = await debtRef.collection('repayments').get();
        if (!repaymentsSnapshot.empty) {
            const batch = db.batch(); // Used a batch here for atomicity
            repaymentsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            logger.log(`DebtModel: Deleted ${repaymentsSnapshot.size} repayment records for debt ID ${id}.`);
        } else {
            logger.log(`DebtModel: No repayment records found for debt ID ${id}.`);
        }

        // Step 2: Delete the main debt document
        await debtRef.delete();
        logger.log(`DebtModel: Main debt item ID ${id} deleted.`);
        return true;
    } catch (error) {
        logger.error(`DebtModel Error: Failed to delete debt item ID ${id} or its repayments:`, error);
        throw new Error(`Could not delete debt item with ID ${id}: ${error.message}`);
    }
}

/**
 * Records a partial or full repayment for a specific debt using a Firestore transaction.
 * Updates the main debt document's amount and status, and adds a repayment record to a sub-collection.
 * @param {string} debtId - The ID of the debt to update.
 * @param {number} repaymentAmount - The amount being paid in this transaction.
 * @param {string} paymentDate - The date of this repayment (YYYY-MM-DD).
 * @returns {Object} The updated debt object.
 * @throws {Error} If debt is not found, insufficient outstanding amount, or transaction fails.
 */
async function recordRepayment(debtId, repaymentAmount, paymentDate) {
    if (!debtCollection) {
        logger.error('DebtModel: Firestore debtCollection is not initialized. Cannot record repayment.');
        throw new Error('Database connection not available for debts. Please check server logs.');
    }

    const debtRef = debtCollection.doc(debtId);

    try {
        const updatedDebt = await db.runTransaction(async (transaction) => {
            const debtDoc = await transaction.get(debtRef);

            if (!debtDoc.exists) {
                throw new Error('Debt not found.');
            }

            const currentDebtData = debtDoc.data();
            const currentOutstandingAmount = currentDebtData.amount;
            //  for backward compatibility or future originalAmount field
            const originalAmount = currentDebtData.originalAmount || currentDebtData.amount; 

            if (repaymentAmount <= 0) {
                throw new Error('Repayment amount must be positive.');
            }
            if (repaymentAmount > currentOutstandingAmount) {
                throw new Error('Repayment amount exceeds outstanding balance.');
            }

            const newOutstandingAmount = currentOutstandingAmount - repaymentAmount;

            let newStatus = 'partially_paid';
            if (newOutstandingAmount <= 0) {
                newStatus = 'paid';
            } else if (newOutstandingAmount === originalAmount) { 
                newStatus = 'pending'; 
            } else if (newOutstandingAmount < originalAmount && newOutstandingAmount > 0) { 
                newStatus = 'partially_paid';
            }


            // 1. Update the main debt document
            transaction.update(debtRef, {
                amount: newOutstandingAmount,
                status: newStatus
            });

            // 2. Add a new document to the 'repayments' sub-collection
            const repaymentDocRef = debtRef.collection('repayments').doc();
            transaction.set(repaymentDocRef, {
                amountPaid: repaymentAmount,
                paymentDate: paymentDate,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                balanceAfterPayment: newOutstandingAmount
            });

            return {
                id: debtDoc.id,
                ...currentDebtData,
                amount: newOutstandingAmount,
                status: newStatus
            };
        });

        logger.log(`DebtModel: Repayment recorded for debt ID ${debtId}. New outstanding: ${updatedDebt.amount}, Status: ${updatedDebt.status}`);
        return updatedDebt;

    } catch (error) {
        logger.error(`DebtModel Error: Failed to record repayment for debt ID ${debtId}:`, error);
        throw new Error(`Could not record repayment: ${error.message}`);
    }
}
 async function getRepayments(id) {
    if (!debtCollection) {
        logger.error('DebtModel: Firestore debtCollection is not initialized. Cannot fetch repayments.');
        throw new Error('Database connection not available for debts. Please check server logs.');
    }
 
const debtRef = debtCollection.doc(id)

 try{
    const repaymentsSnapshot = await debtRef.collection('repayments').get();
    const repaymentRecords = [];
    repaymentsSnapshot.forEach(doc =>{
 repaymentRecords.push({id:doc.id,...doc.data()})
    });
    logger.log(`debtModel: Found ${repaymentRecords.length} repayment records for debt with id ${id}`)
    return repaymentRecords;


 }catch(err){
logger.error(`DebtModel Error: Failed to get repayments for debt ID ${id}:`, err);
        throw new Error(`Could not fetch repayment records for debt ID ${id}.`);
    }
}

// Aggregate total debts
async function getTotalDebts() {
    if (!debtCollection) {
        throw new Error('Database connection not available for debts.');
    }
    try {
        const snapshot = await debtCollection.get();
        let totalDebts = 0;
        snapshot.forEach(doc => {
            const debt = doc.data();
            totalDebts += debt.amount || 0;
        });
        return totalDebts;
    } catch (error) {
        logger.error('Firestore Error: Failed to aggregate total debts:', error);
        throw new Error('Could not aggregate total debts.');
    }
}

export{
    addNewDebt,
    getAllDebts,
    deleteDebt,
    recordRepayment,
    getRepayments,
    getTotalDebts
}