import { getAllSales, addNewSale, getTodaysTotalSales, getSalesSummaryData } from '../models/salemodel.js'; 
import { getTotalDebts } from '../models/debtModel.js';
import logger from '../utils/logger.js';

// Controller function to get all sales items
const getSales = async (req, res) => {
    logger.log('SaleController: Received request for all sales.');
    try {
        const sales = await getAllSales(); 
        res.status(200).json(sales); 
    } catch (error) {
        logger.error('SaleController Error: Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales items' });
    }
};

// Controller function to add a new sale item
const createNewSale = async (req, res) => {
    logger.log('SaleController: Received request to create sale item:', req.body);
    try {
        const { productId, productName, quantity, unitPrice, saleDate, paymentMode } = req.body;

        // Server-side validation
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            logger.warn('SalesController: Missing or invalid productId in request.');
            return res.status(400).json({ message: 'Product ID is required.' });
        }
        if (!productName || typeof productName !== 'string' || productName.trim() === '') {
            logger.warn('SalesController: Missing or invalid productName in request.');
            return res.status(400).json({ message: 'Product name is required.' });
        }
        if (isNaN(quantity) || quantity <= 0) {
            logger.warn('SalesController: Invalid quantity in request.');
            return res.status(400).json({ message: 'Quantity must be a positive number.' });
        }
        // unitPrice is the actual price sold, not necessarily from stock
        if (isNaN(unitPrice) || unitPrice < 0) {
            logger.warn('SalesController: Invalid unitPrice in request.');
            return res.status(400).json({ message: 'Unit price must be a non-negative number.' });
        }
        if (saleDate && (typeof saleDate !== 'string' || saleDate.trim() === '')) {
             logger.warn('SalesController: Invalid saleDate provided.');
             return res.status(400).json({ message: 'Sale date must be a valid string or omitted.' });
        }
        if (!paymentMode || typeof paymentMode !== 'string' || paymentMode.trim() === '') {
            logger.warn('SalesController: Missing or invalid paymentMode in request.');
            return res.status(400).json({ message: 'Payment mode is required.' });
        }

       

        //  Assemble the sale data for the model 
        const newSaleData = {
            productId: productId, 
            productName: productName,
            quantity: quantity,
            unitPrice: unitPrice, 
            saleDate: saleDate,
            paymentMode: paymentMode
        };

        logger.log('SalesController: Prepared new sale data for model:', newSaleData);

        //  Add the sale using the model function (which handles stock deduction via transaction)
        const addedSale = await addNewSale(newSaleData);
        logger.log(`SalesController: New sale added with ID: ${addedSale.id}`);
        res.status(201).json(addedSale);

    } catch (error) {
        logger.error('SalesController Error: Error creating new sale:', error);
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ message: error.message });
        } else if (error.message.includes('Stock item not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error adding sales record.' });
    }
};

// Controller function to get today's total sales
const getTodaysTotal = async (req, res) => {
    logger.log('SalesController: Received request for today\'s total sales.');
    try {
        const total = await getTodaysTotalSales();
        res.status(200).json({ total }); 
    } catch (error) {
        logger.error('SalesController Error: Error fetching today\'s total:', error);
        res.status(500).json({ message: 'Error fetching today\'s total sales' });
    }
};

// Controller function to get sales summary
const getSalesSummary = async (req, res) => {
    try {
        // Aggregate sales summary data
        const summary = await getSalesSummaryData();
        // Aggregate total debts
        const totalDebts = await getTotalDebts();
        res.status(200).json({ ...summary, totalDebts });
    } catch (error) {
        logger.error('SalesController Error: Error fetching sales summary:', error);
        res.status(500).json({ message: 'Error fetching sales summary' });
    }
};

export {
    getSales,
    createNewSale,
    getTodaysTotal,
    getSalesSummary
};


