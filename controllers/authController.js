import { userModel } from "../models/userModel.js";
import { sendResetEmail } from "../utils/email.js";
import crypto from 'crypto';
import Logger from "../utils/logger.js";

const loginForm = 'auth/login'

export const loginPage = (req, res) => {
    res.render(loginForm, { layout: false, pageTitle: 'Login' });
};

export const registerPage = (req, res) => {
    res.render('auth/register', { layout: false, pageTitle: 'Register' });
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    
    // Validate input before proceeding
    if (!username || !password) {
        return res.status(401).render(loginForm, { 
            layout: false, 
            pageTitle: 'Login', 
            error: 'Username and password are required.' 
        });
    }

    try {
        const user = await userModel.findByUsername(username);

        if (!user) {
            // Log failed attempt (without sensitive data)
            Logger.warn(`Failed login attempt for username: ${username} from IP: ${req.ip}`);
            return res.status(401).render(loginForm, { 
                layout: false, 
                pageTitle: 'Login', 
                error: 'Invalid username or password.' 
            });
        }

        const valid = await userModel.verifyPassword(password, user.password);

        if (!valid) {
            Logger.warn(`Failed login attempt for user: ${username} from IP: ${req.ip}`);
            return res.status(401).render(loginForm, { 
                layout: false, 
                pageTitle: 'Login', 
                error: 'Invalid username or password.' 
            });
        }

        //  Regenerate session ID to prevent session fixation
        req.session.regenerate(async (err) => {
            if (err) {
                Logger.error('Session regeneration error:', err);
                return res.render(loginForm, {
                    layout: false,
                    pageTitle: 'Login',
                    error: 'There was an error logging you in. Please try again.'
                });
            }

            // Set session data after regeneration
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.username = user.username;
            req.session.employerId = user.employerId || null;

            // Log successful login
            Logger.info(`User logged in: ${username} (${user.role}) from IP: ${req.ip}`);

            req.session.save((err) => {
                if (err) {
                    Logger.error('Session save error:', err);
                    return res.render(loginForm, {
                        layout: false,
                        pageTitle: 'Login',
                        error: 'There was an error logging you in. Try again.'
                    });
                }
                res.redirect('/');
            });
        });

    } catch (err) {
        Logger.error('Login Error:', err);
        res.render(loginForm, { 
            layout: false, 
            pageTitle: 'Login', 
            error: 'An error occurred during login.' 
        });
    }
};

export const forgotPasswordPage = (req, res) => {
    res.render('auth/forgotPassword', { layout: false, pageTitle: 'Reset Password' });
};

export const ForgortPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email || !email.includes('@')) {
            return res.render('auth/forgotPassword', {
                layout: false,
                pageTitle: 'Reset Password',
                error: 'Please enter a valid email address.'
            });
        }

        const user = await userModel.findByEmail(email);

        if (user) {
            const token = crypto.randomBytes(20).toString('hex');
            const expires = Date.now() + 900000; // 15 minutes

            await userModel.updateResetToken(user.id, token, expires);
            await sendResetEmail(user.email, token);
            
            Logger.info(`Password reset email sent to: ${email} from IP: ${req.ip}`);
        } else {
            // Log email not found 
            Logger.warn(`Password reset attempted for non-existent email: ${email} from IP: ${req.ip}`);
        }

        //  show success message to prevent user enumeration
        res.render('auth/forgotPassword', {
            layout: false,
            pageTitle: 'Reset Password',
            message: 'If an account exists with that email, a reset link has been sent.'
        });
    } catch (err) {
        Logger.error('Forgot Password error:', err);
        res.status(500).render('auth/forgotPassword', { 
            layout: false, 
            pageTitle: 'Reset Password', 
            error: 'Internal server error' 
        });
    }
};

export const resetPasswordPage = async (req, res) => {
    const { token } = req.query;
    
    //  Validate token presence
    if (!token) {
        return res.render('auth/forgotPassword', {
            layout: false,
            pageTitle: 'Reset Password',
            error: 'Invalid reset link. Please request a new one.'
        });
    }
    
    res.render('auth/resetPasswordForm', { layout: false, token });
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        // Validate inputs
        if (!token) {
            return res.render('auth/forgotPassword', {
                layout: false,
                pageTitle: 'Reset Password',
                error: 'Invalid reset token. Please request a new password reset.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/resetPasswordForm', {
                layout: false,
                token,
                error: 'Passwords do not match.'
            });
        }

        //  Password strength validation
        if (password.length < 8) {
            return res.render('auth/resetPasswordForm', {
                layout: false,
                token,
                error: 'Password must be at least 8 characters long.'
            });
        }

        // Find user by token and check expiry
        const user = await userModel.findByResetToken(token);

        if (!user || !user.resetTokenExpires || user.resetTokenExpires < Date.now()) {
            Logger.warn(`Invalid/expired password reset token attempt from IP: ${req.ip}`);
            return res.render('auth/forgotPassword', {
                layout: false,
                pageTitle: 'Reset Password',
                error: 'Password reset token is invalid or has expired.'
            });
        }

        // Update password and wipe the token fields
        await userModel.updatePassword(user.id, password);
        await userModel.clearResetToken(user.id);

        Logger.info(`Password reset successful for user: ${user.username} from IP: ${req.ip}`);

        res.render(loginForm, {
            layout: false,
            pageTitle: 'Login',
            message: 'Password successfully updated! Please log in.'
        });

    } catch (err) {
        Logger.error('Reset Password Error:', err);
        res.status(500).send('Internal Server Error');
    }
};

export const logout = (req, res) => {
    // Log logout
    if (req.session?.username) {
        Logger.info(`User logged out: ${req.session.username} from IP: ${req.ip}`);
    }
    
    req.session.destroy(() => {
        res.redirect('/login');
    });
};