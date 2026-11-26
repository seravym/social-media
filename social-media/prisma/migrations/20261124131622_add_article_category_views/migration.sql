-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Technology',
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;
