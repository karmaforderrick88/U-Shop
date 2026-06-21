import { admin, db } from '../firebase.js';
import Logger from '../utils/logger.js';
const salesCollection = db.collection('sales');

/**
 * Retrieves all sales items belonging to a specific user
 * @param {string} userId - The ID of the logged-in user
 */
async function getAllSales(userId) {
    if (!userId) throw new Error('User ID is required to fetch sales.');

    if (!salesCollection) {
        Logger.error('SaleModel: Firestore salesCollection is not initialized.');
        throw new Error('Database connection not available for sales.');
    }

    Logger.log(`Firestore: Fetching sale records for user: ${userId}`);
    try {
        const snapshot = await salesCollection.where('ownerId', '==', userId).get();
        const sales = [];
        snapshot.forEach(doc => {
            sales.push({ id: doc.id, ...doc.data() });
        });
        return sales;
    } catch (error) {
        Logger.error('Firestore Error: Failed to get user sale records:', error);
        throw new Error('Could not fetch sale records from database.');
    }
}

/**
 * Retrieves today's total sales for a specific user
 * @param {string} userId - The ID of the logged-in user
 */
async function getTodaysTotalSales(userId) {
    if (!userId) throw new Error('User ID is required.');
    
    if (!salesCollection) {
        Logger.error("SalesModel: Firestore salesCollection is not initialized.");
        throw new Error("Database not initialized.");
    }

    const today = new Date().toISOString().split('T')[0];
    try {
        // Compound query: match owner AND date
        const query = salesCollection
            .where('ownerId', '==', userId)
            .where('saleDate', '==', today);
            
        const snapshot = await query.get();

        let total = 0;
        snapshot.forEach(doc => {
            const sale = doc.data();
            total += sale.total || 0;
        });
        Logger.log(`SalesModel: Successfully retrieved today's sales for user ${userId}, Total: `, total);
        return total;
    } catch (err) {
        Logger.error("SalesModel: Failed to get todays sales", err);
        throw new Error("Could not fetch today's total sales");
    }
}

/**
 * Adds a new sale and updates stock using a transaction, scoped to the user
 * @param {Object} newSale - The sale data
 * @param {string} userId - The ID of the user making the sale
 */
async function addNewSale(newSale, userId) {
    if (!userId) throw new Error('User ID is required to record a sale.');

    if (!salesCollection) {
        Logger.error('SalesModel: Firestore salesCollection is not initialized.');
        throw new Error('Database connection not available.');
    }

    Logger.log(`SalesModel: User ${userId} attempting to add sale:`, newSale);

    try {
        const result = await db.runTransaction(async (transaction) => {
            if (!newSale.productId) {
                throw new Error('Product ID is required for a new sale.');
            }

            const stockRef = db.collection('stockitems').doc(newSale.productId);
            const stockDoc = await transaction.get(stockRef);

            if (!stockDoc.exists) {
                throw new Error('Stock item not found.');
            }

            const currentStock = stockDoc.data();

            // Security Check: Verify user owns the stock they are selling
            if (currentStock.ownerId !== userId) {
                throw new Error('Unauthorized: You do not own this stock item.');
            }

            const currentQuantity = currentStock.quantity;

            if (currentQuantity < newSale.quantity) {
                throw new Error(`Insufficient stock for ${newSale.productName}. Available: ${currentQuantity}, Requested: ${newSale.quantity}`);
            }

            // Deduct from stock
            const updatedQuantity = currentQuantity - newSale.quantity;
            transaction.update(stockRef, { quantity: updatedQuantity });

            const saleToSave = {
                ownerId: userId, //Tag the sale with the user
                productId: newSale.productId,
                productName: newSale.productName,
                quantity: newSale.quantity,
                unitPrice: newSale.unitPrice,
                itemCostPrice: currentStock.costPrice || 0,
                total: newSale.quantity * newSale.unitPrice,
                paymentMode: newSale.paymentMode,
                saleDate: newSale.saleDate || new Date().toISOString().split('T')[0],
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            const saleRef = salesCollection.doc();
            transaction.set(saleRef, saleToSave);

            return { id: saleRef.id, ...saleToSave };
        });

        return result;
    } catch (error) {
        Logger.error('SalesModel Error: Failed to add new sale or update stock:', error);
        throw new Error(error.message);
    }
}

/**
 * Aggregates sales summary data for a specific user
 * @param {string} userId - The ID of the logged-in user
 */
async function getSalesSummaryData(userId) {
    if (!userId) throw new Error('User ID is required.');

    try {
        const snapshot = await salesCollection.where('ownerId', '==', userId).get();
        let monthlyIncome = 0;
        const productSales = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        snapshot.forEach(doc => {
            const sale = doc.data();
            const saleTotal = sale.total || (sale.quantity * sale.unitPrice) || 0;

            // Monthly income check
            if (sale.saleDate) {
                const saleDate = new Date(sale.saleDate);
                if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                    monthlyIncome += saleTotal;
                }
            }

            // Product popularity
            if (sale.productName) {
                if (!productSales[sale.productName]) {
                    productSales[sale.productName] = 0;
                }
                productSales[sale.productName] += sale.quantity || 0;
            }
        });

        let bestSellingProduct = null;
        let maxSold = 0;
        for (const [product, qty] of Object.entries(productSales)) {
            if (qty > maxSold) {
                bestSellingProduct = product;
                maxSold = qty;
            }
        }

        return {
            bestSellingProduct,
            monthlyIncome
        };
    } catch (error) {
        Logger.error('Firestore Error: Failed to aggregate sales summary:', error);
        throw new Error('Could not aggregate sales summary.');
    }
}

export {
    getAllSales,
    addNewSale,
    getTodaysTotalSales,
    getSalesSummaryData
};