import { prisma } from "../lib/prisma";

const NEWS = [
    { title: "Jaemin NCT DREAM Hadir di Pop-up Anniversary Lee 101 di Seoul", summary: "Kehadiran Jaemin menarik ribuan penggemar di pusat kota Seoul.", category: "Entertainment", postCount: 61000 },
    { title: "Indonesia Libas Bangladesh 6-1 di Babak Pertama Laga Piala ASEAN", summary: "Timnas Indonesia tampil dominan pada babak pertama dan unggul 6-1.", category: "Sports", postCount: 573 },
    { title: "EVAN Buka Heetober dengan Kemenangan Musik dan Ulang Tahun", summary: "Penyanyi EVAN merayakan ulang tahun sekaligus kemenangan musiknya.", category: "Entertainment", postCount: 22000 },
    { title: "Presiden Umumkan Reshuffle Kabinet dan Kapolri Baru", summary: "Pergantian jajaran kabinet diumumkan dalam konferensi pers pagi ini.", category: "News", postCount: 27500 },
    { title: "BMKG Prediksi Hujan Lebat di Sebagian Wilayah Jabodetabek", summary: "BMKG mengimbau warga waspada banjir dan angin kencang.", category: "News", postCount: 14200 },
    { title: "Final Ganda Campuran Tutup Turnamen dengan Skor Dramatis", summary: "Pertandingan berakhir lewat tiga gim yang menegangkan.", category: "Sports", postCount: 33100 },
    { title: "Pemerintah Siapkan Aturan Baru Keamanan Data Pribadi", summary: "Aturan turunan akan mengatur kewajiban perusahaan pengelola data.", category: "News", postCount: 9800 },
    { title: "Drakor Terbaru Pecahkan Rekor Rating Episode Perdana", summary: "Episode perdana mencetak rating tertinggi sepanjang tahun ini.", category: "Entertainment", postCount: 18300 },
];

const TRENDING = [
    { name: "#TimnasDay", category: "Sports", postCount: 48200 },
    { name: "Rizky Ridho", category: "Sports", postCount: 21500 },
    { name: "Iseng", category: "News", postCount: 96400 },
    { name: "Lubang Buaya", category: "News", postCount: 33100 },
    { name: "Justin Hubner", category: "Sports", postCount: 18700 },
    { name: "Heetober", category: "Entertainment", postCount: 27800 },
    { name: "Comeback K-Pop Minggu Depan", category: "Entertainment", postCount: 52300 },
    { name: "Reshuffle Kabinet", category: "News", postCount: 41700 },
    { name: "Derby Akhir Pekan", category: "Sports", postCount: 12900 },
    { name: "Plot Twist Drakor", category: "Entertainment", postCount: 15400 },
];

const USERS = [
    { username: "detikcom", name: "detikcom" },
    { username: "bintangemon", name: "haduhaduh" },
    { username: "jokowi", name: "Joko Widodo" },
    { username: "bagus_bola", name: "Bagus Bola" },
    { username: "dimasruns", name: "Dimas" },
    { username: "wulan_bwf", name: "Wulan" },
    { username: "fajar_fc", name: "Fajar" },
    { username: "nadia_pitch", name: "Nadia" },
    { username: "yoga_sport", name: "Yoga" },
    { username: "sinta_drakor", name: "Sinta" },
];

const POSTS = [
    { author: "dimasruns", category: "Sports", content: "Timnas main bagus banget malam ini, 6-1 di babak pertama!", replyCount: 19, likeCount: 27, views: 675 },
    { author: "bagus_bola", category: "Sports", content: "Timnas tampil agresif sejak menit awal, transisi bertahan ke menyerang makin rapi.", replyCount: 19, likeCount: 67, views: 1700 },
    { author: "wulan_bwf", category: "Sports", content: "Ganda campuran kita makin solid, nonton final semalam seru banget.", replyCount: 16, likeCount: 25, views: 528 },
    { author: "fajar_fc", category: "Sports", content: "Derby akhir pekan ini bakal panas. Prediksi skor kalian?", replyCount: 8, likeCount: 41, views: 920 },
    { author: "detikcom", category: "News", content: "BMKG mengimbau warga Jabodetabek waspada hujan lebat dan angin kencang sore ini.", replyCount: 34, likeCount: 210, views: 15400 },
    { author: "nadia_pitch", category: "News", content: "Reminder: aktifkan 2FA di semua akun penting kalian, sekarang juga.", replyCount: 12, likeCount: 88, views: 3100 },
    { author: "sinta_drakor", category: "Entertainment", content: "Episode kemarin plot twist-nya bikin nggak bisa tidur.", replyCount: 22, likeCount: 150, views: 4800 },
    { author: "yoga_sport", category: "Entertainment", content: "Comeback minggu depan sudah masuk daftar tunggu, siapa yang ikut war tiket?", replyCount: 15, likeCount: 96, views: 2600 },
];

async function main() {
    if ((await prisma.news.count()) === 0) {
        const now = Date.now();
        await prisma.news.createMany({
        data: NEWS.map((n, i) => ({
            ...n,
            createdAt: new Date(now - (i + 1) * 90 * 60 * 1000),
        })),
        });
    }

    await prisma.trendingTopic.createMany({ data: TRENDING, skipDuplicates: true });

    const ids = new Map<string, string>();
    for (const u of USERS) {
        const user = await prisma.user.upsert({
        where: { username: u.username },
        update: {},
        create: { username: u.username, name: u.name, email: `${u.username}@example.com` },
        });
        ids.set(u.username, user.id);
    }

    if ((await prisma.explorePost.count()) === 0) {
        const now = Date.now();
        await prisma.explorePost.createMany({
        data: POSTS.map((p, i) => ({
            content: p.content,
            category: p.category,
            replyCount: p.replyCount,
            likeCount: p.likeCount,
            views: p.views,
            authorId: ids.get(p.author)!,
            createdAt: new Date(now - (i + 1) * 60 * 60 * 1000),
        })),
    });
    }

    console.log("Seed Explore selesai");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());