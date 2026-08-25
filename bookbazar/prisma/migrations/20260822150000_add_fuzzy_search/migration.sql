-- Typo-tolerant search: pg_trgm trigram similarity on book title/author,
-- GIN-indexed so it's a fast index scan, not a per-row Levenshtein
-- comparison against the whole catalog. Not represented in schema.prisma
-- (Prisma's classic schema syntax has no way to declare a GIN/trgm index),
-- so this migration is the source of truth for it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "books_title_trgm_idx" ON "books" USING gin ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "books_author_trgm_idx" ON "books" USING gin ("author" gin_trgm_ops);
