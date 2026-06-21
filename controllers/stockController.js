import { getAllStockItems, addStockItem, updateStockItem, deleteStockItem } from '../models/stockmodel.js';
import Logger from '../utils/logger.js';
import { getBusinessId } from '../utils/auth.js';
import cloudinary from '../utils/cloudinary.js';

// --- CLOUDINARY HELPER ---
const streamUpload = (buffer, folderName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folderName },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(buffer);
    });
};

/**
 * Controller to fetch all stock items for the logged-in user or their employer
 */
const getStocks = async (req, res) => {
    try {
        // Business Logic: Use employerId if employee, otherwise use own userId
        const businessId = getBusinessId(req)
        
        const stocks = await getAllStockItems(businessId);
        res.status(200).json(stocks);
    } catch (error) {
        Logger.error('StockController Error: Error fetching stocks:', error);
        res.status(500).json({ message: 'Error fetching stock items' });
    }
};

/**
 * Controller to create a new stock item tagged with the business ID
 */
const createStockItem = async (req, res) => {
    try {
        const newItemData = req.body;
        const businessId = getBusinessId(req)
        console.log(newItemData)

        // Basic validation
        if (!newItemData || !newItemData.name || !newItemData.quantity || !newItemData.price || !newItemData.costPrice) {
            return res.status(400).json({ message: 'Missing required item data (All fields are mandatory).' });
        }
        newItemData.quantity = parseInt(newItemData.quantity, 10);
        newItemData.price = parseFloat(newItemData.price);
        newItemData.costPrice = parseFloat(newItemData.costPrice);

        // --- CLOUDINARY UPLOAD LOGIC ---
        if (req.file) {
            const folderPath = `products/${businessId}`;
            const result = await streamUpload(req.file.buffer, folderPath);
            // Save the secure Cloudinary URL to Firestore
            newItemData.imageUrl = result.secure_url; 
        } else {
            newItemData.imageUrl = null;
        }

        const newItem = await addStockItem(newItemData, businessId);
        res.status(201).json(newItem);
    } catch (error) {
        Logger.error('StockController Error: Error adding stock item:', error);
        res.status(500).json({ message: 'Error adding stock item' });
    }
};

// === PUBLIC GALLERY===
/**
 * Controller to fetch public-facing stock items 
 * Strips out sensitive data like cost price
 */
const getPublicStocks = async (req, res)=>{
    try{
        const businessId = req.params.businessId;

        if(!businessId){
            res.status(400).json({message: `Business ID is required to view gallery.`})
        }
        const stocks = await getAllStockItems(businessId);

        const publicStocks = stocks.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl || null
        }));

        res.status(200).json(publicStocks);
    }catch(err){
        Logger.error(`StockController: Error fetching public stocks: `, err);
        res.status(500).json({message: `Error fetching gallery items`});
    };
};

/**
 * Controller to update a stock item after verifying business ownership
 */
const updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const updatedData = req.body;
        const businessId = getBusinessId(req)

        if (typeof itemId !== 'string' || itemId.trim() === '') {
            return res.status(400).json({ message: 'Invalid item ID provided.' });
        }

        if (!updatedData || !updatedData.name || !updatedData.quantity || !updatedData.price) {
             return res.status(400).json({ message: 'Missing required item data for update.' });
        }

        updatedData.quantity = parseInt(updatedData.quantity, 10);
        updatedData.price = parseFloat(updatedData.price);
        if (updatedData.costPrice) {
            updatedData.costPrice = parseFloat(updatedData.costPrice);
        }

        // --- CLOUDINARY UPDATE LOGIC ---
        if (req.file) {
            const folderPath = `products/${businessId}`;
            const result = await streamUpload(req.file.buffer, folderPath);
            updatedData.imageUrl = result.secure_url;
        }

        const updatedItem = await updateStockItem(itemId, updatedData, businessId);

        if (updatedItem) {
            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found or unauthorized.' });
        }
    } catch (error) {
        Logger.error('StockController Error: Error updating stock item:', error);
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating stock item' });
    }
};

/**
 * Controller to delete a stock item after verifying business ownership
 */
const deleteStock = async (req, res) => {
    try {
        const itemId = req.params.id;
        const businessId = getBusinessId(req)

        if (typeof itemId !== 'string' || itemId.trim() === '') {
            Logger.warn('StockController: Invalid item ID provided for deletion:', itemId);
            return res.status(400).json({ message: 'Invalid item ID provided for deletion.' });
        }

        // --- CLOUDINARY DELETION LOGIC ---
        const allStocks = await getAllStockItems(businessId);
        const itemToDelete = allStocks.find(item => item.id === itemId);

        if (itemToDelete && itemToDelete.imageUrl) {
            try {
                // Extract the public_id from the Cloudinary URL to delete it properly
                const urlParts = itemToDelete.imageUrl.split('/');
                const fileNameWithExt = urlParts.pop(); 
                const businessIdFolder = urlParts.pop(); 
                const productsFolder = urlParts.pop(); 
                const fileName = fileNameWithExt.split('.')[0]; 
                
                const publicId = `${productsFolder}/${businessIdFolder}/${fileName}`;
                
                await cloudinary.uploader.destroy(publicId);
                Logger.log(`StockController: Successfully deleted orphaned image from Cloudinary: ${publicId}`);
            } catch (imageErr) {
                Logger.error(`StockController: Failed to delete image for item ${itemId}:`, imageErr);
            }
        }

        const success = await deleteStockItem(itemId, businessId);
        if (success) {
            Logger.log(`StockController: Item ID ${itemId} successfully deleted by user ${req.session.userId} for business ${businessId}.`);
            res.status(200).json({ message: 'Item deleted successfully' });
        } else {
            Logger.warn(`StockController: Item ID ${itemId} not found for deletion.`);
            res.status(404).json({ message: 'Item not found' });
        }      
    } catch (err) {
        Logger.error(`StockController: Error deleting item with ID: ${req.params.id}`, err);
        if (err.message.includes('Unauthorized')) {
            return res.status(403).json({ message: err.message });
        }
        res.status(500).json({ message: 'Internal server error during deletion.' });
    }
}

export {
    getStocks,
    createStockItem,
    updateItem,
    deleteStock,
    getPublicStocks
};