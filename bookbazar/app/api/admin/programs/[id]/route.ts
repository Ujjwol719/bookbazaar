import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  totalSemesters: z.number().int().min(1).max(12).optional(),
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

  const program = await prisma.program.update({ where: { id }, data: result.data })
  return Response.json({ message: "Program updated", program })
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  const materialCount = await prisma.studyMaterial.count({
    where: { programSubject: { semester: { programId: id } } },
  })

  if (materialCount > 0) {
    return Response.json(
      { message: `This program has ${materialCount} study material(s) under it — deactivate it instead, or remove those materials first.` },
      { status: 409 }
    )
  }

  await prisma.program.delete({ where: { id } })
  return Response.json({ message: "Program deleted" })
}
