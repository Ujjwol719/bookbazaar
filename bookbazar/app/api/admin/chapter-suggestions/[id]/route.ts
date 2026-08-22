import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = decisionSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid decision" }, { status: 400 })
  }

  const suggestion = await prisma.chapterSuggestion.findUnique({ where: { id } })
  if (!suggestion) {
    return Response.json({ message: "Suggestion not found" }, { status: 404 })
  }
  if (suggestion.status !== "PENDING") {
    return Response.json({ message: "This suggestion was already reviewed" }, { status: 409 })
  }

  if (result.data.decision === "REJECT") {
    const updated = await prisma.chapterSuggestion.update({
      where: { id },
      data: { status: "REJECTED", reviewedById: payload!.id as string, reviewedAt: new Date() },
    })
    return Response.json({ message: "Suggestion rejected", suggestion: updated })
  }

  // Approve — create the real chapter and link the suggestion to it,
  // together, so a suggestion can never end up APPROVED without a chapter.
  const chapterCount = await prisma.chapter.count({ where: { subjectId: suggestion.subjectId } })
  const result_ = await prisma.$transaction(async (tx) => {
    const chapter = await tx.chapter.create({
      data: { subjectId: suggestion.subjectId, title: suggestion.title, sortOrder: chapterCount },
    })
    const updatedSuggestion = await tx.chapterSuggestion.update({
      where: { id },
      data: { status: "APPROVED", chapterId: chapter.id, reviewedById: payload!.id as string, reviewedAt: new Date() },
    })
    return { chapter, updatedSuggestion }
  })

  return Response.json({ message: "Chapter created from suggestion", ...result_ })
}
