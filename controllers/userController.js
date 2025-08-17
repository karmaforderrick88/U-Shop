import { userModel } from '../models/userModel.js';
import logger from '../utils/logger.js';
export const createUser = async (req, res) => {
    try {
        const { username, password, role, name } = req.body;
        if (!username || !password || !role || !name) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        // Check for duplicate username
        const existing = await userModel.findByUsername(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already exists.' });
        }
        const user = await userModel.addUser({ username, password, role, name });
        res.status(201).json({ message: 'User created successfully.', user });
    } catch (err) {
        logger.error('Error creating user:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
}; 