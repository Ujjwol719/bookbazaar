import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const schoolClasses = await prisma.schoolClass.findMany({
    orderBy: { level: "asc" },
    include: { _count: { select: { classSubjects: true } } },
  })

  return Response.json({ schoolClasses })
}
