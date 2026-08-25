import "server-only"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"

// Below this score (0-1, pg_trgm's own scale), a "match" is noise, not a
// typo — this is what stops "xyzabc123" from pulling back unrelated
// books. 0.3 is pg_trgm's own documented default threshold
// (pg_trgm.word_similarity_threshold) and cleared every example in the
// spec with room to spare (0.53-0.79) while real mismatches scored 0.
const FUZZY_SIMILARITY_THRESHOLD = 0.3

/**
 * Typo-tolerant candidate lookup, by trigram word-similarity on title/author.
 *
 * Why trigram similarity and not literal Levenshtein distance: computing
 * Levenshtein against every row means comparing the query to N book titles
 * on every search keystroke — fine for a few hundred books, a real cost
 * once the catalog grows. Postgres's pg_trgm extension breaks each title
 * into overlapping 3-character fragments ("trigrams") and indexes them
 * with a GIN index (see the fuzzy-search migration) — the same title/
 * author columns already used for the existing substring search. A query
 * for "muna modan" only has to look up the trigrams it shares with real
 * titles via the index, not scan the table — that's what makes this scale
 * with catalog size the way a normal indexed WHERE clause does, instead of
 * a full-table computation.
 *
 * word_similarity(query, title), not plain similarity(): plain similarity
 * penalizes the query for being shorter than the title (a whole-string
 * Jaccard-style score), so a short typo like "Harry Poter" barely
 * registers against a long title like "Harry Potter and the Goblet of
 * Fire". word_similarity instead finds the best-matching word-extent
 * *within* the title, which is what a search box actually needs. Both are
 * case-insensitive already — no extra normalization needed for that.
 *
 * Returns book ids ranked by similarity — the caller re-fetches the full
 * rows through the normal Prisma query so store/isActive/isApproved
 * filtering stays in exactly one place.
 */
export async function fuzzySearchBookIds(query: string, limit = 50): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT b.id
    FROM "books" b
    JOIN "stores" s ON s.id = b."storeId"
    WHERE b."isActive" = true
      AND s."isActive" = true
      AND s."isApproved" = true
      AND (
        word_similarity(${trimmed}, b."title") > ${FUZZY_SIMILARITY_THRESHOLD}
        OR word_similarity(${trimmed}, COALESCE(b."author", '')) > ${FUZZY_SIMILARITY_THRESHOLD}
      )
    ORDER BY GREATEST(word_similarity(${trimmed}, b."title"), word_similarity(${trimmed}, COALESCE(b."author", ''))) DESC
    LIMIT ${limit}
  `)

  return rows.map((r) => r.id)
}
