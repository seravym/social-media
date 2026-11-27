-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "communityId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "language" TEXT NOT NULL DEFAULT 'id',
    "protectPosts" BOOLEAN NOT NULL DEFAULT false,
    "allowPhotoTag" BOOLEAN NOT NULL DEFAULT true,
    "showInSuggestions" BOOLEAN NOT NULL DEFAULT true,
    "whoCanReply" TEXT NOT NULL DEFAULT 'everyone',
    "whoCanTag" TEXT NOT NULL DEFAULT 'everyone',
    "whoCanMessage" TEXT NOT NULL DEFAULT 'everyone',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Post_communityId_createdAt_idx" ON "Post"("communityId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
