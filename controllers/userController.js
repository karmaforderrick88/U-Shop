import { userModel } from '../models/userModel.js';
import Logger from '../utils/logger.js';
import crypto from 'crypto'
import { sendRegistrationEmail } from '../utils/email.js';

/**
 * Handles the creation of new users, supporting both public registration
 * and internal employee creation (with automatic linking).
 */
/**
 * Handles the initial registration request.
 * Validates email, checks for existing users, creates a secure token,
 * and sends an invite email.
 */
export const registerRequest = async (req, res) => {

    const isAjaxRequest = req.xhr || req.headers.accept?.includes('json');
    
    try {
        const { email } = req.body;
        
        const Msg = 'If provided email exists, a verification link has been sent';
        
        // 1. Basic Validation
        if (!email || !email.includes('@')) {
            const errorMsg = 'Please enter a valid email address.';
            
            // Check AJAX first
            if (isAjaxRequest) {
                return res.status(400).json({ error: errorMsg });
            }
            // Then check API route
            if (req.path.startsWith('/api/')) {
                return res.status(400).json({ error: errorMsg });
            }
            // Finally, render HTML
            return res.render('auth/register', {
                layout: false,
                pageTitle: 'Register',
                error: errorMsg
            });
        }

        // 2. Check for duplicate email in active users
        const existing = await userModel.findByEmail(email);
        if (existing) {
            // For security, don't reveal if email exists
            if (isAjaxRequest) {
                return res.status(200).json({ message: Msg });
            }
            if (req.path.startsWith('/api/')) {
                return res.status(200).json({ message: Msg });
            }
            return res.render('auth/register', {
                layout: false,
                pageTitle: 'Register',
                success: Msg // Use success for security
            });
        }

        // 3. Generate secure token and expiry (1 hour)
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1);

        // 4. Store the invite in the 'registrationInvites' collection
        await userModel.createRegistrationInvite(email, token, expires);

        // 5. Send the registration email
        await sendRegistrationEmail(email, token);

        Logger.info(`Registration invite sent to: ${email}`);

        // 6. Handle Response
        if (isAjaxRequest) {
            return res.status(200).json({ message: Msg });
        }
        if (req.path.startsWith('/api/')) {
            return res.status(200).json({ message: Msg });
        }
        return res.render('auth/register', {
            layout: false,
            pageTitle: 'Register',
            success: Msg
        });

    } catch (err) {
        Logger.error('Error in registerRequest:', err);
        const errorMsg = 'An error occurred. Please try again later.';
        
        if (isAjaxRequest) {
            return res.status(500).json({ error: errorMsg });
        }
        if (req.path.startsWith('/api/')) {
            return res.status(500).json({ error: errorMsg });
        }
        return res.render('auth/register', {
            layout: false,
            pageTitle: 'Register',
            error: errorMsg
        });
    }
};
export const createEmpUser = async (req, res) => {
    try {
        const { username, password, role, email, name } = req.body;
        const isApi = req.path.startsWith('/api/')
        
        // 1. Validate required fields
        if (!username || !password || !role || !email || !name) {
            const errorMsg = 'All fields are required.';
            if (isApi) return res.status(400).json({ error: errorMsg });
            return res.render('auth/register', { 
                layout: false, 
                pageTitle: 'Register', 
                error: errorMsg 
            });
        }

        // 2. Check for duplicate username or email
        const [existingUser,existingEmail] = await Promise.all([
            userModel.findByUsername(username),
            userModel.findByEmail(email)]);

        if (existingUser || existingEmail) {
            const errorMsg = existingUser? 'User already exists':'Email is already in use';
            if (isApi) return res.status(400).json({ error: errorMsg });
            
            return res.render('auth/register', { 
                layout: false, 
                pageTitle: 'Register', 
                error: errorMsg 
            });
        }
        

        /**
         * If an existing user (Owner/Admin) is creating this account, 
         * we link the new user to the creator's business.
         * If it's a public registration (no session), employerId remains null.
         */
        let employerId = null;
        if (req.session && req.session.userId && (req.session.role === 'owner' || req.session.role === 'admin')) {
            employerId = req.session.userId;
        }

        // 4. Save to Database
        const user = await userModel.addUser({ 
            username, 
            password, 
            role, 
            email, 
            name,
            employerId 
        });

        Logger.info(`User created: ${username}. Role: ${role}. Linked to Business ID: ${employerId || 'Self'}`);

        // 5. Handle Redirection/Response
        if (req.path.startsWith('/api/')) {
            return res.status(201).json({ message: 'User created successfully.', user });
        }
        
    
        res.redirect('/login');
        
    } catch (err) {
        Logger.error('Error creating user:', err);
        if (req.path.startsWith('/api/')) {
            return res.status(500).json({ error: 'Internal server error.' });
        }
        res.status(500).send('Internal server error.');
    }
};

export const completeRegistrationPage = async (req, res) => {
    const { token } = req.query;
    
    try {
        // Verify token is valid before showing form
        const invite = await userModel.findInviteByToken(token);
        
        if (!invite) {
            return res.render('auth/register', {
                layout: false,
                pageTitle: 'Register',
                error: 'Invalid or expired registration link. Please request a new one.'
            });
        }
        
        // Show the registration completion form with email pre-filled
        res.render('auth/completeRegistration', {
            layout: false,
            pageTitle: 'Complete Registration',
            email: invite.email,
            token
        });
    } catch (err) {
        Logger.error('Error in completeRegistrationPage:', err);
        res.status(500).send('Internal server error');
    }
};

export const completeRegistration = async (req, res) => {
    try {
        const { token, username, password, name } = req.body;
        

        const [invite, existingUser] = await Promise.all([
            userModel.findInviteByToken(token),
            userModel.findByUsername(username)
        ]) ;

        //verify token
        if (!invite) {
            return res.render('auth/register', {
                layout: false,
                pageTitle: 'Register',
                error: 'Invalid or expired registration link. Please request a new one.'
            });
        }
        
        //verify non-duplicate username
        if (existingUser) {
            return res.render('auth/completeRegistration', {
                layout: false,
                pageTitle: 'Complete Registration',
                email: invite.email,
                token,
                error: 'Username already exists.'
            });
        }
        
        // Create the user (as emmployer/admin role by default for public registration)
        const user = await userModel.addUser({
            username,
            password,
            role: 'admin', // Public registrations default to admin
            email: invite.email,
            name,
            employerId: null
        });
        
        // Delete the used invite
        await userModel.deleteInvite(token);
        
        // Redirect to login with success message
        res.render('auth/login', {
            layout: false,
            pageTitle: 'Login',
            message: 'Registration successful! Please log in.'
        });
        
    } catch (err) {
        Logger.error('Error in completeRegistration:', err);
        res.status(500).send('Internal server error');
    }
};