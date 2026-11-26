import { prisma } from "../lib/prisma";

const body = (t: string) =>
    `${t}\n\nIni adalah isi artikel contoh yang cukup panjang supaya lolos validasi minimal 80 karakter. Pisahkan paragraf dengan satu baris kosong.\n\nParagraf ketiga untuk melengkapi isi artikel contoh ini.`;

async function main() {
    const author = await prisma.user.upsert({
        where: { username: "seed_author" },
        update: {},
        create: {
        email: "seed_author@example.com",
        username: "seed_author",
        name: "Seed Author",
        },
    });

    const samples = [
        { title: "Mengapa Kolom Pencarian Sering Gagal Dipahami Pengguna", category: "Design" },
        { title: "Memindahkan 40 Juta Baris Data Tanpa Downtime", category: "Technology" },
        { title: "Grafik Batang yang Jujur: Lima Aturan untuk Analis Pemula", category: "Data" },
        { title: "Dari V60 ke Espresso: Cara Memilih Biji Kopi untuk Kedai Kecil", category: "Food" },
        { title: "Tiga Hari di Labuan Bajo: Rute, Biaya, dan Hal yang Saya Sesali", category: "Travel" },
    ];

    for (const s of samples) {
        const exists = await prisma.article.findFirst({ where: { title: s.title } });
        if (exists) continue;
        await prisma.article.create({
        data: {
            title: s.title,
            category: s.category,
            content: body(s.title),
            authorId: author.id,
            views: Math.floor(Math.random() * 3000),
        },
        });
    }
    console.log("Seed artikel selesai");
    }

main()
    .catch((e) => {
        console.error(e);
        process.exit(1)
    })
    .finally(() => prisma.$disconnect());