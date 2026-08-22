import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const materials = await prisma.studyMaterial.findMany({
    where: { uploadedById: user.id },
    include: {
      chapter: { select: { title: true } },
      classSubject: { include: { subject: true, schoolClass: true, stream: true } },
      programSubject: { include: { subject: true, semester: { include: { program: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ materials })
}
