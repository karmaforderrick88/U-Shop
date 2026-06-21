import { getAllSales, addNewSale, getTodaysTotalSales, getSalesSummaryData } from '../models/salemodel.js'; 
import { getTotalDebts } from '../models/debtModel.js';
import Logger from '../utils/logger.js';
import { getBusinessId } from '../utils/auth.js';

/**
 * Controller to get all sales for the logged-in user
 */

const getSales = async (req, res) => {
    Logger.log('SaleController: Received request for all sales.');
    try {
        const businessId = getBusinessId(req)
        const sales = await getAllSales(businessId); 
        res.status(200).json(sales); 
    } catch (error) {
        Logger.error('SaleController Error: Error fetching sales:', error);
        res.status(500).json({ message: 'Error fetching sales items' });
    }
};

/**
 * Controller to record a new sale
 */
const createNewSale = async (req, res) => {
    Logger.log('SaleController: Received request to create sale item:', req.body);
    try {
        const businessId = getBusinessId(req)
        const { productId, productName, quantity, unitPrice, saleDate, paymentMode } = req.body;

        // Server-side validation
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            return res.status(400).json({ message: 'Product ID is required.' });
        }
        if (!productName || typeof productName !== 'string' || productName.trim() === '') {
            return res.status(400).json({ message: 'Product name is required.' });
        }
        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive number.' });
        }
        if (isNaN(unitPrice) || unitPrice < 0) {
            return res.status(400).json({ message: 'Unit price must be a non-negative number.' });
        }
        if (!paymentMode || typeof paymentMode !== 'string' || paymentMode.trim() === '') {
            return res.status(400).json({ message: 'Payment mode is required.' });
        }

        const newSaleData = {
            productId,
            productName,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            saleDate,
            paymentMode
        };

        // Pass businessId to model to ensure they only sell their own stock
        const addedSale = await addNewSale(newSaleData, businessId);
        Logger.log(`SalesController: New sale recorded by user ${businessId} with ID: ${addedSale.id}`);
        res.status(201).json(addedSale);

    } catch (error) {
        Logger.error('SalesController Error:', error);
        if (error.message.includes('Insufficient stock')) {
            return res.status(400).json({ message: error.message });
        } else if (error.message.includes('Unauthorized')) {
            return res.status(403).json({ message: error.message });
        } else if (error.message.includes('Stock item not found')) {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error adding sales record.' });
    }
};

/**
 * Controller to get today's total sales summary
 */
const getTodaysTotal = async (req, res) => {
    try {
        const businessId = getBusinessId(req)
        const total = await getTodaysTotalSales(businessId);
        res.status(200).json({ total }); 
    } catch (error) {
        Logger.error('SalesController Error: Error fetching today\'s total:', error);
        res.status(500).json({ message: 'Error fetching today\'s total sales' });
    }
};

/**
 * Controller to get the dashboard summary
 */
const getSalesSummary = async (req, res) => {
    try {
        const businessId = getBusinessId(req)
        // Fetch summary data scoped to user
        const summary = await getSalesSummaryData(businessId);
        // Fetch total debts scoped to user
        const totalDebts = await getTotalDebts(businessId);
        
        res.status(200).json({ ...summary, totalDebts });
    } catch (error) {
        Logger.error('SalesController Error: Error fetching sales summary:', error);
        res.status(500).json({ message: 'Error fetching sales summary' });
    }
};
/*aggregated dashboard fetch*/
const getDashboardStats = async (req, res) => {
    try {
        const businessId = getBusinessId(req);
        
        // Execute all independent lookups in parallel
        const [todayTotal, summary] = await Promise.all([
            getTodaysTotalSales(businessId),
            getSalesSummaryData(businessId)
        ]);

        res.status(200).json({
            todayTotal,
            bestSellingProduct: summary.bestSellingProduct,
            monthlyIncome: summary.monthlyIncome
        });
    } catch (error) {
        Logger.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Error aggregating dashboard stats' });
    }
};
export {
    getSales,
    createNewSale,
    getTodaysTotal,
    getSalesSummary,
    getDashboardStats
};