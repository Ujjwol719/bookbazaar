import { resend } from './resend'
import { baseEmailHtml } from './base-email'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

async function send(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: 'BookMandu Study Hub <noreply@krishalkarna.com.np>',
    to,
    subject,
    html,
  })
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }
  return data
}

export async function sendContributorRequestDecisionEmail({
  email,
  name,
  targetLabel,
  approved,
}: {
  email: string
  name: string
  targetLabel: string
  approved: boolean
}) {
  const subject = approved ? 'Your Contributor request was approved' : 'Your Contributor request was reviewed'
  const html = baseEmailHtml({
    title: subject,
    greeting: `Hi <strong>${name}</strong>,`,
    body: approved
      ? `<p>Your request to contribute to <strong>${targetLabel}</strong> has been approved. An admin will grant you access to specific subjects shortly — check your Contributor Dashboard to see what you can upload to.</p>`
      : `<p>Your request to contribute to <strong>${targetLabel}</strong> wasn't approved this time. You're welcome to submit a new request.</p>`,
    ctaLabel: 'Open Contributor Dashboard',
    ctaUrl: `${appUrl}/contributor/dashboard`,
  })
  return send(email, subject, html)
}

export async function sendMaterialReviewedEmail({
  email,
  name,
  title,
  decision,
  reviewNote,
  creditsEarned,
}: {
  email: string
  name: string
  title: string
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  reviewNote?: string | null
  creditsEarned?: number
}) {
  const subjectByDecision = {
    APPROVED: `Your upload "${title}" was approved`,
    REJECTED: `Your upload "${title}" was rejected`,
    CHANGES_REQUESTED: `Changes requested on "${title}"`,
  }
  const bodyByDecision = {
    APPROVED: `<p>Great news — <strong>${title}</strong> has been approved and is now live on Study Hub.</p>${
      creditsEarned ? `<p>You earned <strong>${creditsEarned} BookMandu Credits</strong> for this contribution.</p>` : ''
    }`,
    REJECTED: `<p><strong>${title}</strong> was not approved.</p>${reviewNote ? `<p><em>Reviewer note: ${reviewNote}</em></p>` : ''}`,
    CHANGES_REQUESTED: `<p><strong>${title}</strong> needs some changes before it can be approved.</p>${
      reviewNote ? `<p><em>Reviewer note: ${reviewNote}</em></p>` : ''
    }<p>You can edit and resubmit it from your Contributor Dashboard.</p>`,
  }

  const subject = subjectByDecision[decision]
  const html = baseEmailHtml({
    title: subject,
    greeting: `Hi <strong>${name}</strong>,`,
    body: bodyByDecision[decision],
    ctaLabel: 'Open Contributor Dashboard',
    ctaUrl: `${appUrl}/contributor/dashboard`,
  })
  return send(email, subject, html)
}
