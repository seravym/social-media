import { prisma } from "../lib/prisma";

const MOCK_USER_ID = "cmw9dzn1h00004okr31yn29tn";

async function main() {
    const user = await prisma.user.upsert({
        where: { id: MOCK_USER_ID },
        update: {},
        create: {
        id: MOCK_USER_ID,
        email: "mock-user@example.com",
        username: "mock_user",
        name: "Mock User",
        },
    });
    console.log("Mock user siap:", user.id, user.username);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());