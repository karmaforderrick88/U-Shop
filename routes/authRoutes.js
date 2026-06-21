import express from 'express';
import { loginPage, login, logout, registerPage} from '../controllers/authController.js';
import {  registerRequest, completeRegistrationPage, completeRegistration } from '../controllers/userController.js';
import { forgotPasswordPage, ForgortPassword, resetPasswordPage, resetPassword } from '../controllers/authController.js';
import { authLimiter, passwordResetLimiter, registrationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public registration flow
router.get('/register', registerPage);
router.post('/register/request', registerRequest); // Add limiter here


// Complete registration
router.get('/complete-registration', completeRegistrationPage);
router.post('/complete-registration', completeRegistration);

// Login routes
router.get('/login', loginPage);
router.post('/login', authLimiter,login); // Add limiter here
router.get('/logout', logout);

// Password reset routes
router.get('/forgot-password', forgotPasswordPage);
router.post('/forgot-password',  ForgortPassword); // Add limiter here
router.get('/reset-password', resetPasswordPage);
router.post('/reset-password', resetPassword);

export default router;