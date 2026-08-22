import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const requests = await prisma.helperRequest.findMany({
    include: {
      user: { select: { id: true, full_name: true, email: true } },
      program: { include: { university: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ requests })
}
