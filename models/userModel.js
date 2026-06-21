import { db } from '../firebase.js';
import bcrypt from 'bcryptjs';

const usersCollection = db.collection('users');
const invitesCollection = db.collection('registrationInvites')
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

    // Find user by email
    findByEmail: async (email) => {
        const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    // Find user by reset token
    findByResetToken: async (token) => {
        const snapshot = await usersCollection.where('resetToken', '==', token).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    // This updates the user record with the security token
    updateResetToken: async (userId, token, expires) => {
        await usersCollection.doc(userId).update({
            resetToken: token,
            resetTokenExpires: expires
        });
    },

    // Update password (with hashing)
    updatePassword: async (userId, newPassword) => {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await usersCollection.doc(userId).update({
            password: hashedPassword
        });
    },

    // Clear reset token after use
    clearResetToken: async (userId) => {
        await usersCollection.doc(userId).update({
            resetToken: null,
            resetTokenExpires: null
        });
    },

    // Get all users (for admin purposes)
    getAllUsers: async () => {
        const snapshot = await usersCollection.get();
        return snapshot.docs.map(doc => {
            const { username, role, email } = doc.data();
            return { id: doc.id, username, role, email };
        });
    },

    /**
     * Stores a temporary registration invite.
     * We use a separate collection to keep 'pending' registrations 
     * away from active user accounts.
     */
createRegistrationInvite:async (email,token,expires) =>{
    await invitesCollection.doc(token).set({
        email,
        token,
        expires,
        createdAt: new Date()
    });
},
findInviteByToken: async(token) =>{
    const doc = await invitesCollection.doc(token).get();
    if(!doc.exists) return null;

    const data = doc.data();
    if(new Date() > data.expires.toDate()) return null

    return data;
},

    /**
     * Updated addUser to support linking to an employer
     */
    addUser: async ({ username, password, role, email, name, employerId = null }) => {
    
        const hashedPassword = await bcrypt.hash(password, 12);
        const userDoc = await usersCollection.add({ 
            username, 
            password: hashedPassword, 
            role, 
            email, 
            name,
            employerId, // This links the employee to the owner
            createdAt: new Date()
        });
        return { id: userDoc.id, username, role, email }
         
        
    },
    //delete used invite when registering
deleteInvite: async (token) => {
    await invitesCollection.doc(token).delete();
}
}