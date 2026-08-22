import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const reports = await prisma.studyMaterialReport.findMany({
    where: { status: "PENDING" },
    include: {
      studyMaterial: { select: { id: true, title: true, slug: true, status: true } },
      reportedBy: { select: { full_name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ reports })
}
