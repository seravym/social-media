import "dotenv/config";
import { prisma } from "../lib/prisma";

const users = [
  {
    id: "seed_user_alice",
    email: "alice@example.com",
    username: "alice",
    name: "Alice",
  },
  {
    id: "seed_user_bob",
    email: "bob@example.com",
    username: "bob",
    name: "Bob",
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });
  }

  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
