import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const updateSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = updateSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const semester = await prisma.semester.update({ where: { id }, data: result.data })
  return Response.json({ message: "Semester updated", semester })
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  const materialCount = await prisma.studyMaterial.count({
    where: { programSubject: { semesterId: id } },
  })

  if (materialCount > 0) {
    return Response.json(
      { message: `This semester has ${materialCount} study material(s) under it — remove those first.` },
      { status: 409 }
    )
  }

  await prisma.semester.delete({ where: { id } })
  return Response.json({ message: "Semester deleted" })
}
