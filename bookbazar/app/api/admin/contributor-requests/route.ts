import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const requests = await prisma.contributorRequest.findMany({
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      schoolClass: { select: { id: true, name: true } },
      program: { select: { id: true, name: true, university: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ requests })
}
