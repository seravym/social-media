import { prisma } from "@/lib/prisma";
import { authed, noContent } from "@/lib/route";

export const POST = authed<{ params: Promise<{ id: string }> }>(
  async (user, _req, { params }) => {
    const { id } = await params;
    
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    
    return noContent();
  }
);