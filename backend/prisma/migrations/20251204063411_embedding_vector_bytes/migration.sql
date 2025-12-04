/*
  Warnings:

  - You are about to drop the column `metadata` on the `Embedding` table. All the data in the column will be lost.
  - You are about to alter the column `vector` on the `Embedding` table. The data in that column could be lost. The data in that column will be cast from `String` to `Binary`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Embedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "text" TEXT NOT NULL,
    "vector" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Embedding" ("createdAt", "id", "sessionId", "text", "userId", "vector") SELECT "createdAt", "id", "sessionId", "text", "userId", "vector" FROM "Embedding";
DROP TABLE "Embedding";
ALTER TABLE "new_Embedding" RENAME TO "Embedding";
CREATE INDEX "Embedding_userId_idx" ON "Embedding"("userId");
CREATE INDEX "Embedding_userId_sessionId_idx" ON "Embedding"("userId", "sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
