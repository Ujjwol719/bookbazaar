import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { encrypt } from "@/app/lib/session"

interface FacebookTokenResponse {
  access_token?: string
  error?: { message: string }
}

interface FacebookUser {
  id: string
  name?: string
  email?: string
  picture?: { data: { url: string } }
}

function loginRedirect(req: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url))
}

// Mirrors /api/auth/google/callback — see that route for the fuller
// write-up on the account-linking and session logic, identical here.
export async function GET(req: NextRequest) {
  const clientId = process.env.FACEBOOK_CLIENT_ID
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return loginRedirect(req, "facebook_not_configured")
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const facebookError = searchParams.get("error")

  if (facebookError) {
    return loginRedirect(req, "facebook_cancelled")
  }

  const expectedState = req.cookies.get("facebook_oauth_state")?.value
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(req, "facebook_failed")
  }

  const redirectUri = `${appUrl}/api/auth/facebook/callback`

  try {
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`)
    const tokens = (await tokenRes.json()) as FacebookTokenResponse

    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Facebook token exchange failed:", tokens)
      return loginRedirect(req, "facebook_failed")
    }

    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokens.access_token}`
    )
    if (!profileRes.ok) {
      console.error("Facebook profile fetch failed:", await profileRes.text())
      return loginRedirect(req, "facebook_failed")
    }
    const profile = (await profileRes.json()) as FacebookUser

    if (!profile.email) {
      // Facebook lets a user sign up without an email, or decline sharing
      // it — we can't create an account without something to identify
      // them by.
      return loginRedirect(req, "facebook_email_unverified")
    }

    let user = await prisma.user.findUnique({ where: { facebookId: profile.id } })

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } })

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            facebookId: profile.id,
            isVerified: true,
            avatarUrl: existingByEmail.avatarUrl ?? profile.picture?.data.url ?? null,
          },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            full_name: profile.name || profile.email.split("@")[0],
            facebookId: profile.id,
            avatarUrl: profile.picture?.data.url ?? null,
            isVerified: true,
            role: "BUYER",
          },
        })
      }
    }

    if (user.isBlocked) {
      return loginRedirect(req, "account_blocked")
    }

    const store = user.role === "SELLER" ? await prisma.store.findUnique({ where: { sellerId: user.id } }) : null
    const sessionToken = await encrypt({ id: user.id, email: user.email, role: user.role })
    const destination =
      user.role === "ADMIN" ? "/admin" : user.role === "SELLER" ? (store ? "/seller/dashboard" : "/seller/onboard") : "/"

    const res = NextResponse.redirect(new URL(destination, req.url))
    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    res.cookies.delete("facebook_oauth_state")
    return res
  } catch (err) {
    console.error("Facebook OAuth callback error:", err)
    return loginRedirect(req, "facebook_failed")
  }
}
