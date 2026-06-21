import { db } from '../firebase.js';
import Logger from '../utils/logger.js';
const stockCollection = db.collection('stockitems');


/**
 * Retrieves all stock items belonging to a specific user
 * @param {string} userId - The ID of the logged-in user
 */
async function getAllStockItems(userId) {
    if (!userId) throw new Error('User ID is required to fetch stock.')
    Logger.log(`Firestore: Fetching stock items for user ${userId}`);
    try {
        const snapshot = await stockCollection.where('ownerId','==',userId).get();// filter by ownerid to ensure data separation
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        Logger.error('Firestore Error: Failed to get all stock items:', error);
        throw new Error('Could not fetch stock items from database.');
    }
}
/**
 * 
 * @param {object} newItem - item being added 
 * @param {*string} userId - id of logged in user
 * @returns 
 */

async function addStockItem(newItem, userId) {
    if (!userId) throw new Error('User ID is required to add stock.');
    
    Logger.log('Firestore: Adding new stock item:', newItem);
    try {
        const itemToAdd = { 
            ...newItem,
            ownerId: userId, //  Tag the record with the owner
            costPrice: typeof newItem.costPrice === 'number' && newItem.costPrice >= 0 ? newItem.costPrice : 0,
            createdAt: new Date()
         };
        delete itemToAdd.id;

        const docRef = await stockCollection.add(itemToAdd);
        return { id: docRef.id, ...itemToAdd };
    } catch (error) {
        Logger.error('Firestore Error: Failed to add stock item:', error);
        throw new Error('Could not add stock item to database.');
    }
}

/**
 * Updates a stock item only if it belongs to the user
 */
async function updateStockItem(id, updatedData, userId) {
    if (!stockCollection) {
        Logger.error('StockModel: Firestore stockCollection is not initialized.');
        throw new Error('Database connection not available.');
    }
    
    const stockRef = stockCollection.doc(id);

    try {
        const doc = await stockRef.get();
        if (!doc.exists) {
            throw new Error('Stock item not found.');
        }

        // Security Check: Verify ownership before updating
        if (doc.data().ownerId !== userId) {
            throw new Error('Unauthorized: You do not own this item.');
        }

        const dataToUpdate = { ...updatedData };
        if (typeof dataToUpdate.costPrice !== 'undefined' && (typeof dataToUpdate.costPrice !== 'number' || dataToUpdate.costPrice < 0)) {
            dataToUpdate.costPrice = 0;
        }

        await stockRef.update(dataToUpdate);
        const updatedDoc = await stockRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() };

    } catch (error) {
        Logger.error(`StockModel Error: Failed to update stock item ID ${id}:`, error);
        throw new Error(error.message);
    }
}

/**
 * Deletes a stock item only if it belongs to the user
 */
async function deleteStockItem(id, userId) {
    Logger.log(`Firestore: Attempting to delete stock item ID ${id}...`);
    try {
        const docRef = stockCollection.doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) return false;

        // Security Check: Verify ownership before deleting
        if (doc.data().ownerId !== userId) {
            throw new Error('Unauthorized: You do not own this item.');
        }

        await docRef.delete();
        return true;
    } catch (error) {
        Logger.error(`Firestore Error: Failed to delete stock item ID ${id}:`, error);
        throw new Error(error.message);
    }
}

/**
 * Fetches a single item by ID with ownership verification
 */
async function getStockItemById(id, userId) {
    const stockRef = stockCollection.doc(id);
    try {
        const doc = await stockRef.get();
        if (doc.exists) {
            const data = doc.data();
            // Optional: return null if user doesn't own it to prevent discovery
            if (data.ownerId !== userId) return null;
            return { id: doc.id, ...data };
        }
        return null;
    } catch (error) {
        Logger.error(`StockModel Error: Failed to get stock item ID ${id}:`, error);
        throw new Error('Could not fetch stock item.');
    }
}




export {
    getAllStockItems,
    addStockItem,
    updateStockItem,
    deleteStockItem,
    getStockItemById
};
