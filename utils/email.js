import nodemailer from 'nodemailer'
import Logger from './logger.js'
import config from '../app/config.js'



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
})

export const sendResetEmail = async (email, token) => {
  
    const port = config.port || 3000
    const baseURL = config.BASE_URL //|| `http://localhost:${port}`  

    const resetURL = `${baseURL}/reset-password?token=${token}`
    const mailOptions = {
        from: `"Leah's Home Decors" <${config.emailUser}>`,
        to: email,
        subject: 'Password Reset Request',
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Password Reset</h2>
            <p>You requested a password reset for your account at Leah's Home Decors.</p>
            <p>Click the link below to set a new password. This link expires in 15 minutes.</p>
            <div style="margin: 20px 0;">
                <a href="${resetURL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset My Password</a>
            </div>
            <p style="font-size: 0.8em; color: #666;">If the button doesn't work, copy and paste this link: <br>${resetURL}</p>
        </div>
        `
    }

    try {
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        // This will log the specific reason (Auth, Connection, etc.) to your console
        Logger.error("Nodemailer Detailed Error:", error);
        throw error;
    }
}

export const sendRegistrationEmail = async (email,token )=> {

    const baseURL = config.BASE_URL;
    const registerURL = `${baseURL}/complete-registration?token=${token}`;

    const mailOptions = {
        from: `"Leah's Home Decors" <${config.emailUser}>`,
        to: email,
        subject: 'Complete Your Registration',
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Welcome to Leah's Home Decors!</h2>
            <p>Thank you for starting your registration. Please click the button below to complete your profile and set your password.</p>
            <div style="margin: 20px 0;">
                <a href="${registerURL}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Registration</a>
            </div>
            <p style="font-size: 0.8em; color: #666;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
        `
    }

    try{
        const result = await transporter.sendMail(mailOptions);
        return result;
    }
    catch(err){
        Logger.error('Nodemailer registration email error: ', err);
        throw err;
    }

}