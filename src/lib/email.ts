
import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    name: string
) {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT ||
        !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration is missing');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.sendMail({
            from: `"TravelEase" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Hi ${name},</h2>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" 
             style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}