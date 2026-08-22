import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const [requests, helperOf] = await Promise.all([
    prisma.helperRequest.findMany({
      where: { userId: user.id },
      include: { program: { include: { university: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.programHelper.findMany({
      where: { userId: user.id },
      include: { program: { include: { university: { select: { name: true } } } } },
    }),
  ])

  return Response.json({ requests, helperOf })
}
