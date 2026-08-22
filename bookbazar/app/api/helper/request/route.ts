import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const requestSchema = z.object({
  programId: z.string().min(1, "Choose a program"),
  message: z.string().max(500).optional(),
})

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = requestSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { programId, message } = result.data

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { university: { select: { name: true } } },
  })
  if (!program || !program.isActive) {
    return Response.json({ message: "Program not found" }, { status: 404 })
  }

  const alreadyHelper = await prisma.programHelper.findUnique({
    where: { userId_programId: { userId: user.id, programId } },
  })
  if (alreadyHelper) {
    return Response.json({ message: "You're already a helper for this program" }, { status: 409 })
  }

  const existing = await prisma.helperRequest.findUnique({
    where: { userId_programId: { userId: user.id, programId } },
  })

  if (existing?.status === "PENDING") {
    return Response.json({ message: "You already have a pending request for this program" }, { status: 409 })
  }

  // A previous REJECTED request doesn't block trying again — resubmit it.
  const request = existing
    ? await prisma.helperRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING", message: message || null, reviewedById: null, reviewedAt: null },
      })
    : await prisma.helperRequest.create({
        data: { userId: user.id, programId, message: message || null },
      })

  return Response.json(
    { message: `Request sent for ${program.name} at ${program.university.name}. An admin will review it.`, request },
    { status: 201 }
  )
}
