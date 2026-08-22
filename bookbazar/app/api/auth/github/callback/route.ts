import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { encrypt } from "@/app/lib/session"

interface GitHubTokenResponse {
  access_token?: string
  error?: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  avatar_url: string | null
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
}

function loginRedirect(req: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, req.url))
}

// Mirrors /api/auth/google/callback — see that route for the fuller
// write-up on the account-linking and session logic, identical here.
export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    return loginRedirect(req, "github_not_configured")
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const githubError = searchParams.get("error")

  if (githubError) {
    return loginRedirect(req, "github_cancelled")
  }

  const expectedState = req.cookies.get("github_oauth_state")?.value
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(req, "github_failed")
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`,
      }),
    })

    const tokens = (await tokenRes.json()) as GitHubTokenResponse
    if (!tokenRes.ok || !tokens.access_token) {
      console.error("GitHub token exchange failed:", tokens)
      return loginRedirect(req, "github_failed")
    }

    const [profileRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${tokens.access_token}` } }),
      fetch("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${tokens.access_token}` } }),
    ])

    if (!profileRes.ok) {
      console.error("GitHub profile fetch failed:", await profileRes.text())
      return loginRedirect(req, "github_failed")
    }

    const profile = (await profileRes.json()) as GitHubUser
    const emails = emailsRes.ok ? ((await emailsRes.json()) as GitHubEmail[]) : []
    const primaryEmail = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified)

    if (!primaryEmail) {
      // GitHub accounts can have no public/verified email at all — we
      // can't create an account without something to identify them by.
      return loginRedirect(req, "github_email_unverified")
    }

    const githubId = String(profile.id)
    let user = await prisma.user.findUnique({ where: { githubId } })

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email: primaryEmail.email } })

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            githubId,
            isVerified: true,
            avatarUrl: existingByEmail.avatarUrl ?? profile.avatar_url ?? null,
          },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email: primaryEmail.email,
            full_name: profile.name || profile.login,
            githubId,
            avatarUrl: profile.avatar_url ?? null,
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
    res.cookies.delete("github_oauth_state")
    return res
  } catch (err) {
    console.error("GitHub OAuth callback error:", err)
    return loginRedirect(req, "github_failed")
  }
}
