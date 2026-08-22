import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

// Same shape as /api/auth/google — see that route for the fuller write-up.
// FACEBOOK_CLIENT_ID isn't set yet, so this currently redirects back with a
// friendly "not configured" error instead of a raw 500; it activates the
// moment real credentials are added to .env, no code change needed.
export async function GET(req: Request) {
  const clientId = process.env.FACEBOOK_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = new URL(req.url).searchParams.get("from") === "signup" ? "signup" : "login"

  if (!clientId || !appUrl) {
    return NextResponse.redirect(new URL(`/${from}?error=facebook_not_configured`, req.url))
  }

  const state = randomBytes(16).toString("hex")
  const redirectUri = `${appUrl}/api/auth/facebook/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "email public_profile",
    state,
  })

  const res = NextResponse.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`)

  res.cookies.set("facebook_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  return res
}
