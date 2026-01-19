import formData from 'form-data';
import Mailgun from 'mailgun.js';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private mailgun: any;
  private mg: any;
  private fromEmail: string;
  private domain: string;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY;
    this.domain = process.env.MAILGUN_DOMAIN || '';
    this.fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${this.domain}`;

    // Check if Mailgun is configured
    this.enabled = !!(apiKey && this.domain);

    if (this.enabled) {
      this.mailgun = new Mailgun(formData);
      this.mg = this.mailgun.client({
        username: 'api',
        key: apiKey!,
      });
    } else {
      console.warn('⚠️  Mailgun not configured. Email functionality will be disabled.');
      console.warn('   Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables to enable email sending.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.enabled) {
      console.log(`📧 [Email Not Sent - Mailgun Disabled] To: ${options.to}, Subject: ${options.subject}`);
      console.log(`   Message: ${options.text}`);
      return false;
    }

    try {
      const messageData = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      };

      await this.mg.messages.create(this.domain, messageData);
      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
    const subject = 'Password Reset Request';
    const text = `
Hello,

You requested a password reset for your F1 Predictions account.

Your password reset code is: ${resetCode}

This code will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
F1 Predictions Team
    `.trim();

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your F1 Predictions account.</p>
      <p><strong>Your password reset code is: ${resetCode}</strong></p>
      <p>This code will expire in 1 hour.</p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>F1 Predictions Team</p>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export a singleton instance
export const emailService = new EmailService();
