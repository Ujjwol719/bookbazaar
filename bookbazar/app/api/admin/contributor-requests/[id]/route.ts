import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { sendContributorRequestDecisionEmail } from "@/lib/resend/contributor-emails"
import { z } from "zod"

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
})

// Unlike the old program-wide Helper system, approving a request doesn't
// grant anything by itself — permissions here are subject-level, so admin
// grants the specific ClassSubject/ProgramSubject leaves separately via
// /api/admin/contributor-permissions once the request is approved.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = decisionSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid decision" }, { status: 400 })
  }

  const request = await prisma.contributorRequest.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, full_name: true } },
      schoolClass: { select: { name: true } },
      program: { select: { name: true, university: { select: { name: true } } } },
    },
  })
  if (!request) {
    return Response.json({ message: "Request not found" }, { status: 404 })
  }
  if (request.status !== "PENDING") {
    return Response.json({ message: "This request was already reviewed" }, { status: 409 })
  }

  const status = result.data.decision === "APPROVE" ? "APPROVED" : "REJECTED"

  const updated = await prisma.contributorRequest.update({
    where: { id },
    data: { status, reviewedById: payload!.id as string, reviewedAt: new Date() },
  })

  const targetLabel = request.schoolClass ? request.schoolClass.name : `${request.program?.name} — ${request.program?.university.name}`
  try {
    await sendContributorRequestDecisionEmail({
      email: request.user.email,
      name: request.user.full_name,
      targetLabel,
      approved: status === "APPROVED",
    })
  } catch (err) {
    // Email failing shouldn't fail the review decision — it already saved.
    console.error("Failed to send contributor request decision email:", err)
  }

  return Response.json({
    message: status === "APPROVED" ? "Request approved — grant subject access below." : "Request rejected",
    request: updated,
  })
}
