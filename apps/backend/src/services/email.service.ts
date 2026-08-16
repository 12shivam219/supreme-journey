import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  static async sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}?resetToken=${resetToken}`;
    const fromAddress = process.env.SMTP_FROM || 'noreply@tracker.family';

    try {
      await this.transporter.sendMail({
        from: `"Tracker Family Safety" <${fromAddress}>`,
        to: toEmail,
        subject: 'Reset Your Tracker Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
            <h2 style="color: #0284c7;">Password Reset Request</h2>
            <p>You requested a password reset for your Tracker account.</p>
            <p>Click the button below to set a new password. This link is valid for 1 hour:</p>
            <div style="margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      return true;
    } catch (err) {
      console.error('[EmailService Error]', err);
      return false;
    }
  }
  static async sendMail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;
    const fromAddress = process.env.SMTP_FROM || 'noreply@tracker.family';
    try {
      await this.transporter.sendMail({
        from: `"Tracker Family Safety" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (err) {
      console.error('[EmailService Error]', err);
      return false;
    }
  }

  static async sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
    return this.sendMail(options);
  }
}
