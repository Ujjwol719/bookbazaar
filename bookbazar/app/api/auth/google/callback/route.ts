import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { encrypt } from "@/app/lib/session"

interface GoogleTokenResponse {
  access_token: string
  id_token: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  picture?: string
}

function loginRedirect(req: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url))
}

// Step 2 of the flow: Google sends the browser back here with a one-time code.
// GET /api/auth/google/callback
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return loginRedirect(req, "google_not_configured")
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const googleError = searchParams.get("error")

  if (googleError) {
    // User cancelled on Google's consent screen — not an error worth logging.
    return loginRedirect(req, "google_cancelled")
  }

  const expectedState = req.cookies.get("google_oauth_state")?.value

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(req, "google_failed")
  }

  const redirectUri = `${appUrl}/api/auth/google/callback`

  try {
    // Exchange the one-time code for tokens. This call carries the client secret,
    // so it happens server-to-server — it never touches the browser.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text())
      return loginRedirect(req, "google_failed")
    }

    const tokens = (await tokenRes.json()) as GoogleTokenResponse

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileRes.ok) {
      console.error("Google userinfo fetch failed:", await profileRes.text())
      return loginRedirect(req, "google_failed")
    }

    const profile = (await profileRes.json()) as GoogleUserInfo

    if (!profile.email || !profile.email_verified) {
      // Refuse to sign in on an unverified email — we can't trust it belongs to them.
      return loginRedirect(req, "google_email_unverified")
    }

    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } })

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } })

      if (existingByEmail) {
        // Same verified email as an existing password-based account — link them
        // instead of creating a duplicate.
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.sub,
            isVerified: true,
            avatarUrl: existingByEmail.avatarUrl ?? profile.picture ?? null,
          },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            full_name: profile.name || profile.email.split("@")[0],
            googleId: profile.sub,
            avatarUrl: profile.picture ?? null,
            isVerified: true,
            role: "BUYER",
          },
        })
      }
    }

    if (user.isBlocked) {
      return loginRedirect(req, "account_blocked")
    }

    const store = user.role === "SELLER"
      ? await prisma.store.findUnique({ where: { sellerId: user.id } })
      : null

    const sessionToken = await encrypt({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    const destination =
      user.role === "ADMIN" ? "/admin" :
      user.role === "SELLER" ? (store ? "/seller/dashboard" : "/seller/onboard") :
      "/"

    const res = NextResponse.redirect(new URL(destination, req.url))

    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    res.cookies.delete("google_oauth_state")

    return res
  } catch (err) {
    console.error("Google OAuth callback error:", err)
    return loginRedirect(req, "google_failed")
  }
}
