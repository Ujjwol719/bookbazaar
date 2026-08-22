import prisma from "@/lib/prisma"

// Public — homepage reads active banners in display order.
export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      imageUrl: true,
      title: true,
      subtitle: true,
      linkUrl: true,
    },
  })

  return Response.json(
    { banners },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  )
}
