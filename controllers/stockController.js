import { getAllStockItems, addStockItem, updateStockItem, deleteStockItem } from '../models/stockmodel.js';
import logger from '../utils/logger.js';
const getStocks = async (req, res) => {
    try {
        const stocks = await getAllStockItems();
        res.status(200).json(stocks);
    } catch (error) {
        logger.error('StockController Error: Error fetching stocks:', error);
        res.status(500).json({ message: 'Error fetching stock items' });
    }
};

const createStockItem = async (req, res) => {
    try {
        const newItemData = req.body;

        if (!newItemData || !newItemData.name ||!newItemData.quantity || !newItemData.price) {
            return res.status(400).json({ message: 'Missing required item data' });
        }

        const newItem = await addStockItem(newItemData);
        res.status(201).json(newItem);
    } catch (error) {
        logger.error('StockController Error: Error adding stock item:', error);
        res.status(500).json({ message: 'Error adding stock item' });
    }
};

const updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const updatedData = req.body;

        if (typeof itemId !== 'string' || itemId.trim() === '') {
            return res.status(400).json({ message: 'Invalid item ID provided (must be a non-empty string).' });
        }
        if (!updatedData || !updatedData.name || !updatedData.quantity || !updatedData.price) {
             return res.status(400).json({ message: 'Missing required item data for update.' });
        }

        const updatedItem = await updateStockItem(itemId, updatedData);

        if (updatedItem) {
            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found (after update attempt).' });
        }
    } catch (error) {
        logger.error('StockController Error: Error updating stock item:', error);
        res.status(500).json({ message: 'Error updating stock item' });
    }
};

const deleteStock = async(req,res)=>{
    try{
        const itemId = req.params.id;

        if(typeof itemId !== 'string'|| itemId.trim() === '' ){
            logger.warn('StockController: Invalid item ID provided for deletion:', itemId);
            return res.status(400).json({ message: 'Invalid item ID provided for deletion.' });
        }

        const success = await deleteStockItem(itemId)
        if (success) {
            logger.log(`StockController: Item ID ${itemId} successfully deleted.`);
            
            res.status(200).json({ message: 'Item deleted successfully' });
        } else {
            //item was not found
            logger.warn(`StockController: Item ID ${itemId} not found for deletion.`);
            res.status(404).json({ message: 'Item not found' });
        }      
}
catch(err){
    logger.error(`Firebase: error deleting item with id: ${itemToDelete}`,err)
}
}

export {
    getStocks,
    createStockItem,
    updateItem,
    deleteStock
    
};