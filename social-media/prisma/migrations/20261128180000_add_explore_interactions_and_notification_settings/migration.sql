-- Add missing notification settings columns
ALTER TABLE "UserSettings"
ADD COLUMN IF NOT EXISTS "notifyLikes" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyFollows" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyReplies" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifyToast" BOOLEAN NOT NULL DEFAULT true;

-- Create Explore enums if they do not exist
DO $$ BEGIN
    CREATE TYPE "ExploreItemType" AS ENUM ('NEWS', 'TRENDING');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ExploreReactionType" AS ENUM ('LIKE', 'SAVED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create ExploreReaction table
CREATE TABLE IF NOT EXISTS "ExploreReaction" (
    "id" TEXT NOT NULL,
    "type" "ExploreItemType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "kind" "ExploreReactionType" NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExploreReaction_pkey" PRIMARY KEY ("id")
);

-- Create ExploreComment table
CREATE TABLE IF NOT EXISTS "ExploreComment" (
    "id" TEXT NOT NULL,
    "type" "ExploreItemType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExploreComment_pkey" PRIMARY KEY ("id")
);

-- ExploreReaction indexes
CREATE UNIQUE INDEX IF NOT EXISTS
"ExploreReaction_type_entityId_kind_userId_key"
ON "ExploreReaction"("type", "entityId", "kind", "userId");

CREATE INDEX IF NOT EXISTS
"ExploreReaction_type_entityId_kind_idx"
ON "ExploreReaction"("type", "entityId", "kind");

CREATE INDEX IF NOT EXISTS
"ExploreReaction_userId_createdAt_idx"
ON "ExploreReaction"("userId", "createdAt");

-- ExploreComment indexes
CREATE INDEX IF NOT EXISTS
"ExploreComment_type_entityId_createdAt_idx"
ON "ExploreComment"("type", "entityId", "createdAt");

CREATE INDEX IF NOT EXISTS
"ExploreComment_userId_createdAt_idx"
ON "ExploreComment"("userId", "createdAt");

-- Add User foreign keys if missing
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ExploreReaction_userId_fkey'
    ) THEN
        ALTER TABLE "ExploreReaction"
        ADD CONSTRAINT "ExploreReaction_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ExploreComment_userId_fkey'
    ) THEN
        ALTER TABLE "ExploreComment"
        ADD CONSTRAINT "ExploreComment_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
