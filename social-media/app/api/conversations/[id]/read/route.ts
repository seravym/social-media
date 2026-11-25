import { prisma } from "@/lib/prisma";
import { authed, json, noContent } from "@/lib/route";

export const POST = authed<{ params: Promise<{ id: string }> }>(
  async (user, _req, { params }) => {
    const { id } = await params;

    const updated = await prisma.conversationMember.updateMany({
      where: { conversationId: id, userId: user.id },
      data: { lastReadAt: new Date() },
    });

    if (updated.count === 0) {
      return json({ error: "Conversation not found" }, 404);
    }

    return noContent();
  }
);
