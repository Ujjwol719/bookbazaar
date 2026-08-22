const MESSAGES: Record<string, string> = {
  google_failed: "Something went wrong signing in with Google. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_email_unverified: "Your Google email isn't verified — please verify it with Google first.",
  google_not_configured: "Google sign-in isn't set up yet.",
  github_failed: "Something went wrong signing in with GitHub. Please try again.",
  github_cancelled: "GitHub sign-in was cancelled.",
  github_email_unverified: "We couldn't get a verified email from your GitHub account. Add one at github.com/settings/emails and try again.",
  github_not_configured: "GitHub sign-in isn't set up yet.",
  facebook_failed: "Something went wrong signing in with Facebook. Please try again.",
  facebook_cancelled: "Facebook sign-in was cancelled.",
  facebook_email_unverified: "We couldn't get an email from your Facebook account — check your Facebook privacy settings and try again.",
  facebook_not_configured: "Facebook sign-in isn't set up yet.",
  account_blocked: "Your account is blocked. Contact support.",
}

export function authErrorMessage(code: string | null): string | null {
  if (!code) return null
  return MESSAGES[code] || "Something went wrong. Please try again."
}
