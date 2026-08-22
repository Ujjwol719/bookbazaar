import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const [requests, permissions] = await Promise.all([
    prisma.contributorRequest.findMany({
      where: { userId: user.id },
      include: {
        schoolClass: { select: { name: true } },
        program: { select: { name: true, university: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contributorPermission.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        classSubject: { include: { subject: true, schoolClass: true, stream: true } },
        programSubject: { include: { subject: true, semester: { include: { program: { include: { university: true } } } } } },
      },
    }),
  ])

  return Response.json({ requests, permissions })
}
