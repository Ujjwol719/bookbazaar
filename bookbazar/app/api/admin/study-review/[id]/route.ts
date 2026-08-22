import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { applyCreditTransaction, getCreditSettings } from "@/lib/credits"
import { sendMaterialReviewedEmail } from "@/lib/resend/contributor-emails"
import { z } from "zod"

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
  reviewNote: z.string().max(1000).optional(),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = decisionSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }
  const { decision, reviewNote } = result.data

  const material = await prisma.studyMaterial.findUnique({
    where: { id },
    include: { uploadedBy: { select: { email: true, full_name: true } } },
  })
  if (!material) {
    return Response.json({ message: "Material not found" }, { status: 404 })
  }
  // Only a PENDING or CHANGES_REQUESTED item can be decided on — this is
  // the guard that makes double-rewarding impossible: an already-APPROVED
  // material can never re-enter this transition.
  if (material.status !== "PENDING" && material.status !== "CHANGES_REQUESTED") {
    return Response.json({ message: "This material was already reviewed" }, { status: 409 })
  }

  if (decision === "REQUEST_CHANGES" && !reviewNote) {
    return Response.json({ message: "A note is required so the contributor knows what to fix" }, { status: 400 })
  }

  const newStatus = decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED"

  let creditsAwarded = 0
  await prisma.$transaction(async (tx) => {
    await tx.studyMaterial.update({
      where: { id },
      data: { status: newStatus, reviewNote: reviewNote || null },
    })

    if (newStatus === "APPROVED") {
      const settings = await getCreditSettings(tx)
      creditsAwarded = settings.contributionReward
      if (creditsAwarded > 0) {
        await applyCreditTransaction(tx, {
          userId: material.uploadedById,
          amount: creditsAwarded,
          type: "CONTRIBUTION_REWARD",
          reason: `Approved contribution: "${material.title}"`,
          referenceType: "StudyMaterial",
          referenceId: material.id,
        })
      }
    }
  })

  try {
    await sendMaterialReviewedEmail({
      email: material.uploadedBy.email,
      name: material.uploadedBy.full_name,
      title: material.title,
      decision: newStatus as "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
      reviewNote,
      creditsEarned: creditsAwarded || undefined,
    })
  } catch (err) {
    console.error("Failed to send material review email:", err)
  }

  return Response.json({ message: `Marked as ${newStatus}`, creditsAwarded })
}
