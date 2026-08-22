import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

// Exactly one of schoolClassId/programId — the same either/or leaf pattern
// used throughout Study Hub. The request itself stays coarse ("I want to
// help with this Class/Program"); admin grants precise per-subject access
// separately once approved — see /api/admin/contributor-permissions.
const requestSchema = z
  .object({
    schoolClassId: z.string().min(1).optional(),
    programId: z.string().min(1).optional(),
    message: z.string().max(500).optional(),
  })
  .refine((d) => !!d.schoolClassId !== !!d.programId, {
    message: "Choose either a class or a program, not both",
  })

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = requestSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { schoolClassId, programId, message } = result.data

  let targetLabel: string
  if (schoolClassId) {
    const schoolClass = await prisma.schoolClass.findUnique({ where: { id: schoolClassId } })
    if (!schoolClass || !schoolClass.isActive) {
      return Response.json({ message: "Class not found" }, { status: 404 })
    }
    targetLabel = schoolClass.name
  } else {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { university: { select: { name: true } } },
    })
    if (!program || !program.isActive) {
      return Response.json({ message: "Program not found" }, { status: 404 })
    }
    targetLabel = `${program.name} — ${program.university.name}`
  }

  // Postgres doesn't de-dupe rows with a NULL in a compound key, so the
  // "already have a pending request for this target" check is manual —
  // same workaround used for ClassSubject/ContributorPermission.
  const existing = await prisma.contributorRequest.findFirst({
    where: { userId: user.id, schoolClassId: schoolClassId ?? null, programId: programId ?? null },
  })

  if (existing?.status === "PENDING") {
    return Response.json({ message: "You already have a pending request for this" }, { status: 409 })
  }

  // A previous REJECTED request doesn't block trying again — resubmit it.
  const request = existing
    ? await prisma.contributorRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING", message: message || null, reviewedById: null, reviewedAt: null },
      })
    : await prisma.contributorRequest.create({
        data: { userId: user.id, schoolClassId: schoolClassId || null, programId: programId || null, message: message || null },
      })

  return Response.json(
    { message: `Request sent for ${targetLabel}. An admin will review it.`, request },
    { status: 201 }
  )
}
