const Booking = require('../models/Booking');
const sendEmail = require('../utils/sendEmail');
const {
  buildStudentBookingConfirmedEmail,
  buildStudentBookingDeclinedEmail,
} = require('../utils/bookingEmails');

/**
 * Helper to render responsive, Apple-styled web landing pages for email action clicks
 */
const renderEmailActionPage = ({
  status = 'success',
  title,
  subtitle,
  details = [],
  actionBtnText = 'Return to SOCRATES',
  actionBtnUrl = process.env.FRONTEND_URL || 'http://localhost:3000',
}) => {
  const detailsHtml = details
    .map(
      (d) => `
      <div class="row">
        <span class="label">${d.label}</span>
        <span class="value">${d.value}</span>
      </div>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — SOCRATES</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f7;
      color: #1d1d1f;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: #ffffff;
      max-width: 460px;
      width: 100%;
      border-radius: 18px;
      padding: 40px 36px;
      border: 1px solid #e5e5e7;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      text-align: center;
    }
    .logo {
      font-family: "SF Pro Display", -apple-system, sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.4px;
      margin-bottom: 24px;
      display: block;
      color: #1d1d1f;
      text-transform: uppercase;
    }
    .logo span { color: #0066cc; }
    .status-chip {
      display: inline-block;
      background-color: #f5f5f7;
      border: 1px solid #e5e5e7;
      border-radius: 9999px;
      padding: 4px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0066cc;
      margin-bottom: 16px;
    }
    h1 {
      font-family: "SF Pro Display", -apple-system, sans-serif;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.3px;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    p.subtitle {
      font-size: 15px;
      color: #6e6e73;
      line-height: 1.47;
      margin-bottom: 24px;
    }
    .details-box {
      background: #f5f5f7;
      border: 1px solid #e5e5e7;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 28px;
      text-align: left;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e7;
      font-size: 14px;
    }
    .row:last-child { border-bottom: none; }
    .label { color: #86868b; font-weight: 400; }
    .value { color: #1d1d1f; font-weight: 600; text-align: right; }
    .btn {
      display: inline-block;
      background: #0066cc;
      color: #ffffff !important;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 9999px;
      transition: opacity 0.2s ease;
      width: 100%;
    }
    .btn:hover { opacity: 0.92; }
    .footer {
      font-size: 11px;
      color: #86868b;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="logo">SOCRATES<span>.</span></span>
    <div class="status-chip">Reservation Status</div>
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>

    ${details.length > 0 ? `<div class="details-box">${detailsHtml}</div>` : ''}

    <a href="${actionBtnUrl}" class="btn">${actionBtnText}</a>
    <div class="footer">&copy; ${new Date().getFullYear()} SOCRATES Inc. All rights reserved.</div>
  </div>
</body>
</html>
`;
};

/**
 * GET /api/v1/bookings/:bookingId/approve?token=xxx
 * Handles one-click session approval from the Tutor's email notification
 */
exports.approveBookingViaEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(
        renderEmailActionPage({
          status: 'warn',
          title: 'Missing Approval Token',
          subtitle: 'The approval link appears to be invalid or incomplete. Please use the button from your email.',
        })
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(
        renderEmailActionPage({
          status: 'warn',
          title: 'Booking Not Found',
          subtitle: 'We could not locate this session booking in the SOCRATES registry.',
        })
      );
    }

    if (booking.approvalToken && booking.approvalToken !== token) {
      return res.status(403).send(
        renderEmailActionPage({
          status: 'declined',
          title: 'Unauthorized Action',
          subtitle: 'This approval token is invalid or does not match this booking record.',
        })
      );
    }

    // Check if already approved
    if (booking.status === 'confirmed') {
      return res.send(
        renderEmailActionPage({
          status: 'success',
          title: 'Session Already Approved',
          subtitle: `This session with ${booking.studentName} is already confirmed and on your schedule.`,
          details: [
            { label: 'Student', value: booking.studentName },
            { label: 'Subject', value: booking.subject },
            { label: 'Date & Time', value: `${booking.date} @ ${booking.time}` },
            { label: 'Status', value: 'Confirmed ✅' },
          ],
        })
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return res.send(
        renderEmailActionPage({
          status: 'warn',
          title: 'Session Was Cancelled',
          subtitle: 'This booking was previously declined or cancelled.',
          details: [
            { label: 'Student', value: booking.studentName },
            { label: 'Subject', value: booking.subject },
            { label: 'Status', value: 'Cancelled' },
          ],
        })
      );
    }

    // Approve booking
    booking.status = 'confirmed';
    if (!booking.meetingId) {
      booking.meetingId = `sess-${Date.now()}`;
    }
    await booking.save();

    // Send confirmation email to all enrolled students (host student + group co-learners)
    const studentsToNotify = [];
    if (booking.studentEmail) {
      studentsToNotify.push({ name: booking.studentName, email: booking.studentEmail });
    }
    if (Array.isArray(booking.participants)) {
      booking.participants.forEach((p) => {
        if (p.studentEmail && !studentsToNotify.some(s => s.email === p.studentEmail)) {
          studentsToNotify.push({ name: p.studentName || 'Student', email: p.studentEmail });
        }
      });
    }

    studentsToNotify.forEach((student) => {
      try {
        const studentEmailHtml = buildStudentBookingConfirmedEmail({
          booking,
          tutorName: booking.tutorName || 'Tutor',
          studentName: student.name,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        });

        sendEmail({
          to: student.email,
          subject: `Session Confirmed with ${booking.tutorName || 'Tutor'} — SOCRATES`,
          html: studentEmailHtml,
        }).catch((emailErr) => {
          console.error(`⚠️ Failed to dispatch confirmation email to ${student.email}:`, emailErr.message);
        });
      } catch (err) {
        console.error('⚠️ Failed to construct confirmation email:', err.message);
      }
    });

    return res.send(
      renderEmailActionPage({
        status: 'success',
        title: 'Session Approved',
        subtitle: `You have successfully confirmed the session with ${booking.studentName}${studentsToNotify.length > 1 ? ` and ${studentsToNotify.length - 1} group member(s)` : ''}. Confirmation emails have been dispatched.`,
        details: [
          { label: 'Primary Student', value: booking.studentName },
          { label: 'Session Type', value: booking.isGroupSession ? `Group Session (${studentsToNotify.length} student${studentsToNotify.length > 1 ? 's' : ''})` : 'Private 1-on-1' },
          { label: 'Subject', value: booking.subject },
          { label: 'Date', value: booking.date },
          { label: 'Time', value: booking.time },
          { label: 'Duration', value: `${booking.duration} minutes` },
          { label: 'Fee', value: `$${booking.fee}` },
          { label: 'Status', value: 'Confirmed' },
        ],
      })
    );
  } catch (error) {
    console.error('Error approving booking via email:', error);
    return res.status(500).send(
      renderEmailActionPage({
        status: 'warn',
        title: 'Internal Server Error',
        subtitle: 'An error occurred while approving the session. Please try again or open your dashboard.',
      })
    );
  }
};

/**
 * GET /api/v1/bookings/:bookingId/decline?token=xxx
 * Handles one-click session decline from the Tutor's email notification
 */
exports.declineBookingViaEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(
        renderEmailActionPage({
          status: 'warn',
          title: 'Missing Token',
          subtitle: 'The decline link appears invalid or incomplete.',
        })
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).send(
        renderEmailActionPage({
          status: 'warn',
          title: 'Booking Not Found',
          subtitle: 'We could not locate this session booking in the SOCRATES registry.',
        })
      );
    }

    if (booking.approvalToken && booking.approvalToken !== token) {
      return res.status(403).send(
        renderEmailActionPage({
          status: 'declined',
          title: 'Unauthorized Action',
          subtitle: 'This token is invalid for this booking record.',
        })
      );
    }

    // Cancel booking
    booking.status = 'cancelled';
    await booking.save();

    // Send polite notification to all enrolled students
    const studentsToNotify = [];
    if (booking.studentEmail) {
      studentsToNotify.push({ name: booking.studentName, email: booking.studentEmail });
    }
    if (Array.isArray(booking.participants)) {
      booking.participants.forEach((p) => {
        if (p.studentEmail && !studentsToNotify.some(s => s.email === p.studentEmail)) {
          studentsToNotify.push({ name: p.studentName || 'Student', email: p.studentEmail });
        }
      });
    }

    studentsToNotify.forEach((student) => {
      try {
        const studentEmailHtml = buildStudentBookingDeclinedEmail({
          booking,
          tutorName: booking.tutorName || 'Tutor',
          studentName: student.name,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        });

        sendEmail({
          to: student.email,
          subject: `Session Request Update — SOCRATES`,
          html: studentEmailHtml,
        }).catch((emailErr) => {
          console.error(`⚠️ Failed to dispatch decline email to ${student.email}:`, emailErr.message);
        });
      } catch (err) {
        console.error('⚠️ Failed to construct decline email:', err.message);
      }
    });

    return res.send(
      renderEmailActionPage({
        status: 'declined',
        title: 'Session Declined',
        subtitle: `You have declined this session request. ${booking.studentName} has been politely notified that you are unavailable for this slot.`,
        details: [
          { label: 'Student', value: booking.studentName },
          { label: 'Subject', value: booking.subject },
          { label: 'Date & Time', value: `${booking.date} @ ${booking.time}` },
          { label: 'Status', value: 'Declined' },
        ],
      })
    );
  } catch (error) {
    console.error('Error declining booking via email:', error);
    return res.status(500).send(
      renderEmailActionPage({
        status: 'warn',
        title: 'Internal Server Error',
        subtitle: 'An error occurred while declining the session. Please try again.',
      })
    );
  }
};

/**
 * GET /api/v1/bookings/:bookingId/status
 * Get status of a booking
 */
exports.getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving booking' });
  }
};
