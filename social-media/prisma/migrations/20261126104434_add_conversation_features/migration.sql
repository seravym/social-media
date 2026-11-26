-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "background" TEXT;

-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "nickname" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "body" SET DEFAULT '';
