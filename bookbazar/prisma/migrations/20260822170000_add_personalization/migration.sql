-- Real, tracked signals for the personalized homepage — recently viewed
-- books and search history — not invented per-user data.

CREATE TABLE "recently_viewed_books" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recently_viewed_books_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "recently_viewed_books_userId_bookId_key" ON "recently_viewed_books"("userId", "bookId");
CREATE INDEX "recently_viewed_books_userId_viewedAt_idx" ON "recently_viewed_books"("userId", "viewedAt");
ALTER TABLE "recently_viewed_books" ADD CONSTRAINT "recently_viewed_books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recently_viewed_books" ADD CONSTRAINT "recently_viewed_books_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "search_history_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_history_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "search_history_entries_userId_createdAt_idx" ON "search_history_entries"("userId", "createdAt");
ALTER TABLE "search_history_entries" ADD CONSTRAINT "search_history_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
