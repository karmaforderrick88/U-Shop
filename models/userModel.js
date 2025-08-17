import { db } from '../firebase.js';
import bcrypt from 'bcryptjs';

const usersCollection = db.collection('users');

export const userModel = {
    // Find user by username
    findByUsername: async (username) => {
        const snapshot = await usersCollection.where('username', '==', username).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    // Find user by ID
    findById: async (id) => {
        const doc = await usersCollection.doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    // Verify password
    verifyPassword: async (password, hashedPassword) => {
        return await bcrypt.compare(password, hashedPassword);
    },

    // Get all users (for admin purposes)
    getAllUsers: async () => {
        const snapshot = await usersCollection.get();
        return snapshot.docs.map(doc => {
            const { username, role, name } = doc.data();
            return { id: doc.id, username, role, name };
        });
    },

    // Add a new user (optional, for admin/owner use)
    addUser: async ({ username, password, role, name }) => {
        const hashedPassword = await bcrypt.hash(password, 12);
        const userDoc = await usersCollection.add({ username, password: hashedPassword, role, name });
        return { id: userDoc.id, username, role, name };
    }
}; 