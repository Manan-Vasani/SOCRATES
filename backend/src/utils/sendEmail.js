const axios = require('axios');
const nodemailer = require('nodemailer');

/**
 * Send Email via Gmail SMTP, Brevo API, or Brevo SMTP
 * @param {Object} options - { to, subject, html, text, otp, resetUrl, userName }
 */
const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const gmailUser = process.env.EMAIL_USER || 'mananvasani801@gmail.com';
  const gmailPass = process.env.EMAIL_PASS || 'hrzjpizzwrcktush';
  const fromEmail = process.env.EMAIL_FROM || gmailUser || 'mananvasani801@gmail.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'SOCRATES';

  const defaultHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; margin: 0; padding: 40px 20px; color: #1d1d1f; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #e5e5e5; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .logo { text-align: center; margin-bottom: 28px; }
          .logo-text { font-size: 24px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.5px; }
          .dot { color: #0066cc; }
          h1 { font-size: 22px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px; text-align: center; }
          p { font-size: 14px; line-height: 1.6; color: #515154; margin-bottom: 24px; text-align: center; }
          .otp-box { background: #f0f6ff; border: 1px solid #cce0ff; border-radius: 16px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0066cc; font-family: monospace; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn { display: inline-block; background-color: #0066cc; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 14px 32px; text-decoration: none; border-radius: 12px; transition: background-color 0.2s; }
          .footer { font-size: 12px; color: #86868b; text-align: center; margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <span class="logo-text">SOCRATES<span class="dot">.</span></span>
          </div>
          <h1>Password Reset Request</h1>
          <p>Hello ${options.userName || 'Learner'},</p>
          <p>We received a request to reset the password for your SOCRATES account. Use the 6-digit verification code below to complete your password reset:</p>
          
          ${options.otp ? `
            <div class="otp-box">
              <div class="otp-code">${options.otp}</div>
            </div>
          ` : ''}

          ${options.resetUrl ? `
            <div class="btn-container">
              <a href="${options.resetUrl}" class="btn">Reset My Password</a>
            </div>
          ` : ''}

          <p style="font-size: 12px; color: #86868b;">This code will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
          
          <div class="footer">
            &copy; ${new Date().getFullYear()} SOCRATES Inc. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const htmlContent = options.html || defaultHtml;

  // 1. Try Gmail SMTP via Nodemailer
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject || 'SOCRATES — Password Reset Request',
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Gmail SMTP Email Sent Successfully to', options.to, 'MessageID:', info.messageId);
      return { success: true, method: 'gmail-smtp', messageId: info.messageId };
    } catch (gmailError) {
      console.error('⚠️ Gmail SMTP Error:', gmailError.message);
    }
  }

  // 2. Try Brevo REST API v3 if BREVO_API_KEY is available
  if (apiKey && apiKey !== 'your_brevo_api_key_here') {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: fromName, email: fromEmail },
          to: [{ email: options.to }],
          subject: options.subject || 'SOCRATES — Password Reset Request',
          htmlContent,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      console.log('✅ Brevo REST API Email Sent Successfully:', response.data);
      return { success: true, method: 'brevo-api', data: response.data };
    } catch (apiError) {
      console.error('⚠️ Brevo API Error:', apiError.response?.data || apiError.message);
    }
  }

  // Fallback: Log OTP to console
  console.log('\n==================================================');
  console.log('📧 [DEVELOPMENT EMAIL FALLBACK]');
  console.log(`TO: ${options.to}`);
  console.log(`SUBJECT: ${options.subject}`);
  if (options.otp) console.log(`VERIFICATION OTP CODE: ${options.otp}`);
  if (options.resetUrl) console.log(`RESET URL: ${options.resetUrl}`);
  console.log('==================================================\n');

  return { success: true, method: 'dev-console-fallback' };
};

module.exports = sendEmail;
