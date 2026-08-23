/**
 * SOCRATES — Official Apple Design System Transactional Email Engine
 * Reference: docs/DESIGN-apple.md
 * 
 * Strict Apple Design Principles:
 * - Single Action Blue (#0066cc) interactive accent
 * - Ink (#1d1d1f) typography with SF Pro Display / Text hierarchy
 * - Canvas (#ffffff) and Parchment (#f5f5f7) surfaces with 1px hairline (#e5e5e7) borders
 * - Zero raw emojis — clean typography, subtle status chips, and crisp geometry
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

const baseEmailLayout = ({ title, previewText, content }) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #1d1d1f;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper { width: 100% !important; border-radius: 0px !important; border-left: none !important; border-right: none !important; }
      .content-padding { padding: 32px 20px !important; }
      .button-row { display: block !important; width: 100% !important; text-align: center !important; }
      .button-pill { display: block !important; width: 100% !important; margin: 8px 0 !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1d1d1f;">
  
  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText || title}
  </div>

  <!-- Main Background Container -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; padding: 48px 12px 64px 12px;">
    <tr>
      <td align="center">
        
        <!-- Apple Card Container -->
        <table class="email-wrapper" width="560" cellpadding="0" cellspacing="0" border="0" style="width: 560px; max-width: 560px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5e5e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
          
          <!-- Brand Header Strip -->
          <tr>
            <td align="center" style="padding: 36px 40px 20px 40px; background-color: #ffffff; border-bottom: 1px solid #f0f0f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: -0.4px; color: #1d1d1f; text-transform: uppercase;">
                      SOCRATES<span style="color: #0066cc;">.</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Email Body -->
          <tr>
            <td class="content-padding" style="padding: 36px 40px 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Apple Minimalist Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; background-color: #f5f5f7; border-top: 1px solid #e5e5e7; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.5; color: #86868b;">
                    SOCRATES Peer Mentorship & Socratic AI Platform<br>
                    <span style="font-size: 11px; color: #a1a1a6; margin-top: 4px; display: inline-block;">
                      &copy; ${new Date().getFullYear()} SOCRATES Inc. All rights reserved.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

/**
 * 1. Tutor Email: Session Booking Request (with Apple-standard Accept/Decline Pills)
 */
const buildTutorBookingRequestEmail = ({ booking, tutorName, studentName, studentEmail, approveUrl, declineUrl }) => {
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0066cc;">Session Request</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        New Tutoring Session Request
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        <strong>${studentName}</strong> has requested a session with you. Please accept or decline below.
      </p>
    </div>

    <!-- Details Card (Apple Store Utility Card Specification) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">Student</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${studentName}</td>
            </tr>
            ${studentEmail ? `
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Student Email</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 400; color: #1d1d1f;">${studentEmail}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.subject}</td>
            </tr>
            ${booking.topic ? `
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Topic / Goals</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 400; color: #1d1d1f;">${booking.topic}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Date</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Time</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Duration</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 400; color: #1d1d1f;">${booking.duration} minutes</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Session Fee</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 15px; font-weight: 600; color: #1d1d1f;">$${booking.fee}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Action Buttons (Apple Capsule Grammar) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center" class="button-row">
          <a href="${approveUrl}" class="button-pill" style="background-color: #0066cc; color: #ffffff !important; border-radius: 9999px; padding: 11px 26px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; margin: 4px 6px;">
            Accept Session
          </a>
          <a href="${declineUrl}" class="button-pill" style="background-color: #ffffff; color: #d70015 !important; border: 1px solid #e5e5e7; border-radius: 9999px; padding: 11px 22px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; margin: 4px 6px;">
            Decline
          </a>
        </td>
      </tr>
    </table>

    <!-- Quiet Informational Note -->
    <p style="font-size: 12px; line-height: 1.4; color: #86868b; text-align: center; margin: 0;">
      Accepting will immediately reserve your slot and send a confirmation email with study room details to ${studentName}.
    </p>
  `;

  return baseEmailLayout({
    title: `Session Request from ${studentName} — SOCRATES`,
    previewText: `${studentName} requested a session on ${booking.date} at ${booking.time}.`,
    content,
  });
};

/**
 * 2. Student Email: Booking Submitted & Pending Confirmation
 */
const buildStudentBookingPendingEmail = ({ booking, tutorName, studentName }) => {
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6e6e73;">Status: Pending</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        Booking Request Sent
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hi ${studentName}, your request has been forwarded to <strong>${tutorName}</strong> for confirmation.
      </p>
    </div>

    <!-- Booking Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">Tutor</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Date</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Time</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Duration</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 400; color: #1d1d1f;">${booking.duration} minutes</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Quiet Informational Note -->
    <p style="font-size: 13px; line-height: 1.5; color: #6e6e73; text-align: center; margin: 0;">
      We have notified <strong>${tutorName}</strong>. You will receive an email confirmation with your room link as soon as your tutor accepts.
    </p>
  `;

  return baseEmailLayout({
    title: `Booking Request Sent to ${tutorName} — SOCRATES`,
    previewText: `Your session request with ${tutorName} on ${booking.date} has been submitted.`,
    content,
  });
};

/**
 * 3. Student Email: Session Confirmed (Tutor Accepted)
 */
const buildStudentBookingConfirmedEmail = ({ booking, tutorName, studentName, frontendUrl }) => {
  const portalUrl = frontendUrl || 'http://localhost:3000';
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f0f6ff; border: 1px solid #d0e1fd; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0066cc;">Confirmed Reservation</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        Session Confirmed with ${tutorName}
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hi ${studentName}, your session has been accepted and added to your schedule.
      </p>
    </div>

    <!-- Spotlight Appointment Card (Apple Parchment Tile) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 24px;">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #86868b; margin-bottom: 4px;">Scheduled Appointment</div>
          <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.2px;">
            ${booking.date} at ${booking.time}
          </div>
          <div style="font-size: 14px; color: #6e6e73; margin-top: 4px;">
            ${booking.subject} • ${booking.duration} minutes
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e7;">
            <tr>
              <td style="font-size: 13px; color: #86868b;">Tutor</td>
              <td align="right" style="font-size: 13px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding-top: 6px; font-size: 13px; color: #86868b;">Room ID</td>
              <td align="right" style="padding-top: 6px; font-size: 13px; font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #0066cc;">${booking.meetingId || 'sess-room'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Primary Action Button (Apple Blue Pill) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}/schedule" class="button-pill" style="background-color: #0066cc; color: #ffffff !important; border-radius: 9999px; padding: 12px 32px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block;">
            Open Schedule & Study Room
          </a>
        </td>
      </tr>
    </table>

    <!-- Quiet Preparation Checklist -->
    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      Tip: Join 5 minutes early to test your audio and video. Socratic AI will generate your post-session recap automatically.
    </p>
  `;

  return baseEmailLayout({
    title: `Session Confirmed with ${tutorName} — SOCRATES`,
    previewText: `Your session with ${tutorName} on ${booking.date} at ${booking.time} is confirmed.`,
    content,
  });
};

/**
 * 4. Student Email: Session Declined (Tutor Unavailable)
 */
const buildStudentBookingDeclinedEmail = ({ booking, tutorName, studentName, frontendUrl }) => {
  const portalUrl = frontendUrl || 'http://localhost:3000';
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6e6e73;">Schedule Update</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        Session Slot Unavailable
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hi ${studentName}, <strong>${tutorName}</strong> is unavailable for the requested time on <strong>${booking.date} at ${booking.time}</strong>.
      </p>
    </div>

    <!-- Unavailable Slot Summary Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">Tutor</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Requested Slot</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 400; color: #1d1d1f;">${booking.date} @ ${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Status</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 13px; font-weight: 600; color: #d70015;">Slot Unavailable</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Primary Action Button (Browse Tutors) -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}/tutors" class="button-pill" style="background-color: #0066cc; color: #ffffff !important; border-radius: 9999px; padding: 12px 30px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block;">
            Browse Other Available Tutors
          </a>
        </td>
      </tr>
    </table>

    <!-- Reassurance Fine-print -->
    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      No payment was charged for this booking. You can select another open time slot on ${tutorName}&rsquo;s schedule or choose from other verified tutors.
    </p>
  `;

  return baseEmailLayout({
    title: `Session Request Update — SOCRATES`,
    previewText: `Update regarding your tutoring session request with ${tutorName}.`,
    content,
  });
};

/**
 * 5. Tutor Email: New Student Joined an Open Group Session
 */
const buildTutorStudentJoinedGroupEmail = ({ booking, tutorName, newStudentName, newStudentEmail, totalParticipants }) => {
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f0f6ff; border: 1px solid #d0e1fd; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0066cc;">Roster Update</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        New Student Joined Group Session
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hello <strong>${tutorName}</strong>, <strong>${newStudentName}</strong> has joined your upcoming group session.
      </p>
    </div>

    <!-- Updated Roster Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">New Student</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${newStudentName} (${newStudentEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Scheduled Date & Time</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.date} @ ${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Total Enrolled</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #0066cc;">${totalParticipants} Students</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Meeting Room ID</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 13px; font-family: monospace; font-weight: 600; color: #1d1d1f;">${booking.meetingId || 'sess-room'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      Your session schedule and room link remain the same. The new student has already been sent their room access link.
    </p>
  `;

  return baseEmailLayout({
    title: `New Student Joined Group Session — SOCRATES`,
    previewText: `${newStudentName} joined your group session on ${booking.date}.`,
    content,
  });
};

/**
 * 6. Host Student Email: A peer learner has joined your session (Fee Split discount applied)
 */
const buildHostStudentPeerJoinedEmail = ({ booking, hostName, newStudentName, tutorName, splitFee, totalParticipants }) => {
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f0f6ff; border: 1px solid #d0e1fd; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0066cc;">Peer Joined Session</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        A Peer Has Joined Your Session
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hi <strong>${hostName}</strong>, <strong>${newStudentName}</strong> has joined your upcoming tutoring session with <strong>${tutorName}</strong>.
      </p>
    </div>

    <!-- Updated Session Breakdown Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">New Peer Learner</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${newStudentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Tutor</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Scheduled Date & Time</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.date} @ ${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Total Group Size</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #0066cc;">${totalParticipants} Students</td>
            </tr>
            ${splitFee ? `
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Your Split Cost</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 15px; font-weight: 600; color: #059669;">$${splitFee}</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      Your session schedule and room link remain the same. You and your peers will study together with ${tutorName} in the live Study Room.
    </p>
  `;

  return baseEmailLayout({
    title: `${newStudentName} Joined Your Session — SOCRATES`,
    previewText: `${newStudentName} has joined your session with ${tutorName} on ${booking.date}.`,
    content,
  });
};

/**
 * 7. Peer Student Email: Another student has joined the group session
 */
const buildPeerStudentJoinedGroupEmail = ({ booking, peerStudentName, newStudentName, tutorName, totalParticipants }) => {
  const content = `
    <!-- Header Subtitle & Title -->
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; background-color: #f0f6ff; border: 1px solid #d0e1fd; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #0066cc;">Group Update</span>
      </div>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -0.3px; color: #1d1d1f; margin: 0 0 8px 0; line-height: 1.2;">
        New Member in Your Study Group
      </h1>
      <p style="font-size: 15px; line-height: 1.47; color: #6e6e73; margin: 0;">
        Hi <strong>${peerStudentName}</strong>, <strong>${newStudentName}</strong> has also joined your group session with <strong>${tutorName}</strong>.
      </p>
    </div>

    <!-- Group Summary Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">New Member</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${newStudentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Tutor</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Scheduled Date & Time</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${booking.date} @ ${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Total Group Size</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #0066cc;">${totalParticipants} Students</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      Your session schedule and room link remain the same.
    </p>
  `;

  return baseEmailLayout({
    title: `${newStudentName} Joined Your Group — SOCRATES`,
    previewText: `${newStudentName} joined your group session with ${tutorName}.`,
    content,
  });
};

/**
 * 8. End-of-Session Recap Email
 * Dispatched to participants when a study session concludes.
 */
const buildSessionRecapEmail = ({
  recipientName,
  tutorName,
  studentName,
  subject,
  topic,
  durationMinutes = 60,
  messageCount = 0,
  meetingId,
  isGroupSession = false,
  totalParticipants = 1,
}) => {
  const profileUrl = `${FRONTEND_URL}/profile`;

  const content = `
    <!-- Header Section -->
    <div style="margin-bottom: 28px; text-align: left;">
      <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
        Session Complete
      </span>
      <h1 style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 700; color: #1d1d1f; margin: 0 0 8px 0; letter-spacing: -0.5px; line-height: 1.2;">
        Session Summary: ${subject}
      </h1>
      <p style="font-size: 15px; line-height: 1.5; color: #515154; margin: 0;">
        Hi <strong>${recipientName || 'there'}</strong>, your ${isGroupSession ? 'group study session' : '1-on-1 tutoring session'} has concluded. Here is your session recap.
      </p>
    </div>

    <!-- Metrics Strip -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td width="32%" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;">Duration</div>
          <div style="font-size: 18px; font-weight: 700; color: #1d1d1f;">${durationMinutes} min</div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;">Messages</div>
          <div style="font-size: 18px; font-weight: 700; color: #0066cc;">${messageCount}</div>
        </td>
        <td width="2%"></td>
        <td width="32%" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 12px; padding: 14px; text-align: center;">
          <div style="font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px;">Learners</div>
          <div style="font-size: 18px; font-weight: 700; color: #1d1d1f;">${totalParticipants}</div>
        </td>
      </tr>
    </table>

    <!-- Session Details Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f7; border: 1px solid #e5e5e7; border-radius: 14px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #86868b; font-weight: 400;">Subject</td>
              <td align="right" style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #1d1d1f;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Topic</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${topic || 'Live Interactive Practice'}</td>
            </tr>
            ${tutorName ? `
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Tutor</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; font-weight: 600; color: #1d1d1f;">${tutorName}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-size: 14px; color: #86868b; font-weight: 400;">Meeting ID</td>
              <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e5e7; font-family: monospace; font-size: 13px; font-weight: 600; color: #515154;">${meetingId || 'N/A'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Call to Action -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${profileUrl}" class="button-pill" style="display: inline-block; padding: 12px 32px; background-color: #0066cc; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 9999px; text-align: center;">
            View Your Sessions & Profile
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 12px; line-height: 1.5; color: #86868b; text-align: center; margin: 0;">
      Keep practicing! Socratic AI notes and review materials are accessible in your dashboard.
    </p>
  `;

  return baseEmailLayout({
    title: `Session Recap: ${subject} — SOCRATES`,
    previewText: `Your ${subject} session recap is ready.`,
    content,
  });
};

module.exports = {
  buildTutorBookingRequestEmail,
  buildStudentBookingPendingEmail,
  buildStudentBookingConfirmedEmail,
  buildStudentBookingDeclinedEmail,
  buildTutorStudentJoinedGroupEmail,
  buildHostStudentPeerJoinedEmail,
  buildPeerStudentJoinedGroupEmail,
  buildSessionRecapEmail,
};


