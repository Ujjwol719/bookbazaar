import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const resolveSchema = z.object({
  action: z.enum(["UNPUBLISH", "DISMISS"]),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = resolveSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  const report = await prisma.studyMaterialReport.findUnique({ where: { id } })
  if (!report) {
    return Response.json({ message: "Report not found" }, { status: 404 })
  }
  if (report.status !== "PENDING") {
    return Response.json({ message: "This report was already resolved" }, { status: 409 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.studyMaterialReport.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolvedById: payload!.id as string },
    })
    if (result.data.action === "UNPUBLISH") {
      await tx.studyMaterial.update({ where: { id: report.studyMaterialId }, data: { status: "UNPUBLISHED" } })
    }
  })

  return Response.json({ message: result.data.action === "UNPUBLISH" ? "Material unpublished" : "Report dismissed" })
}
