import { db } from '../firebase.js';
import logger from '../utils/logger.js';
const stockCollection = db.collection('stockitems');

async function getAllStockItems() {
    logger.log('Firestore: Fetching all stock items...');
    try {
        const snapshot = await stockCollection.get();
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        logger.error('Firestore Error: Failed to get all stock items:', error);
        throw new Error('Could not fetch stock items from database.');
    }
}

async function addStockItem(newItem) {
    logger.log('Firestore: Adding new stock item:', newItem);
    try {
        const itemToAdd = { ...newItem,
            costPrice: typeof newItem.costPrice === 'number' && newItem.costPrice >= 0 ? newItem.costPrice : 0,
         };
        delete itemToAdd.id;

        const docRef = await stockCollection.add(itemToAdd);
        return { id: docRef.id, ...newItem };
    } catch (error) {
        logger.error('Firestore Error: Failed to add stock item:', error);
        throw new Error('Could not add stock item to database.');
    }
}

async function updateStockItem(id, updatedData) {
    if (!stockCollection) {
        logger.error('StockModel: Firestore stockCollection is not initialized. Cannot update stock item.');
        throw new Error('Database connection not available for stock. Please check server logs.');
    }
    logger.log(`StockModel: Updating stock item ID ${id} with data:`, updatedData);
    const stockRef = stockCollection.doc(id);

    try {
        const doc = await stockRef.get();
        if (!doc.exists) {
            throw new Error('Stock item not found for update.');
        }

        const dataToUpdate = { ...updatedData };
        if (typeof dataToUpdate.costPrice !== 'undefined' && typeof dataToUpdate.costPrice !== 'number' || dataToUpdate.costPrice < 0) {
            logger.warn('StockModel: Invalid costPrice provided for update. Ignoring or setting to 0.');
            dataToUpdate.costPrice = 0;
        }

        await stockRef.update(dataToUpdate);
        const updatedDoc = await stockRef.get();
        logger.log(`StockModel: Stock item ID ${id} successfully updated.`);
        return { id: updatedDoc.id, ...updatedDoc.data() };

    } catch (error) {
        logger.error(`StockModel Error: Failed to update stock item ID ${id}:`, error);
        throw new Error(`Could not update stock item with ID ${id}: ${error.message}`);
    }
}

async function deleteStockItem(id) {
    logger.log(`Firestore: Deleting stock item with ID ${id}...`);
    try {
        const docRef = stockCollection.doc(id);
        await docRef.delete();
        return true;
    } catch (error) {
        logger.error(`Firestore Error: Failed to delete stock item ID ${id}:`, error);
        throw new Error(`Could not delete stock item with ID ${id}.`);
    }
}
async function getStockItemById(id) {
    if (!stockCollection) {
            logger.error('StockModel: Firestore stockCollection is not initialized. Cannot fetch single stock item.');
        throw new Error('Database connection not available for stock. Please check server logs.');
    }
    logger.log(`StockModel: Fetching stock item with ID: ${id}`);
    const stockRef = stockCollection.doc(id);
    try {
        const doc = await stockRef.get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            logger.warn(`StockModel: Stock item with ID ${id} not found.`);
            return null;
        }
    } catch (error) {
        logger.error(`StockModel Error: Failed to get stock item ID ${id}:`, error);
        throw new Error(`Could not fetch stock item with ID ${id}.`);
    }
}

export {
    getAllStockItems,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    getStockItemById
};
