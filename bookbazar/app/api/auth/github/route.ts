import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

// Same shape as /api/auth/google — see that route for the fuller write-up.
// GITHUB_CLIENT_ID isn't set yet, so this currently redirects back with a
// friendly "not configured" error instead of a raw 500; it activates the
// moment real credentials are added to .env, no code change needed.
export async function GET(req: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const from = new URL(req.url).searchParams.get("from") === "signup" ? "signup" : "login"

  if (!clientId || !appUrl) {
    return NextResponse.redirect(new URL(`/${from}?error=github_not_configured`, req.url))
  }

  const state = randomBytes(16).toString("hex")
  const redirectUri = `${appUrl}/api/auth/github/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  })

  const res = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)

  res.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  return res
}
