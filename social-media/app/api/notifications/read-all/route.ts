import { prisma } from "@/lib/prisma";
import { authed, noContent } from "@/lib/route";

export const POST = authed(async (user) => {
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  return noContent();
});