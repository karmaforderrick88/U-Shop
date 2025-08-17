import { admin, db } from '../firebase.js';
import logger from '../utils/logger.js';
const salesCollection = db.collection('sales');

//retrieving sales
async function getAllSales(){

    if(!salesCollection){
        logger.error('SaleModel: Firestore salesCollection is not initialized. Cannot fetch sales items.');
        throw new Error('Database connection not available for sales. Please check server logs.');
    }
    logger.log('Firestore: Fetching all sale records...');
    try {
        const snapshot = await salesCollection.get();
        const sales = [];
        snapshot.forEach(doc => {
            sales.push({ id: doc.id, ...doc.data() }); 
        })
        return sales;
    } catch (error) {
        logger.error('Firestore Error: Failed to get all sale records:', error);
        throw new Error('Could not fetch sale records from database.');
    }
}
async function getTodaysTotalSales(){
    if(!salesCollection){
        logger.error("SalesModel: Firestore salesCollection is not initialized. Cannot fetch today's total sales.");
        throw new Error("Database not initialized...check server logs ")
    }
    const today = new Date().toISOString().split('T')[0];
    try{
        const query = salesCollection.where('saleDate','==',today);
        const snapshot = await query.get();

        let total = 0;
        snapshot.forEach(doc =>{
            const sale = doc.data();
            total += sale.total || 0
        });
        logger.log("salesModel:successfully retrived today's sales,Ksh: ",total)
        return total;
    }
   
    catch(err){
        logger.error("SalesModel: failed to get todays sales",err);
        throw new Error("could not fetch todays  total sales")
    }

}
//adding sale
async function addNewSale(newSale) {
    if (!salesCollection) {
        logger.error('SalesModel: Firestore salesCollection is not initialized. Cannot add sale.');
        throw new Error('Database connection not available for sales. Please check server logs.');
    }
    logger.log('SalesModel: Attempting to add new sale item:', newSale);
    //  a transaction to ensure atomicity
    try {
        const result = await db.runTransaction(async (transaction) => {
            //  Get the current stock item
            if (!newSale.productId) {
                throw new Error('Product ID is required for a new sale.');
            }
            const stockRef = db.collection('stockitems').doc(newSale.productId);
            const stockDoc = await transaction.get(stockRef);

            if (!stockDoc.exists) {
                throw new Error('Stock item not found for product ID: ' + newSale.productId);
            }

            const currentStock = stockDoc.data();
            const currentQuantity = currentStock.quantity;

            if (currentQuantity < newSale.quantity) {
                throw new Error(`Insufficient stock for ${newSale.productName}. Available: ${currentQuantity}, Requested: ${newSale.quantity}`);
            }

            //  Calculate new quantity and prepare updated stock data
            const updatedQuantity = currentQuantity - newSale.quantity;
            transaction.update(stockRef, { quantity: updatedQuantity });

            
            
            if (typeof newSale.unitPrice !== 'number' || newSale.unitPrice < 0) {
                 throw new Error('Invalid unitPrice for sale.');
            }
            if (typeof currentStock.costPrice !== 'number' || currentStock.costPrice < 0) {
                
                 logger.warn(`Stock item ${newSale.productId} has invalid or missing costPrice.`);
            }

            const saleToSave = {
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

            logger.log(`SalesModel: Stock updated and sale recorded within transaction for product ${newSale.productName}.`);
            return { id: saleRef.id, ...saleToSave };
        });

        return result;

    } catch (error) {
        logger.error('SalesModel Error: Failed to add new sale or update stock:', error);
        throw new Error('Could not record sale: ' + error.message);
    }
}

// Aggregate sales summary data
async function getSalesSummaryData() {
    if (!salesCollection) {
        throw new Error('saleModel.js:Database connection not available for sales.');
    }
    try {
        const snapshot = await salesCollection.get();
        let monthlyIncome = 0;
        const productSales = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        snapshot.forEach(doc => {
            const sale = doc.data();
            const saleTotal = sale.total || (sale.quantity * sale.unitPrice) || 0

            // Monthly income
            if (sale.saleDate) {
                const saleDate = new Date(sale.saleDate);
                if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                    monthlyIncome += saleTotal;
                }
            }

            // Best-selling product
            if (sale.productName) {
                if (!productSales[sale.productName]) {
                    productSales[sale.productName] = 0;
                }
                productSales[sale.productName] += sale.quantity || 0;
            }
        });

        // Find best-selling product
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
        logger.error('Firestore Error: Failed to aggregate sales summary:', error);
        throw new Error('Could not aggregate sales summary.');
    }
}

export {
    getAllSales,
    addNewSale,
    getTodaysTotalSales,
    getSalesSummaryData
};