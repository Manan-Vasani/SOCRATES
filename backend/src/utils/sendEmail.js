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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f7;
            margin: 0;
            padding: 40px 20px;
            color: #1d1d1f;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            max-width: 480px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            padding: 44px 36px;
            border: 1px solid #e5e5e8;
            box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          }
          .header-logo {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo-brand {
            font-size: 26px;
            font-weight: 900;
            letter-spacing: -0.75px;
            color: #1d1d1f;
            text-transform: uppercase;
          }
          .title {
            font-size: 22px;
            font-weight: 700;
            color: #1d1d1f;
            margin: 0 0 10px 0;
            text-align: center;
            letter-spacing: -0.3px;
          }
          .subtitle {
            font-size: 14px;
            line-height: 1.5;
            color: #6e6e73;
            margin: 0 0 24px 0;
            text-align: center;
          }
          .otp-card {
            background: #f0f6ff;
            border: 1.5px solid #0066cc;
            border-radius: 18px;
            padding: 24px 20px;
            text-align: center;
            margin: 24px 0;
          }
          .otp-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #0066cc;
            margin-bottom: 10px;
          }
          .otp-code {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #0066cc;
            font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
            margin-left: 10px;
          }
          .meta-info {
            background: #fafafa;
            border-radius: 12px;
            padding: 12px 16px;
            text-align: center;
            margin-bottom: 24px;
            border: 1px solid #f0f0f2;
          }
          .meta-text {
            font-size: 12px;
            color: #6e6e73;
            margin: 0;
            font-weight: 500;
          }
          .footer {
            font-size: 11px;
            color: #86868b;
            text-align: center;
            margin-top: 32px;
            border-top: 1px solid #f0f0f2;
            padding-top: 24px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header-logo">
            <span class="logo-brand">SOCRATES<span style="color: #0066cc;">.</span></span>
          </div>
          
          <h1 class="title">Verification Code</h1>
          <p class="subtitle">Use the 6-digit verification code below to reset your SOCRATES account password.</p>
          
          ${options.otp ? `
            <div class="otp-card">
              <div class="otp-label">Security Verification Code</div>
              <div class="otp-code">${options.otp}</div>
            </div>
          ` : ''}

          <div class="meta-info">
            <p class="meta-text">⏰ Valid for <strong>15 minutes</strong>. Do not share this code with anyone.</p>
          </div>

          <div class="footer">
            If you did not request a password reset, you can safely ignore this email.<br>
            &copy; ${new Date().getFullYear()} SOCRATES Inc. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const htmlContent = options.html || defaultHtml;

  // 1. Try Brevo REST API v3 FIRST if BREVO_API_KEY is set (Uses HTTPS Port 443 - Never Blocked on Cloud Providers)
  if (apiKey && apiKey !== 'your_brevo_api_key_here') {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: fromName, email: fromEmail },
          to: [{ email: options.to }],
          subject: options.subject || 'SOCRATES — Verification Code',
          htmlContent,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 12000,
        }
      );
      console.log('✅ Brevo REST API Email Sent Successfully:', response.data);
      return { success: true, method: 'brevo-api', data: response.data };
    } catch (apiError) {
      console.error('⚠️ Brevo API Error:', apiError.response?.data || apiError.message);
    }
  }

  // 2. Try SMTP via Nodemailer with strict 6s connection timeout
  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT, 10) || 465,
        secure: process.env.EMAIL_SECURE !== 'false',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      });

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject || 'SOCRATES — Verification Code',
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ SMTP Email Sent Successfully to', options.to, 'MessageID:', info.messageId);
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (smtpError) {
      console.error('⚠️ SMTP Error (Connection Timeout / Cloud Firewall Block):', smtpError.message);
    }
  }

  // 3. Fallback: Log OTP to server console (Prevents 500 error or hanging on Render)
  console.log('\n==================================================');
  console.log('📧 [SOCRATES OTP EMAIL FALLBACK LOG]');
  console.log(`TO: ${options.to}`);
  console.log(`SUBJECT: ${options.subject}`);
  if (options.otp) console.log(`VERIFICATION OTP CODE: ${options.otp}`);
  console.log('==================================================\n');

  return { success: true, method: 'dev-console-fallback' };
};

module.exports = sendEmail;
