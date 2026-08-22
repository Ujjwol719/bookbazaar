import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { encrypt } from "@/app/lib/session"
import { requireActiveUser } from "@/app/lib/active-user"

// Upgrades a signed-in buyer to a seller in place — no new account, no
// re-verification. The session cookie is re-issued immediately because the
// role is baked into the JWT payload; without this the user would still be
// treated as a BUYER by middleware until their next login.
export async function POST() {
  const { error, user } = await requireActiveUser()

  if (error) {
    return error
  }

  if (user.role === "SELLER") {
    return Response.json({ message: "You're already registered as a seller." }, { status: 409 })
  }

  if (user.role === "ADMIN") {
    return Response.json({ message: "Admin accounts can't switch to selling." }, { status: 409 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "SELLER" },
    select: { id: true, email: true, role: true },
  })

  const token = await encrypt(updated)
  const cookieStore = await cookies()

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  return Response.json({ message: "You're set up to sell — let's create your store." })
}
