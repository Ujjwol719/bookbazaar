import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const reportSchema = z.object({
  studyMaterialId: z.string().min(1),
  reason: z.string().min(5, "Please describe the issue").max(500),
})

// Post-publish "report this" — separate from the pre-publish review queue.
// Anyone can flag already-approved content for admin re-review.
export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = reportSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }
  const { studyMaterialId, reason } = result.data

  const material = await prisma.studyMaterial.findUnique({ where: { id: studyMaterialId } })
  if (!material) {
    return Response.json({ message: "Material not found" }, { status: 404 })
  }

  const report = await prisma.studyMaterialReport.create({
    data: { studyMaterialId, reportedById: user.id, reason },
  })

  return Response.json({ message: "Thanks — an admin will take a look.", report }, { status: 201 })
}
