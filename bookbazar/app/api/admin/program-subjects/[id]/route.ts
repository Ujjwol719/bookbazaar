import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  const materialCount = await prisma.studyMaterial.count({ where: { programSubjectId: id } })
  if (materialCount > 0) {
    return Response.json(
      { message: `${materialCount} study material(s) use this assignment — remove those first.` },
      { status: 409 }
    )
  }

  await prisma.programSubject.delete({ where: { id } })
  return Response.json({ message: "Assignment removed" })
}
