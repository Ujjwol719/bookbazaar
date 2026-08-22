import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
})

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const { id } = await context.params
  const result = decisionSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid decision" }, { status: 400 })
  }

  const request = await prisma.helperRequest.findUnique({ where: { id } })
  if (!request) {
    return Response.json({ message: "Request not found" }, { status: 404 })
  }
  if (request.status !== "PENDING") {
    return Response.json({ message: "This request was already reviewed" }, { status: 409 })
  }

  const status = result.data.decision === "APPROVE" ? "APPROVED" : "REJECTED"

  // Approving a request and granting the actual permission need to happen
  // together — a transaction, not two separate writes that could partially
  // fail (the exact gap flagged elsewhere in this codebase's order flow).
  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.helperRequest.update({
      where: { id },
      data: { status, reviewedById: payload!.id as string, reviewedAt: new Date() },
    })

    if (status === "APPROVED") {
      await tx.programHelper.upsert({
        where: { userId_programId: { userId: request.userId, programId: request.programId } },
        update: {},
        create: { userId: request.userId, programId: request.programId },
      })
    }

    return updatedRequest
  })

  return Response.json({ message: status === "APPROVED" ? "Request approved" : "Request rejected", request: updated })
}
