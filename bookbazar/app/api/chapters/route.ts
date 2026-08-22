import prisma from "@/lib/prisma"

// Public — chapters aren't sensitive. Used by the contributor upload form
// and Study Hub browsing pages to list a subject's chapters.
export async function GET(req: Request) {
  const subjectId = new URL(req.url).searchParams.get("subjectId")
  if (!subjectId) {
    return Response.json({ message: "subjectId is required" }, { status: 400 })
  }

  const chapters = await prisma.chapter.findMany({
    where: { subjectId, isActive: true },
    select: { id: true, title: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  })

  return Response.json(
    { chapters },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  )
}
