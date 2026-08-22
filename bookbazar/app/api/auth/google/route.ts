import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

// Step 1 of the flow: send the browser to Google's consent screen.
// GET /api/auth/google  (hit directly via <a href> / window.location, not axios —
// this has to be a full page navigation so Google can redirect back with a code).
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { message: "Google login is not configured yet. Set GOOGLE_CLIENT_ID and NEXT_PUBLIC_APP_URL." },
      { status: 500 }
    )
  }

  // Random, single-use value to defend against CSRF on the callback — we store it
  // in a short-lived cookie and compare it against what Google echoes back.
  const state = randomBytes(16).toString("hex")
  const redirectUri = `${appUrl}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  })

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)

  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes is plenty for a login redirect
  })

  return res
}
