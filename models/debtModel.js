import { db, admin } from '../firebase.js';
import Logger from '../utils/logger.js';

const debtCollection = db.collection('debts');

/**
 * Retrieves all debts belonging to a specific user
 * @param {string} userId - The ID of the logged-in user
 */
async function getAllDebts(userId) {
    if (!userId) throw new Error('User ID is required to fetch debts.');
    
    if (!debtCollection) {
        Logger.error('debtModel: Firestore debtCollection is not initialized.');
        throw new Error('Database connection not available for debts.');
    }
    
    Logger.log(`Firestore: Fetching debt records for user: ${userId}`);
    try {
        const snapshot = await debtCollection.where('ownerId', '==', userId).get();
        const debts = [];
        snapshot.forEach(doc => {
            debts.push({ id: doc.id, ...doc.data() }); 
        });
        return debts;
    } catch (error) {
        Logger.error('Firestore Error: Failed to get user debt records:', error);
        throw new Error('Could not fetch debt records from database.');
    }
}

/**
 * Adds a new debt tagged with the owner's ID
 */
async function addNewDebt(newDebt, userId) {
    if (!userId) throw new Error('User ID is required to add a debt.');
    
    if (!debtCollection) {
        Logger.error('DebtModel: Firestore debtsCollection is not initialized.');
        throw new Error('Database connection not available.');
    }

    Logger.log('DebtModel: Adding new debt item for user:', userId);
    try {
        const debtToSave = {
            ...newDebt,
            ownerId: userId, // CRITICAL: Tag the debt with the owner
            createdAt: new Date()
        };
        const docRef = await debtCollection.add(debtToSave);
        return { id: docRef.id, ...debtToSave };
    } catch (error) {
        Logger.error('DebtModel Error: Failed to add debt item:', error);
        throw new Error('Could not add debt item to database.');
    }
}

/**
 * Deletes a debt and its repayments only if the user owns it
 */
async function deleteDebt(id, userId) {
    const debtRef = debtCollection.doc(id);

    try {
        const debtDoc = await debtRef.get();
        if (!debtDoc.exists) return false;

        // Security Check: Verify ownership
        if (debtDoc.data().ownerId !== userId) {
            throw new Error('Unauthorized: You do not own this debt record.');
        }

        // Delete sub-collection repayments
        const repaymentsSnapshot = await debtRef.collection('repayments').get();
        if (!repaymentsSnapshot.empty) {
            const batch = db.batch();
            repaymentsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }

        await debtRef.delete();
        return true;
    } catch (error) {
        Logger.error(`DebtModel Error: Failed to delete debt item ID ${id}:`, error);
        throw new Error(error.message);
    }
}

/**
 * Records a repayment with ownership verification
 */
async function recordRepayment(debtId, repaymentAmount, paymentDate, userId) {
    const debtRef = debtCollection.doc(debtId);

    try {
        const updatedDebt = await db.runTransaction(async (transaction) => {
            const debtDoc = await transaction.get(debtRef);

            if (!debtDoc.exists) {
                throw new Error('Debt not found.');
            }

            const currentDebtData = debtDoc.data();
            
            // Security Check: Verify ownership inside transaction
            if (currentDebtData.ownerId !== userId) {
                throw new Error('Unauthorized: You do not own this debt record.');
            }

            const currentOutstandingAmount = currentDebtData.amount;
            const originalAmount = currentDebtData.originalAmount || currentDebtData.amount; 

            if (repaymentAmount <= 0) throw new Error('Repayment amount must be positive.');
            if (repaymentAmount > currentOutstandingAmount) throw new Error('Repayment amount exceeds outstanding balance.');

            const newOutstandingAmount = currentOutstandingAmount - repaymentAmount;

            let newStatus = 'partially_paid';
            if (newOutstandingAmount <= 0) {
                newStatus = 'paid';
            } else if (newOutstandingAmount === originalAmount) { 
                newStatus = 'pending'; 
            }

            // Update parent debt
            transaction.update(debtRef, {
                amount: newOutstandingAmount,
                status: newStatus
            });

            // Add repayment record
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

        return updatedDebt;
    } catch (error) {
        Logger.error(`DebtModel Error: Failed to record repayment:`, error);
        throw new Error(error.message);
    }
}

/**
 * Fetches repayments for a debt if the user owns the debt
 */
async function getRepayments(id, userId) {
    const debtRef = debtCollection.doc(id);
    try {
        const debtDoc = await debtRef.get();
        if (!debtDoc.exists || debtDoc.data().ownerId !== userId) {
            throw new Error('Unauthorized or Debt not found.');
        }

        const repaymentsSnapshot = await debtRef.collection('repayments').get();
        const repaymentRecords = [];
        repaymentsSnapshot.forEach(doc => {
            repaymentRecords.push({ id: doc.id, ...doc.data() });
        });
        return repaymentRecords;
    } catch (err) {
        Logger.error(`DebtModel Error: Failed to get repayments:`, err);
        throw new Error(err.message);
    }
}

/**
 * Aggregates total debts for a specific user
 */
async function getTotalDebts(userId) {
    try {
        const snapshot = await debtCollection.where('ownerId', '==', userId).get();
        let totalDebts = 0;
        snapshot.forEach(doc => {
            totalDebts += doc.data().amount || 0;
        });
        return totalDebts;
    } catch (error) {
        Logger.error('Firestore Error: Failed to aggregate total debts:', error);
        throw new Error('Could not aggregate total debts.');
    }
}

export {
    addNewDebt,
    getAllDebts,
    deleteDebt,
    recordRepayment,
    getRepayments,
    getTotalDebts
};