import { prisma } from "./lib/prisma";

async function main() {
  let user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("Database kosong. Membuat user baru...");
    user = await prisma.user.create({
      data: {
        username: "sabrina",
        name: "Sabrina",
        email: "sabrina@test.com",
      }
    });
  }

  console.log("Pakai User dengan ID:", user.id);

  const notif = await prisma.notification.create({
    data: {
      userId: user.id,
      type: "follow",
      message: "Ini testing",
      isRead: false,
    }
  });
  
  console.log("Notifikasi berhasil dibuat dengan ID:", notif.id);
}

main().finally(() => prisma.$disconnect());