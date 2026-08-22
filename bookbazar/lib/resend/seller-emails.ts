import { resend } from './resend'
import { baseEmailHtml } from './base-email'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

export async function sendSellerApprovalEmail({
  email,
  sellerName,
}: {
  email: string
  sellerName: string
}) {
  const html = baseEmailHtml({
    title: 'Seller Application Approved - Additional Verification Required',
    greeting: `Dear <strong>${sellerName}</strong>,`,
    body: `
      <p>We are pleased to inform you that your seller application has been <strong>approved based on the documents you have submitted so far</strong>.</p>
      <p>To complete the process and obtain <strong>full verification status</strong>, an additional verification step is required.</p>
      <p>You can complete this verification by either:</p>
      <ol>
        <li>Contacting us on WhatsApp: <strong>+91 84311 72114</strong></li>
        <li>Sending the required documents via email to <strong>karnakreeshal@gmail.com</strong></li>
      </ol>
      <p>Please provide the following additional documents:</p>
      <ul>
        <li>Government-issued ID proof (Aadhaar Card, Passport, Driving License, etc.)</li>
        <li>Business Registration Certificate (if applicable)</li>
        <li>GST Certificate (if applicable)</li>
        <li>Address Proof</li>
        <li>Any other supporting documents requested during verification</li>
      </ul>
      <p>Once the documents have been reviewed and verified, your account will be upgraded to <strong>Fully Verified Seller</strong> status, allowing you to access all seller features and benefits on our platform.</p>
      <p>If you have any questions or require assistance during the verification process, feel free to contact us.</p>
      <p>Thank you for choosing our platform.</p>
      <p>Best regards,<br /><strong>BookBazaar Verification Team</strong><br />Email: karnakreeshal@gmail.com<br />WhatsApp: +91 84311 72114</p>
    `,
    ctaLabel: 'Open BookMandu',
    ctaUrl: `${appUrl}/seller/dashboard`,
    footer: 'Please keep this email for your records while you complete verification.',
  })

  const { data, error } = await resend.emails.send({
    from: 'BookMandu <noreply@krishalkarna.com.np>',
    to: email,
    subject: 'Seller Application Approved - Additional Verification Required',
    html,
  })

  if (error) {
    throw new Error(`Failed to send approval email: ${error.message}`)
  }

  return data
}

export async function sendAdminSellerMessage({
  email,
  sellerName,
  subject,
  message,
}: {
  email: string
  sellerName: string
  subject: string
  message: string
}) {
  const html = baseEmailHtml({
    title: subject,
    greeting: `Dear <strong>${sellerName}</strong>,`,
    body: `<p>${message.replace(/\n/g, '<br />')}</p>`,
    ctaLabel: 'Open Seller Dashboard',
    ctaUrl: `${appUrl}/seller/dashboard`,
    footer: 'This message was sent from the BookMandu admin panel.',
  })

  const { data, error } = await resend.emails.send({
    from: 'BookMandu Admin <noreply@krishalkarna.com.np>',
    to: email,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Failed to send admin message: ${error.message}`)
  }

  return data
}