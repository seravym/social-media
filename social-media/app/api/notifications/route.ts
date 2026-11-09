import { prisma } from "@/lib/prisma";
import { toUserCard, userCardSelect } from "@/lib/dto"; 
import { authed, json } from "@/lib/route"; 
import type { NotificationDto } from "@/lib/types"; 

export const GET = authed(async (user, req) => {
  const tab = new URL(req.url).searchParams.get("tab");
  
  const rows = await prisma.notification.findMany({
    where: { 
      userId: user.id, 
      ...(tab === "mentions" ? { type: "mention" } : {}) 
    },
    include: { actor: { select: userCardSelect } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  const items: NotificationDto[] = rows.map((n) => ({
    id: n.id,
    type: n.type as NotificationDto["type"],
    actor: n.actor ? toUserCard(n.actor) : null,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return json({ items, unreadCount });
});