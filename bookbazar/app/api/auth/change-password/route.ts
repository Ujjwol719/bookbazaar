import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = schema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: result.error.issues[0]?.message || "Invalid data" }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { password_hash: true } })
  if (!dbUser?.password_hash) {
    // Google/GitHub/Facebook-only account — there's no password to check
    // against, and setting one from here (without re-verifying identity
    // some other way) would be a real account-takeover risk if a session
    // ever leaked. Out of scope for this endpoint.
    return Response.json(
      { message: "This account signs in with Google/Facebook/GitHub and has no password to change." },
      { status: 400 }
    )
  }

  const validCurrent = await bcrypt.compare(result.data.currentPassword, dbUser.password_hash)
  if (!validCurrent) {
    return Response.json({ message: "Current password is incorrect" }, { status: 401 })
  }

  const password_hash = await bcrypt.hash(result.data.newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password_hash } })

  return Response.json({ message: "Password updated" })
}
