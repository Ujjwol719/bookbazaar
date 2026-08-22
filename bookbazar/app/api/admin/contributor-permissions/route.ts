import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const grantSchema = z
  .object({
    userId: z.string().min(1),
    classSubjectId: z.string().min(1).optional(),
    programSubjectId: z.string().min(1).optional(),
  })
  .refine((d) => !!d.classSubjectId !== !!d.programSubjectId, {
    message: "Grant either a class subject or a program subject, not both",
  })

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const userId = new URL(req.url).searchParams.get("userId")
  if (!userId) {
    return Response.json({ message: "userId is required" }, { status: 400 })
  }

  const permissions = await prisma.contributorPermission.findMany({
    where: { userId },
    include: {
      classSubject: { include: { subject: true, stream: true } },
      programSubject: { include: { subject: true } },
    },
    orderBy: { grantedAt: "desc" },
  })

  return Response.json({ permissions })
}

export async function POST(req: Request) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const result = grantSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { userId, classSubjectId, programSubjectId } = result.data

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return Response.json({ message: "User not found" }, { status: 404 })
  }

  // Same nullable-leaf de-dupe gotcha as ClassSubject/ContributorRequest —
  // Postgres won't catch this at the DB level, so it's a manual lookup.
  const existing = await prisma.contributorPermission.findFirst({
    where: { userId, classSubjectId: classSubjectId ?? null, programSubjectId: programSubjectId ?? null },
  })

  if (existing) {
    if (existing.isActive) {
      return Response.json({ message: "This user already has access to this subject" }, { status: 409 })
    }
    // Re-activate a previously revoked grant instead of creating a duplicate row.
    const reactivated = await prisma.contributorPermission.update({
      where: { id: existing.id },
      data: { isActive: true, grantedById: payload!.id as string, grantedAt: new Date() },
    })
    return Response.json({ message: "Access restored", permission: reactivated }, { status: 200 })
  }

  const permission = await prisma.contributorPermission.create({
    data: { userId, classSubjectId: classSubjectId || null, programSubjectId: programSubjectId || null, grantedById: payload!.id as string },
  })

  return Response.json({ message: "Access granted", permission }, { status: 201 })
}
