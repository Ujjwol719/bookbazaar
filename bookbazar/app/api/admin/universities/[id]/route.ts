import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  logoUrl: z.string().url().optional().nullable(),
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

  const university = await prisma.university.update({
    where: { id },
    data: result.data,
  })

  return Response.json({ message: "University updated", university })
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  // "Delete safely" — don't let a hard delete silently orphan or hide study
  // materials students have already been sent links to. If any exist under
  // this university, ask the admin to deactivate instead.
  const materialCount = await prisma.studyMaterial.count({
    where: { programSubject: { semester: { program: { universityId: id } } } },
  })

  if (materialCount > 0) {
    return Response.json(
      { message: `This university has ${materialCount} study material(s) under it — deactivate it instead of deleting, or remove those materials first.` },
      { status: 409 }
    )
  }

  await prisma.university.delete({ where: { id } })

  return Response.json({ message: "University deleted" })
}
