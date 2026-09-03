/**
 * 55 smartCREATIVES — Transactional Email Service
 * Supports Resend (primary) and SendGrid (fallback) via native HTTPS REST API.
 * Zero dependency bloat, 100% serverless compatible.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

function getSiteUrl() {
  return process.env.SITE_URL || 
         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

function getSenderEmail() {
  return process.env.EMAIL_FROM || '55 smartCREATIVES <onboarding@resend.dev>';
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'edsonndyanabo84@gmail.com';
}

/**
 * Send an email via Resend or SendGrid
 */
async function sendEmail({ to, subject, html, replyTo }) {
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const from = getSenderEmail();

  // 1. Resend API (Preferred)
  if (resendKey && !resendKey.includes('your_resend_api_key')) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          reply_to: replyTo || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✓ [Resend Email Sent] to: ${to} | id: ${data.id || 'ok'}`);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        console.warn(`! [Resend Email Error]:`, data);
        return { success: false, provider: 'resend', error: data.message || 'Unknown error' };
      }
    } catch (err) {
      console.warn(`! [Resend Network Exception]:`, err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  // 2. SendGrid API (Fallback)
  if (sendgridKey && !sendgridKey.includes('your_sendgrid_key')) {
    try {
      const res = await fetch(SENDGRID_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from.includes('<') ? from.match(/<([^>]+)>/)[1] : from, name: '55 smartCREATIVES' },
          subject,
          content: [{ type: 'text/html', value: html }]
        })
      });

      if (res.status >= 200 && res.status < 300) {
        console.log(`✓ [SendGrid Email Sent] to: ${to}`);
        return { success: true, provider: 'sendgrid' };
      } else {
        const errText = await res.text();
        console.warn(`! [SendGrid Error]:`, errText);
        return { success: false, provider: 'sendgrid', error: errText };
      }
    } catch (err) {
      console.warn(`! [SendGrid Network Exception]:`, err.message);
      return { success: false, provider: 'sendgrid', error: err.message };
    }
  }

  // 3. Simulated Mode (when API keys are not yet configured in local dev)
  console.log(`ℹ [Email Notice - No API Key Configured] Simulated email to: ${to} | Subject: "${subject}"`);
  return { success: true, simulated: true };
}

/**
 * Send automated confirmation email to client and alert email to admin
 */
async function sendInquiryNotifications(inquiry) {
  const siteUrl = getSiteUrl();
  const adminEmail = getAdminEmail();
  const artworkTitle = inquiry.artworkTitle || 'Curated Fine Art';
  const collectorName = inquiry.collectorName || 'Valued Collector';
  const collectorEmail = inquiry.collectorEmail;
  const formattedPrice = inquiry.artworkPrice ? `$${Number(inquiry.artworkPrice).toLocaleString()}` : 'Price Upon Request';
  const framePref = inquiry.framePreference || 'Gallery Presentation';
  const notes = inquiry.notes || 'Inquired about purchasing this artwork.';
  const artworkLink = inquiry.artworkId ? `${siteUrl}/artwork.html?id=${inquiry.artworkId}` : `${siteUrl}/#catalog`;
  const adminDashboardLink = `${siteUrl}/admin.html`;

  const results = {
    customerEmail: null,
    adminEmail: null
  };

  // --- 1. Customer Confirmation Email ---
  if (collectorEmail && collectorEmail.includes('@')) {
    const customerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background-color: #121211; font-family: 'Helvetica Neue', Arial, sans-serif; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #181716; border: 1px solid #2a2826; }
    .header { padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #2a2826; }
    .brand { font-size: 20px; font-weight: 700; letter-spacing: 0.15em; color: #ffffff; text-transform: uppercase; }
    .tagline { font-size: 11px; letter-spacing: 0.25em; color: #c2a57e; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 36px 32px; line-height: 1.6; }
    .greeting { font-size: 18px; color: #ffffff; margin-bottom: 16px; }
    .artwork-card { background-color: #121211; border: 1px solid #2a2826; border-left: 3px solid #c2a57e; padding: 20px; margin: 24px 0; }
    .artwork-title { font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
    .spec-line { font-size: 13px; color: #a0a0a0; margin: 4px 0; }
    .spec-value { color: #ffffff; }
    .gold { color: #c2a57e; font-weight: 600; }
    .btn { display: inline-block; background-color: #c2a57e; color: #121211; font-weight: 700; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 2px; margin-top: 20px; }
    .footer { padding: 24px 32px; border-top: 1px solid #2a2826; font-size: 12px; color: #707070; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">55 smartCREATIVES</div>
      <div class="tagline">Fine Art Gallery &bull; Curator Directorate</div>
    </div>
    <div class="content">
      <div class="greeting">Dear ${collectorName},</div>
      <p>Thank you for contacting <strong>55 smartCREATIVES</strong>. We have successfully received your inquiry regarding:</p>
      
      <div class="artwork-card">
        <div class="artwork-title">${artworkTitle}</div>
        <div class="spec-line">Artist: <span class="spec-value">${inquiry.artworkArtist || '55 smartCREATIVES'}</span></div>
        <div class="spec-line">Framing Preference: <span class="spec-value">${framePref}</span></div>
        <div class="spec-line">Listed Valuation: <span class="gold">${formattedPrice}</span></div>
        <div class="spec-line" style="margin-top: 12px; font-style: italic; color: #888;">Your note: "${notes}"</div>
      </div>

      <p>Our senior curatorial director is currently reviewing your request. We will reach out to you directly within <strong>24 business hours</strong> with detailed provenance documentation, custom framing options, and secure international delivery arrangements.</p>

      <p style="margin-top: 24px;">If you have immediate questions, you may reply directly to this email.</p>
      
      <div style="text-align: center;">
        <a href="${artworkLink}" class="btn">View Artwork Online</a>
      </div>
    </div>
    <div class="footer">
      55 smartCREATIVES Fine Art Gallery &bull; Curator Directorate<br>
      Reference: ${inquiry.id || 'INQ-' + Date.now()}
    </div>
  </div>
</body>
</html>
`;

    results.customerEmail = await sendEmail({
      to: collectorEmail,
      subject: `Inquiry Confirmation: "${artworkTitle}" — 55 smartCREATIVES`,
      html: customerHtml,
      replyTo: adminEmail
    }).catch(e => ({ success: false, error: e.message }));
  }

  // --- 2. Admin Notification Email ---
  if (adminEmail && adminEmail.includes('@')) {
    const adminHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background-color: #121211; font-family: 'Helvetica Neue', Arial, sans-serif; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #181716; border: 1px solid #2a2826; }
    .header { padding: 24px 32px; background: rgba(194, 165, 126, 0.15); border-bottom: 2px solid #c2a57e; }
    .badge { display: inline-block; background: #c2a57e; color: #121211; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 2px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; }
    .content { padding: 32px; }
    .section-title { font-size: 12px; font-weight: 700; letter-spacing: 0.15em; color: #c2a57e; text-transform: uppercase; margin-top: 20px; margin-bottom: 8px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; background: #121211; border: 1px solid #2a2826; }
    .data-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #222; }
    .data-label { color: #888; width: 140px; font-weight: 600; }
    .data-val { color: #fff; }
    .btn { display: inline-block; background-color: #c2a57e; color: #121211; font-weight: 700; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 2px; margin-top: 16px; }
    .footer { padding: 20px 32px; border-top: 1px solid #2a2826; font-size: 11px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">New Customer Inquiry</span>
      <h1 class="title">"${artworkTitle}"</h1>
    </div>
    <div class="content">
      <div class="section-title">Collector Details</div>
      <table class="data-table">
        <tr>
          <td class="data-label">Name:</td>
          <td class="data-val"><strong>${collectorName}</strong></td>
        </tr>
        <tr>
          <td class="data-label">Email:</td>
          <td class="data-val"><a href="mailto:${collectorEmail}" style="color: #c2a57e; text-decoration: underline;">${collectorEmail}</a></td>
        </tr>
        <tr>
          <td class="data-label">Phone:</td>
          <td class="data-val">${inquiry.collectorPhone ? '<a href="tel:' + inquiry.collectorPhone + '" style="color: #c2a57e;">' + inquiry.collectorPhone + '</a>' : 'Not provided'}</td>
        </tr>
        <tr>
          <td class="data-label">Date:</td>
          <td class="data-val">${new Date().toLocaleString()}</td>
        </tr>
      </table>

      <div class="section-title">Artwork Inquired</div>
      <table class="data-table">
        <tr>
          <td class="data-label">Artwork:</td>
          <td class="data-val"><strong>${artworkTitle}</strong></td>
        </tr>
        <tr>
          <td class="data-label">Price / Value:</td>
          <td class="data-val" style="color: #c2a57e; font-weight: 700;">${formattedPrice}</td>
        </tr>
        <tr>
          <td class="data-label">Framing:</td>
          <td class="data-val">${framePref}</td>
        </tr>
        <tr>
          <td class="data-label">Reference ID:</td>
          <td class="data-val"><code>${inquiry.id || 'N/A'}</code></td>
        </tr>
      </table>

      <div class="section-title">Client Message</div>
      <div style="background: #121211; border: 1px solid #2a2826; padding: 14px; font-style: italic; color: #ddd; font-size: 14px; line-height: 1.5;">
        "${notes}"
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${adminDashboardLink}" class="btn">Open Curator Dashboard ↗</a>
      </div>
    </div>
    <div class="footer">
      55 smartCREATIVES Live Inquiry Dispatch &bull; Connected to MySQL
    </div>
  </div>
</body>
</html>
`;

    results.adminEmail = await sendEmail({
      to: adminEmail,
      subject: `⚡ New Inquiry: "${artworkTitle}" from ${collectorName}`,
      html: adminHtml,
      replyTo: collectorEmail
    }).catch(e => ({ success: false, error: e.message }));
  }

  return results;
}

module.exports = {
  sendEmail,
  sendInquiryNotifications,
  getSiteUrl,
  getAdminEmail
};
