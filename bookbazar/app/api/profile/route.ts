import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      full_name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      avatarUrl: true,
      created_at: true,
      googleId: true,
      githubId: true,
      facebookId: true,
      password_hash: true,
    },
  })

  if (!profile) {
    return Response.json({ message: "User not found" }, { status: 404 })
  }

  const { password_hash, ...safeProfile } = profile
  return Response.json({ profile: { ...safeProfile, hasPassword: !!password_hash } })
}
