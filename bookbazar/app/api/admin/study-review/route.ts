import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const statusParam = new URL(req.url).searchParams.get("status")
  const where = statusParam
    ? { status: statusParam as "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "UNPUBLISHED" }
    : { status: { in: ["PENDING", "CHANGES_REQUESTED"] as ("PENDING" | "CHANGES_REQUESTED")[] } }

  const materials = await prisma.studyMaterial.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, full_name: true, email: true } },
      chapter: { select: { title: true } },
      classSubject: { include: { subject: true, schoolClass: true, stream: true } },
      programSubject: { include: { subject: true, semester: { include: { program: { include: { university: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
  })

  // Flag duplicate-hash siblings for the reviewer — informational only,
  // never an automatic block.
  const hashes = materials.map((m) => m.fileHash).filter(Boolean) as string[]
  const duplicateCounts = hashes.length
    ? await prisma.studyMaterial.groupBy({
        by: ["fileHash"],
        where: { fileHash: { in: hashes } },
        _count: { fileHash: true },
      })
    : []
  const duplicateHashes = new Set(duplicateCounts.filter((d) => d._count.fileHash > 1).map((d) => d.fileHash))

  const withFlags = materials.map((m) => ({ ...m, possibleDuplicate: !!m.fileHash && duplicateHashes.has(m.fileHash) }))

  return Response.json({ materials: withFlags })
}
