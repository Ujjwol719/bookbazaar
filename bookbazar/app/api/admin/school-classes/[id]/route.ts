import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

// Classes 1-12 are a fixed domain (seeded once) — admin can rename/toggle
// them but not create or delete arbitrary ones.
const updateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
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

  const schoolClass = await prisma.schoolClass.update({ where: { id }, data: result.data })
  return Response.json({ message: "Class updated", schoolClass })
}
