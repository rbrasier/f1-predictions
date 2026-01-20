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

  async sendFeedbackNotificationEmail(options: {
    type: 'bug' | 'feature';
    title: string;
    description: string;
    display_name: string;
    feedbackId: number;
  }): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.warn('⚠️  ADMIN_EMAIL not configured. Feedback notification will not be sent.');
      return false;
    }

    const typeLabel = options.type === 'bug' ? 'Bug Report' : 'Feature Request';
    const subject = `New ${typeLabel}: ${options.title}`;
    const text = `
New ${typeLabel} Submitted

ID: ${options.feedbackId}
Submitted by: ${options.display_name}
Type: ${options.type}

Title: ${options.title}

Description:
${options.description}

View in admin panel to manage this feedback.
    `.trim();

    const html = `
      <h2>New ${typeLabel} Submitted</h2>
      <p><strong>ID:</strong> ${options.feedbackId}</p>
      <p><strong>Submitted by:</strong> ${options.display_name}</p>
      <p><strong>Type:</strong> ${options.type}</p>
      <h3>Title</h3>
      <p>${options.title}</p>
      <h3>Description</h3>
      <p style="white-space: pre-wrap;">${options.description}</p>
      <p><em>View in admin panel to manage this feedback.</em></p>
    `;

    return this.sendEmail({ to: adminEmail, subject, text, html });
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export a singleton instance
export const emailService = new EmailService();

// Export convenience functions
export const sendPasswordResetEmail = (email: string, resetCode: string) =>
  emailService.sendPasswordResetEmail(email, resetCode);

export const sendFeedbackNotificationEmail = (options: {
  type: 'bug' | 'feature';
  title: string;
  description: string;
  display_name: string;
  feedbackId: number;
}) => emailService.sendFeedbackNotificationEmail(options);
