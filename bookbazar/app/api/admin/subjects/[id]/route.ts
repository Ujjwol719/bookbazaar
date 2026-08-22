import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
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

  const subject = await prisma.subject.update({ where: { id }, data: result.data })
  return Response.json({ message: "Subject updated", subject })
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params

  try {
    await prisma.subject.delete({ where: { id } })
    return Response.json({ message: "Subject deleted" })
  } catch {
    return Response.json(
      { message: "This subject is assigned to a class or program — remove those assignments first, or deactivate it instead." },
      { status: 409 }
    )
  }
}
