import prisma from "@/lib/prisma";
import { fuzzySearchBookIds } from "@/lib/fuzzy-search";

export async function GET(req: Request){
const { searchParams } = new URL(req.url)
const search = searchParams.get("search")?.trim()
const category = searchParams.get("category")?.trim()

// Existing substring search — unchanged. Exact/substring hits always
// come first in the response; fuzzy (typo-tolerant) results are only
// appended after, below, so this stays the higher-priority match set.
const data= await prisma.book.findMany({
where:{
    isActive:true,
    store:{
        isActive:true,
        isApproved:true
    },
    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              author: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              isbn: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {})
},
take: search ? 50 : 10,
orderBy:{
    createdAt:"desc"
}
})

// Typo-tolerant fallback — only when there's a search term. Finds books
// with a similar (not identical) title/author via Postgres trigram
// similarity, so "Muna Modan" still finds "Muna Madan" even though it
// never substring-matches it. Ids already in `data` are skipped so a book
// never appears twice, and results stay in similarity order.
if (search) {
  const alreadyMatchedIds = new Set(data.map((book) => book.id))
  const fuzzyIds = (await fuzzySearchBookIds(search)).filter((id) => !alreadyMatchedIds.has(id))

  if (fuzzyIds.length > 0) {
    const fuzzyBooks = await prisma.book.findMany({
      where: {
        id: { in: fuzzyIds },
        ...(category ? { category: { slug: category } } : {}),
      },
    })
    const fuzzyBooksById = new Map(fuzzyBooks.map((book) => [book.id, book]))
    const orderedFuzzyBooks = fuzzyIds.map((id) => fuzzyBooksById.get(id)).filter((book) => book !== undefined)

    data.push(...orderedFuzzyBooks.slice(0, Math.max(0, 50 - data.length)))
  }
}

return Response.json(data)
}