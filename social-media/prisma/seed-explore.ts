// Simpan sebagai: prisma/seed-explore.ts
// Jalankan: npx tsx prisma/seed-explore.ts
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

async function main() {
  if ((await prisma.news.count()) === 0) {
    const now = Date.now();
    // jarak waktu berbeda supaya "x jam lalu" bervariasi
    await prisma.news.createMany({
      data: NEWS.map((n, i) => ({
        ...n,
        createdAt: new Date(now - (i + 1) * 90 * 60 * 1000),
      })),
    });
  }
  await prisma.trendingTopic.createMany({ data: TRENDING, skipDuplicates: true });
  console.log("Seed Explore selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());