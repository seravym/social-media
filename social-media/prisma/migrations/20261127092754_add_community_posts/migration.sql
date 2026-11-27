-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "communityId" INTEGER;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "birthDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "UserSettings" (
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
CREATE INDEX IF NOT EXISTS "Post_communityId_createdAt_idx" ON "Post"("communityId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserSettings_userId_fkey'
    ) THEN
        ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Post_communityId_fkey'
    ) THEN
        ALTER TABLE "Post" ADD CONSTRAINT "Post_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;