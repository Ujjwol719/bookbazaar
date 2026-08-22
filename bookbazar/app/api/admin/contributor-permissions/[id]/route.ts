import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const patchSchema = z.object({
  isActive: z.boolean(),
})

// Revoke/restore, never a hard delete — keeps the grant's history (who
// granted it, when) intact for admins reviewing a contributor later.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = patchSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  const permission = await prisma.contributorPermission.findUnique({ where: { id } })
  if (!permission) {
    return Response.json({ message: "Permission not found" }, { status: 404 })
  }

  const updated = await prisma.contributorPermission.update({
    where: { id },
    data: { isActive: result.data.isActive },
  })

  return Response.json({ message: result.data.isActive ? "Access restored" : "Access revoked", permission: updated })
}
