import prisma from "@/lib/prisma"

// Public — used by the "become a contributor" picker for the school side,
// same idea as /api/universities for the university side. Only active
// classes, only the fields needed to pick one.
export async function GET() {
  const schoolClasses = await prisma.schoolClass.findMany({
    where: { isActive: true },
    orderBy: { level: "asc" },
    select: { id: true, level: true, name: true, hasStreams: true },
  })

  return Response.json(
    { schoolClasses },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  )
}
