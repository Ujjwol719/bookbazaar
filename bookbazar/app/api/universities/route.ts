import prisma from "@/lib/prisma"

// Public — used by the "become a helper" picker and the Study Hub browsing
// pages. Only active universities/programs, and only the fields needed to
// pick one; no admin-only data.
export async function GET() {
  const universities = await prisma.university.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      programs: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  })

  return Response.json(
    { universities },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  )
}
