import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const patchSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = patchSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  const chapter = await prisma.chapter.findUnique({ where: { id } })
  if (!chapter) {
    return Response.json({ message: "Chapter not found" }, { status: 404 })
  }

  const updated = await prisma.chapter.update({ where: { id }, data: result.data })
  return Response.json({ chapter: updated })
}

// Deleting a chapter is safe by design — StudyMaterial.chapterId is a
// SetNull relation, so existing uploads just become chapterless instead of
// being destroyed or blocked.
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const chapter = await prisma.chapter.findUnique({ where: { id } })
  if (!chapter) {
    return Response.json({ message: "Chapter not found" }, { status: 404 })
  }

  await prisma.chapter.delete({ where: { id } })
  return Response.json({ message: "Chapter deleted" })
}
