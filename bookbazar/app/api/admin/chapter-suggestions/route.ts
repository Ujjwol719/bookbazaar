import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const subjectId = new URL(req.url).searchParams.get("subjectId") || undefined
  const statusParam = new URL(req.url).searchParams.get("status")

  const suggestions = await prisma.chapterSuggestion.findMany({
    where: {
      ...(subjectId ? { subjectId } : {}),
      status: (statusParam as "PENDING" | "APPROVED" | "REJECTED") || "PENDING",
    },
    include: { suggestedBy: { select: { full_name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ suggestions })
}
